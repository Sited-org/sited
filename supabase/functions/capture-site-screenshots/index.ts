import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all active testimonials with a website_url and screenshot_slug
    const { data: testimonials, error: fetchError } = await supabase
      .from("testimonials")
      .select("business_name, website_url, screenshot_slug")
      .eq("is_active", true)
      .not("website_url", "is", null)
      .not("screenshot_slug", "is", null);

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sites = (testimonials || [])
      .filter((t: any) => t.website_url && t.screenshot_slug)
      .map((t: any) => ({ name: t.screenshot_slug, url: t.website_url }));

    const results: { name: string; url: string; publicUrl: string }[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const site of sites) {
      try {
        console.log(`Capturing screenshot for ${site.name}...`);

        const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(site.url)}&screenshot=true&fullPage=true&scroll=true&viewport.width=1440&viewport.height=900&waitForTimeout=8000&waitUntil=networkidle0`;

        const response = await fetch(microlinkUrl);
        const data = await response.json();

        if (data.status !== "success" || !data.data?.screenshot?.url) {
          errors.push({ name: site.name, error: `Microlink failed: ${data.status} - ${JSON.stringify(data.message || data)}` });
          continue;
        }

        const screenshotUrl = data.data.screenshot.url;
        console.log(`Got screenshot URL for ${site.name}: ${screenshotUrl}`);

        const imageResponse = await fetch(screenshotUrl);
        if (!imageResponse.ok) {
          errors.push({ name: site.name, error: `Failed to download image: ${imageResponse.status}` });
          continue;
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const fileName = `${site.name}-full.png`;

        const { error: uploadError } = await supabase.storage
          .from("site-screenshots")
          .upload(fileName, imageBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          errors.push({ name: site.name, error: `Upload failed: ${uploadError.message}` });
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("site-screenshots")
          .getPublicUrl(fileName);

        results.push({
          name: site.name,
          url: site.url,
          publicUrl: publicUrlData.publicUrl,
        });

        console.log(`Successfully captured and stored ${site.name}: ${publicUrlData.publicUrl}`);
      } catch (err) {
        errors.push({ name: site.name, error: String(err) });
      }
    }

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
