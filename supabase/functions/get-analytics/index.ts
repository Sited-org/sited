import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-ANALYTICS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { lead_id } = await req.json();

    if (!lead_id) {
      throw new Error("lead_id is required");
    }

    logStep("Fetching analytics for lead", { lead_id });

    // Get total page views
    const { count: totalVisits, error: countError } = await supabaseClient
      .from("website_analytics")
      .select("*", { count: "exact", head: true })
      .eq("lead_id", lead_id);

    if (countError) {
      logStep("Error counting visits", { error: countError.message });
    }

    // Get unique sessions
    const { data: sessionsData, error: sessionsError } = await supabaseClient
      .from("website_analytics")
      .select("session_id")
      .eq("lead_id", lead_id)
      .not("session_id", "is", null);

    const uniqueVisitors = sessionsError ? 0 : new Set(sessionsData?.map(s => s.session_id)).size;

    // Get top pages (grouped by page_url)
    const { data: pageData, error: pageError } = await supabaseClient
      .from("website_analytics")
      .select("page_url")
      .eq("lead_id", lead_id)
      .eq("event_type", "page_view");

    let topPages: { page: string; views: number }[] = [];
    if (!pageError && pageData) {
      const pageCounts = pageData.reduce((acc: Record<string, number>, item) => {
        // Extract path from URL
        let path = '/';
        try {
          const url = new URL(item.page_url);
          path = url.pathname || '/';
        } catch {
          path = item.page_url;
        }
        acc[path] = (acc[path] || 0) + 1;
        return acc;
      }, {});

      topPages = Object.entries(pageCounts)
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
    }

    // Get traffic sources (grouped by referrer)
    const { data: referrerData, error: referrerError } = await supabaseClient
      .from("website_analytics")
      .select("referrer")
      .eq("lead_id", lead_id);

    let trafficSources: { source: string; percentage: number }[] = [];
    if (!referrerError && referrerData && referrerData.length > 0) {
      const sourceCounts = referrerData.reduce((acc: Record<string, number>, item) => {
        let source = 'Direct';
        if (item.referrer) {
          try {
            const url = new URL(item.referrer);
            source = url.hostname || 'Direct';
          } catch {
            source = item.referrer || 'Direct';
          }
        }
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      const total = referrerData.length;
      trafficSources = Object.entries(sourceCounts)
        .map(([source, count]) => ({
          source,
          percentage: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);
    }

    // Get last event timestamp
    const { data: lastEvent, error: lastEventError } = await supabaseClient
      .from("website_analytics")
      .select("created_at")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    logStep("Analytics fetched successfully", {
      totalVisits,
      uniqueVisitors,
      topPagesCount: topPages.length,
      sourcesCount: trafficSources.length,
    });

    return new Response(
      JSON.stringify({
        totalVisits: totalVisits || 0,
        uniqueVisitors,
        topPages,
        trafficSources,
        lastUpdated: lastEvent?.created_at || null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
