import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function deriveSlug(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname
      .replace(/^www\./, '')
      .replace(/\.[a-z]{2,}(\.[a-z]{2,})?$/i, '')
      .replace(/\./g, '')
      .toLowerCase();
  } catch {
    return '';
  }
}

async function captureSite(
  supabase: any,
  site: { id: string; name: string; url: string; needsSlugUpdate: boolean }
): Promise<{ success: boolean; name: string; url: string; publicUrl?: string; error?: string }> {
  try {
    console.log(`Capturing ${site.name}...`);

    if (site.needsSlugUpdate) {
      await supabase
        .from("testimonials")
        .update({ screenshot_slug: site.name })
        .eq("id", site.id);
    }

    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(site.url)}&screenshot=true&fullPage=true&scroll=true&viewport.width=1440&viewport.height=900&waitForTimeout=5000&waitUntil=networkidle0`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let response: Response;
    try {
      response = await fetch(microlinkUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();

    if (data.status !== "success" || !data.data?.screenshot?.url) {
      return { success: false, name: site.name, url: site.url, error: `Microlink: ${data.status}` };
    }

    const imageResponse = await fetch(data.data.screenshot.url);
    if (!imageResponse.ok) {
      return { success: false, name: site.name, url: site.url, error: `Download failed: ${imageResponse.status}` };
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const fileName = `${site.name}-full.png`;

    const { error: uploadError } = await supabase.storage
      .from("site-screenshots")
      .upload(fileName, imageBuffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      return { success: false, name: site.name, url: site.url, error: `Upload: ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase.storage.from("site-screenshots").getPublicUrl(fileName);
    console.log(`Done: ${site.name}`);
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

    // Optional: capture a single site by slug
    let filterSlug: string | null = null;
    try {
      const body = await req.json();
      filterSlug = body?.slug || null;
    } catch { /* no body is fine */ }

    const query = supabase
      .from("testimonials")
      .select("id, business_name, website_url, screenshot_slug")
      .eq("is_active", true)
      .not("website_url", "is", null);

    const { data: testimonials, error: fetchError } = await query;

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
      sites = sites.filter(s => s.name === filterSlug);
    }

    if (sites.length === 0) {
      return new Response(
        JSON.stringify({ success: true, results: [], errors: [], message: "No sites to capture" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process all sites in parallel
    const outcomes = await Promise.all(sites.map(site => captureSite(supabase, site)));

    const results = outcomes.filter(o => o.success).map(o => ({ name: o.name, url: o.url, publicUrl: o.publicUrl }));
    const errors = outcomes.filter(o => !o.success).map(o => ({ name: o.name, error: o.error }));

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
