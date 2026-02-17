import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  seo: "SEO Analysis",
  infrastructure: "Infrastructure Analysis",
  marketing: "Marketing Strategy",
};

/**
 * Parse analysis content into individual recommendations.
 * Each recommendation starts with **🔹 [Number]. [Title]**
 * Returns array of { title, description, body }
 */
function parseRecommendations(
  analysisContent: string,
  analysisType: string
): { title: string; description: string; body: string }[] {
  const typeLabel = ANALYSIS_TYPE_LABELS[analysisType] || analysisType;

  // Split by the recommendation marker pattern: **🔹 N. Title**
  const recPattern = /\*\*🔹\s*\d+\.\s*(.+?)\*\*/g;
  const markers: { index: number; title: string }[] = [];
  let match;

  while ((match = recPattern.exec(analysisContent)) !== null) {
    markers.push({ index: match.index, title: match[1].trim() });
  }

  if (markers.length === 0) {
    // Fallback: return the whole analysis as one request
    return [{
      title: `${typeLabel} — Implementation Request`,
      description: `Implementation of ${typeLabel} recommendations.`,
      body: analysisContent.slice(0, 2000),
    }];
  }

  const recommendations: { title: string; description: string; body: string }[] = [];

  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index;
    const end = i + 1 < markers.length ? markers[i + 1].index : analysisContent.length;
    const sectionText = analysisContent.slice(start, end).trim();

    // Extract "What we found:" as the description
    const whatWeFoundMatch = sectionText.match(/\*What we found:\*\s*(.+?)(?:\n|$)/);
    const description = whatWeFoundMatch
      ? whatWeFoundMatch[1].trim().slice(0, 100)
      : `${typeLabel} recommendation: ${markers[i].title}`.slice(0, 100);

    recommendations.push({
      title: `${typeLabel} — ${markers[i].title}`,
      description,
      body: sectionText,
    });
  }

  return recommendations;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle GET requests (from email CTA click) — create drafts then redirect
    if (req.method === "GET") {
      const url = new URL(req.url);
      const clientId = url.searchParams.get("clientId");
      const analysisType = url.searchParams.get("type");

      if (!clientId || !analysisType) {
        return new Response("Invalid request parameters.", { status: 400 });
      }

      // Anti-spam: check for recent requests from same client + type in last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentRequests } = await supabase
        .from("client_requests")
        .select("id")
        .eq("lead_id", clientId)
        .eq("analysis_type", analysisType)
        .eq("request_source", "analysis")
        .gte("created_at", fiveMinutesAgo)
        .limit(1);

      if (!recentRequests || recentRequests.length === 0) {
        const { data: client } = await supabase
          .from("leads")
          .select("id, name, email, business_name")
          .eq("id", clientId)
          .single();

        if (client) {
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

          if (report?.analysis_content) {
            // Parse into individual recommendations and create a draft for each
            const recommendations = parseRecommendations(report.analysis_content, analysisType);

            for (const rec of recommendations) {
              await supabase.from("client_requests").insert({
                lead_id: clientId,
                title: rec.title,
                description: rec.description,
                body: rec.body,
                priority: "normal",
                status: "draft",
                request_source: "analysis",
                analysis_type: analysisType,
              });
            }
          } else {
            // No analysis content — create a single generic draft
            const typeLabel = ANALYSIS_TYPE_LABELS[analysisType] || analysisType;
            await supabase.from("client_requests").insert({
              lead_id: clientId,
              title: `${typeLabel} — Implementation Request`,
              description: `Client requested implementation of ${typeLabel} recommendations.`,
              priority: "normal",
              status: "draft",
              request_source: "analysis",
              analysis_type: analysisType,
            });
          }
        }
      }

      // Redirect to the client portal login
      const portalUrl = `https://sited.lovable.app/client-portal`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": portalUrl },
      });
    }

    // Handle POST requests (backwards compatibility)
    if (req.method === "POST") {
      const { clientId, analysisType } = await req.json();

      if (!clientId || !analysisType) {
        return new Response(JSON.stringify({ error: "Missing clientId or analysisType" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentRequests } = await supabase
        .from("client_requests")
        .select("id, created_at")
        .eq("lead_id", clientId)
        .eq("analysis_type", analysisType)
        .eq("request_source", "analysis")
        .gte("created_at", fiveMinutesAgo)
        .limit(1);

      if (recentRequests && recentRequests.length > 0) {
        return new Response(
          JSON.stringify({ error: "A request was already submitted recently. Please wait 5 minutes.", duplicate: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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

      const { data: report } = await supabase
        .from("analysis_reports")
        .select("analysis_content")
        .eq("lead_id", clientId)
        .eq("analysis_type", analysisType)
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const createdIds: string[] = [];

      if (report?.analysis_content) {
        const recommendations = parseRecommendations(report.analysis_content, analysisType);
        for (const rec of recommendations) {
          const { data: newReq, error: insertErr } = await supabase.from("client_requests").insert({
            lead_id: clientId,
            title: rec.title,
            description: rec.description,
            body: rec.body,
            priority: "normal",
            status: "draft",
            request_source: "analysis",
            analysis_type: analysisType,
          }).select("id").single();
          if (insertErr) throw insertErr;
          if (newReq) createdIds.push(newReq.id);
        }
      } else {
        const typeLabel = ANALYSIS_TYPE_LABELS[analysisType] || analysisType;
        const { data: newReq, error: insertErr } = await supabase.from("client_requests").insert({
          lead_id: clientId,
          title: `${typeLabel} — Implementation Request`,
          description: `Client requested implementation of ${typeLabel} recommendations.`,
          priority: "normal",
          status: "draft",
          request_source: "analysis",
          analysis_type: analysisType,
        }).select("id").single();
        if (insertErr) throw insertErr;
        if (newReq) createdIds.push(newReq.id);
      }

      return new Response(
        JSON.stringify({ success: true, requestIds: createdIds }),
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
