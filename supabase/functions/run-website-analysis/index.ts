import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  seo: `You are a professional SEO consultant conducting a website audit for a small business client.

CRITICAL RULES:
- Identify ONLY the top 3 most impactful SEO improvements (or fewer if the site is already strong)
- Use plain business English — no jargon
- Keep tone professional, warm, and actionable
- Use emoji, bold (**text**), and italic (*text*) formatting throughout for readability

Structure your response EXACTLY as:

**📊 Overall Assessment**
2-3 sentences summarising the site's SEO health.

Then list up to 3 recommendations, each formatted as:

**🔹 [Number]. [Issue Title]**
*What we found:* Brief description of the issue.
**Why it matters:** How this affects their business/visibility.
**✅ Recommended action:** What specifically should be done.

Keep the entire analysis under 400 words. Write as if speaking directly to the business owner.`,

  infrastructure: `You are a web development professional conducting a technical health check for a small business website.

CRITICAL RULES:
- Identify ONLY the top 3 most critical technical issues (or fewer if the site is healthy)
- Use plain business language — avoid technical jargon
- Keep tone professional, warm, and actionable
- Use emoji, bold (**text**), and italic (*text*) formatting throughout for readability

Structure your response EXACTLY as:

**🏗️ Overall Health Summary**
2-3 sentences summarising the site's technical health.

Then list up to 3 findings, each formatted as:

**🔹 [Number]. [Issue Title]**
*What we found:* Brief description of the finding.
**Why it matters:** How this impacts reliability and user experience.
**✅ Recommended action:** What action should be taken.

Keep the entire analysis under 400 words. Write as if speaking directly to the business owner, not a developer.`,

  marketing: `You are a digital marketing strategist reviewing a small business website.

CRITICAL RULES:
- Identify ONLY the top 3 most impactful marketing improvements (or fewer if the site is well-optimised)
- Use clear, actionable business language
- Keep tone professional, warm, and strategic
- Use emoji, bold (**text**), and italic (*text*) formatting throughout for readability

Structure your response EXACTLY as:

**📈 Overall Marketing Assessment**
2-3 sentences summarising the site's marketing effectiveness.

Then list up to 3 recommendations, each formatted as:

**🔹 [Number]. [Issue Title]**
*What we found:* Brief description of the current situation.
**Why it matters:** How this limits conversions or engagement.
**✅ Recommended action:** What specific change would improve results.

Keep the entire analysis under 400 words. Write as if speaking to a business owner who wants more leads and better client engagement.`,
};

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  seo: "SEO Analysis",
  infrastructure: "Infrastructure Analysis",
  marketing: "Marketing Strategy Analysis",
};

async function fetchWebsiteContent(domain: string): Promise<string> {
  try {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SitedAnalysisBot/1.0" },
    });
    clearTimeout(timeout);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
    return text || "Could not extract meaningful content from this website.";
  } catch (e) {
    throw new Error(`Could not access website: ${(e as Error).message}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) throw new Error("Admin access required");

    const { clientIds, analysisType } = await req.json();
    if (!clientIds?.length || !analysisType) throw new Error("Missing clientIds or analysisType");
    if (!SYSTEM_PROMPTS[analysisType]) throw new Error("Invalid analysis type");

    const { data: clients, error: clientErr } = await supabase
      .from("leads")
      .select("id, name, email, business_name, website_url, industry, location")
      .in("id", clientIds);

    if (clientErr) throw clientErr;

    const results = [];

    for (const client of clients || []) {
      const domain = client.website_url;
      if (!domain) {
        results.push({
          clientId: client.id,
          businessName: client.business_name || client.name,
          domain: null,
          analysis: null,
          status: "failed",
          error: "No website domain on file",
        });
        continue;
      }

      try {
        const siteContent = await fetchWebsiteContent(domain);

        const userPrompt = `Please analyze the following website:

Domain: ${domain}
Business Name: ${client.business_name || "Unknown"}
Industry: ${client.industry || "Not specified"}
Location: ${client.location || "Not specified"}

Website content extracted:
${siteContent}

Conduct a ${ANALYSIS_TYPE_LABELS[analysisType]} and provide your findings following the structure requested in the system prompt. Remember: maximum 3 recommendations only.`;

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM_PROMPTS[analysisType] },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 2000,
          }),
        });

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          throw new Error(`AI API error (${aiResp.status}): ${errText}`);
        }

        const aiData = await aiResp.json();
        const analysisContent = aiData.choices?.[0]?.message?.content || "No analysis generated.";

        await supabase.from("analysis_reports").insert({
          lead_id: client.id,
          analysis_type: analysisType,
          domain,
          analysis_content: analysisContent,
          status: "success",
          created_by: user.id,
        });

        await supabase.from("leads").update({ last_analysis_date: new Date().toISOString() }).eq("id", client.id);

        results.push({
          clientId: client.id,
          businessName: client.business_name || client.name,
          domain,
          analysis: analysisContent,
          status: "success",
        });
      } catch (e) {
        const errMsg = (e as Error).message;
        await supabase.from("analysis_reports").insert({
          lead_id: client.id,
          analysis_type: analysisType,
          domain: domain || "unknown",
          status: "failed",
          error_message: errMsg,
          created_by: user.id,
        });

        results.push({
          clientId: client.id,
          businessName: client.business_name || client.name,
          domain,
          analysis: null,
          status: "failed",
          error: errMsg,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("run-website-analysis error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
