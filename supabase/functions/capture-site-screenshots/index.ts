import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITES_TO_CAPTURE = [
  { name: "hunterinsight", url: "https://hunterinsight.com.au" },
  { name: "inglebrown", url: "https://inglebrown.sited.co" },
  { name: "wisdomeducation", url: "https://wisdomeducation.org" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: { name: string; url: string; publicUrl: string }[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const site of SITES_TO_CAPTURE) {
      try {
        console.log(`Capturing screenshot for ${site.name}...`);

        // Use microlink.io to capture full-page screenshot with JS execution
        const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(site.url)}&screenshot=true&fullPage=true&scroll=true&viewport.width=1440&viewport.height=900&waitForTimeout=8000&waitUntil=networkidle0`;

        const response = await fetch(microlinkUrl);
        const data = await response.json();

        if (data.status !== "success" || !data.data?.screenshot?.url) {
          errors.push({ name: site.name, error: `Microlink failed: ${data.status} - ${JSON.stringify(data.message || data)}` });
          continue;
        }

        const screenshotUrl = data.data.screenshot.url;
        console.log(`Got screenshot URL for ${site.name}: ${screenshotUrl}`);

        // Download the screenshot image
        const imageResponse = await fetch(screenshotUrl);
        if (!imageResponse.ok) {
          errors.push({ name: site.name, error: `Failed to download image: ${imageResponse.status}` });
          continue;
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const fileName = `${site.name}-full.png`;

        // Upload to Supabase storage
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

        // Get public URL
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
