import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  seo: "SEO Analysis",
  infrastructure: "Infrastructure Analysis",
  marketing: "Marketing Strategy",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle GET requests (from email CTA click) — redirect to client portal
    if (req.method === "GET") {
      const url = new URL(req.url);
      const clientId = url.searchParams.get("clientId");
      const analysisType = url.searchParams.get("type");

      if (!clientId || !analysisType) {
        return new Response("Invalid request parameters.", { status: 400 });
      }

      // Redirect to the client portal with action params
      const portalUrl = `https://sited.lovable.app/client-portal?action=request-analysis&type=${encodeURIComponent(analysisType)}&clientId=${encodeURIComponent(clientId)}`;
      
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": portalUrl },
      });
    }

    // Handle POST requests (from client portal after login)
    if (req.method === "POST") {
      const { clientId, analysisType } = await req.json();
      
      if (!clientId || !analysisType) {
        return new Response(JSON.stringify({ error: "Missing clientId or analysisType" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch client info
      const { data: client } = await supabase
        .from("leads")
        .select("id, name, email, business_name")
        .eq("id", clientId)
        .single();

      if (!client) {
        return new Response(JSON.stringify({ error: "Client not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch the most recent analysis for this client + type
      const { data: report } = await supabase
        .from("analysis_reports")
        .select("analysis_content")
        .eq("lead_id", clientId)
        .eq("analysis_type", analysisType)
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const typeLabel = ANALYSIS_TYPE_LABELS[analysisType] || analysisType;

      // Create the client request
      const { data: newRequest, error: insertErr } = await supabase.from("client_requests").insert({
        lead_id: clientId,
        title: `${typeLabel} — Implementation Request`,
        description: report?.analysis_content
          ? `Client requested implementation of ${typeLabel} recommendations.\n\n${report.analysis_content.slice(0, 1000)}`
          : `Client requested implementation of ${typeLabel} recommendations.`,
        priority: "normal",
        status: "pending",
        request_source: "analysis",
        analysis_type: analysisType,
      }).select('id').single();

      if (insertErr) throw insertErr;

      return new Response(
        JSON.stringify({ success: true, requestId: newRequest?.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (e) {
    console.error("request-analysis-action error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
