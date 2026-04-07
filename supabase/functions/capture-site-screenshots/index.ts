import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function deriveSlug(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname
      .replace(/^www\./, "")
      .replace(/\.[a-z]{2,}(\.[a-z]{2,})?$/i, "")
      .replace(/\./g, "")
      .toLowerCase();
  } catch {
    return "";
  }
}

function readPngDimensions(buffer: Uint8Array): { width: number; height: number } | null {
  if (buffer.length < 24) return null;
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < pngSignature.length; i++) {
    if (buffer[i] !== pngSignature[i]) return null;
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return { width, height };
}

function isValidFullPageScreenshot(buffer: Uint8Array): { valid: boolean; reason?: string } {
  if (buffer.byteLength < 25000) {
    return { valid: false, reason: "Screenshot too small, likely placeholder image" };
  }

  const dimensions = readPngDimensions(buffer);
  if (!dimensions) {
    return { valid: false, reason: "Invalid PNG returned by screenshot service" };
  }

  if (dimensions.height <= 1200) {
    return { valid: false, reason: `Screenshot height ${dimensions.height}px is too short to be a full homepage capture` };
  }

  if (dimensions.height <= dimensions.width) {
    return { valid: false, reason: `Screenshot ratio ${dimensions.width}x${dimensions.height} does not look like a full-page capture` };
  }

  return { valid: true };
}

async function fetchFullPageScreenshot(siteUrl: string): Promise<Uint8Array> {
  const candidateUrls = [
    `https://image.thum.io/get/width/1440/fullpage/noanimate/${siteUrl}`,
    `https://image.thum.io/get/fullpage/noanimate/${siteUrl}`,
    `https://image.thum.io/get/fullpage/${siteUrl}`,
  ];

  let lastError = "Unknown screenshot failure";

  for (const thumbUrl of candidateUrls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const imgResp = await fetch(thumbUrl, { signal: controller.signal });
      if (!imgResp.ok) {
        lastError = `Screenshot service returned ${imgResp.status}`;
        continue;
      }

      const imageBuffer = new Uint8Array(await imgResp.arrayBuffer());
      const validation = isValidFullPageScreenshot(imageBuffer);
      if (validation.valid) {
        return imageBuffer;
      }

      lastError = validation.reason || "Screenshot validation failed";
      console.log(`Rejected screenshot for ${siteUrl}: ${lastError}`);
    } catch (error) {
      lastError = String(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(lastError);
}

async function captureSite(
  supabase: any,
  site: { id: string; name: string; url: string; needsSlugUpdate: boolean }
): Promise<{ success: boolean; name: string; url: string; publicUrl?: string; error?: string }> {
  try {
    console.log(`Capturing ${site.name}...`);

    const imageBuffer = await fetchFullPageScreenshot(site.url);
    console.log(`Screenshot captured for ${site.name} (${(imageBuffer.byteLength / 1024).toFixed(0)} KB)`);

    const fileName = `${site.name}-full.png`;
    const { error: uploadError } = await supabase.storage
      .from("site-screenshots")
      .upload(fileName, imageBuffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      return { success: false, name: site.name, url: site.url, error: `Upload: ${uploadError.message}` };
    }

    await supabase
      .from("testimonials")
      .update({
        screenshot_slug: site.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", site.id);

    const { data: publicUrlData } = supabase.storage.from("site-screenshots").getPublicUrl(fileName);
    console.log(`Done: ${site.name}`);
    return { success: true, name: site.name, url: site.url, publicUrl: publicUrlData.publicUrl };
  } catch (err) {
    const msg = String(err);
    if (msg.includes("abort")) {
      return { success: false, name: site.name, url: site.url, error: "Timed out waiting for full-page screenshot" };
    }
    return { success: false, name: site.name, url: site.url, error: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let filterSlug: string | null = null;
    try {
      const body = await req.json();
      filterSlug = body?.slug || null;
    } catch { /* no body */ }

    const { data: testimonials, error: fetchError } = await supabase
      .from("testimonials")
      .select("id, business_name, website_url, screenshot_slug")
      .eq("is_active", true)
      .not("website_url", "is", null);

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sites = (testimonials || [])
      .filter((t: any) => t.website_url)
      .map((t: any) => {
        const slug = t.screenshot_slug || deriveSlug(t.website_url);
        return { id: t.id, name: slug, url: t.website_url, needsSlugUpdate: !t.screenshot_slug };
      })
      .filter((s) => s.name);

    if (filterSlug) {
      sites = sites.filter((s) => s.name === filterSlug);
    }

    if (sites.length === 0) {
      return new Response(
        JSON.stringify({ success: true, results: [], errors: [], message: "No sites to capture" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const outcomes: Awaited<ReturnType<typeof captureSite>>[] = [];
    for (const site of sites) {
      outcomes.push(await captureSite(supabase, site));
    }

    const results = outcomes.filter((o) => o.success).map((o) => ({ name: o.name, url: o.url, publicUrl: o.publicUrl }));
    const errors = outcomes.filter((o) => !o.success).map((o) => ({ name: o.name, error: o.error }));

    return new Response(
      JSON.stringify({ success: true, results, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});