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

async function captureWithFirecrawl(siteUrl: string): Promise<Uint8Array> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY not configured");
  }

  let formattedUrl = siteUrl.trim();
  if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
    formattedUrl = `https://${formattedUrl}`;
  }

  console.log(`Requesting Firecrawl screenshot for: ${formattedUrl}`);

  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: formattedUrl,
      formats: ["screenshot@fullPage"],
      waitFor: 3000,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Firecrawl API error ${response.status}: ${JSON.stringify(data)}`);
  }

  // screenshot is base64 encoded in the response
  const screenshotBase64 = data?.data?.screenshot || data?.screenshot;
  if (!screenshotBase64) {
    throw new Error("No screenshot returned by Firecrawl");
  }

  // Remove data:image/...;base64, prefix if present
  const base64Clean = screenshotBase64.replace(/^data:image\/[^;]+;base64,/, "");

  // Decode base64 to Uint8Array
  const binaryStr = atob(base64Clean);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  console.log(`Firecrawl screenshot received: ${(bytes.byteLength / 1024).toFixed(0)} KB`);

  if (bytes.byteLength < 10000) {
    throw new Error("Screenshot too small, likely a failed capture");
  }

  return bytes;
}

async function captureSite(
  supabase: any,
  site: { id: string; name: string; url: string }
): Promise<{ success: boolean; name: string; url: string; publicUrl?: string; error?: string }> {
  try {
    console.log(`Capturing ${site.name} (${site.url})...`);

    const imageBuffer = await captureWithFirecrawl(site.url);

    // Determine content type from first bytes
    const isPng = imageBuffer[0] === 137 && imageBuffer[1] === 80;
    const contentType = isPng ? "image/png" : "image/jpeg";
    const ext = isPng ? "png" : "jpg";
    const fileName = `${site.name}-full.${ext}`;

    // Remove old files (both extensions)
    await supabase.storage.from("site-screenshots").remove([`${site.name}-full.png`, `${site.name}-full.jpg`]);

    const { error: uploadError } = await supabase.storage
      .from("site-screenshots")
      .upload(fileName, imageBuffer, { contentType, upsert: true });

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
    console.log(`Done: ${site.name} → ${publicUrlData.publicUrl}`);
    return { success: true, name: site.name, url: site.url, publicUrl: publicUrlData.publicUrl };
  } catch (err) {
    return { success: false, name: site.name, url: site.url, error: String(err) };
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
        return { id: t.id, name: slug, url: t.website_url };
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

    // Process sequentially to avoid rate limits
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
