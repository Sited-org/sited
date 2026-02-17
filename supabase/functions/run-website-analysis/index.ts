import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  seo: `You are a professional SEO consultant conducting a website audit for a small business client. Your role is to:
1. Analyse the provided website content thoroughly
2. Identify the top 5 SEO improvement opportunities
3. Explain each recommendation in plain business English (no jargon)
4. Prioritize recommendations by impact (quick wins first)
5. Keep your tone professional, warm, and actionable

Structure your response as:
- Brief overall assessment (2-3 sentences)
- 5 specific recommendations, each with:
  - What the issue is
  - Why it matters for their business
  - What should be done to fix it

Keep the entire analysis under 500 words. Write as if speaking directly to the business owner.`,

  infrastructure: `You are a web development professional conducting a technical health check for a small business website. Your role is to:
1. Analyse the website's technical infrastructure based on the provided content
2. Identify critical issues (security, performance, broken elements)
3. Explain findings in plain business language (avoid technical jargon)
4. Provide actionable recommendations prioritized by urgency

Structure your response as:
- Overall health summary (2-3 sentences)
- 5 specific findings, each with:
  - What was found
  - Why it matters for site reliability and user experience
  - What action should be taken

Keep the entire analysis under 500 words. Write as if speaking directly to the business owner, not a developer.`,

  marketing: `You are a digital marketing strategist reviewing a small business website. Your role is to:
1. Analyse the website's messaging, positioning, and conversion design
2. Identify opportunities to improve lead generation and client engagement
3. Provide strategic recommendations based on the business's industry and location
4. Write in clear, actionable business language

Structure your response as:
- Overall marketing assessment (2-3 sentences)
- 5 strategic recommendations, each with:
  - What the current situation is
  - Why it's limiting conversions or client engagement
  - What specific change would improve results

Keep the entire analysis under 500 words. Write as if speaking to a business owner who wants more leads and better client engagement.`,
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
    // Strip HTML tags, keep text content (first 8000 chars)
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

    // Verify admin
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) throw new Error("Admin access required");

    const { clientIds, analysisType } = await req.json();
    if (!clientIds?.length || !analysisType) throw new Error("Missing clientIds or analysisType");
    if (!SYSTEM_PROMPTS[analysisType]) throw new Error("Invalid analysis type");

    // Fetch client data
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
        // Fetch website content
        const siteContent = await fetchWebsiteContent(domain);

        const userPrompt = `Please analyze the following website:

Domain: ${domain}
Business Name: ${client.business_name || "Unknown"}
Industry: ${client.industry || "Not specified"}
Location: ${client.location || "Not specified"}

Website content extracted:
${siteContent}

Conduct a ${ANALYSIS_TYPE_LABELS[analysisType]} and provide your findings following the structure requested in the system prompt.`;

        // Call Lovable AI
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

        // Save to database
        await supabase.from("analysis_reports").insert({
          lead_id: client.id,
          analysis_type: analysisType,
          domain,
          analysis_content: analysisContent,
          status: "success",
          created_by: user.id,
        });

        // Update last_analysis_date
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
        // Save failed report
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

