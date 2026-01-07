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

    // Get all page views for this lead
    const { data: allEvents, error: eventsError } = await supabaseClient
      .from("website_analytics")
      .select("*")
      .eq("lead_id", lead_id)
      .eq("event_type", "page_view")
      .order("created_at", { ascending: false });

    if (eventsError) {
      logStep("Error fetching events", { error: eventsError.message });
      throw eventsError;
    }

    const events = allEvents || [];
    const totalVisits = events.length;

    // Get unique sessions
    const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean));
    const uniqueVisitors = uniqueSessions.size;

    // Calculate bounce rate
    const bouncedSessions = events.filter(e => e.is_bounce).length;
    const bounceRate = uniqueVisitors > 0 ? Math.round((bouncedSessions / uniqueVisitors) * 100) : 0;

    // Calculate average SESSION duration (total time visitor spends on website per session)
    // Group events by session and sum time_on_page for each session
    const sessionTimes: Record<string, number> = {};
    events.forEach(e => {
      if (e.session_id && e.time_on_page > 0) {
        sessionTimes[e.session_id] = (sessionTimes[e.session_id] || 0) + e.time_on_page;
      }
    });
    const sessionDurations = Object.values(sessionTimes);
    const avgSessionDuration = sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
      : 0;

    // Calculate average page load time
    const eventsWithLoadTime = events.filter(e => e.page_load_time > 0);
    const totalLoadTime = eventsWithLoadTime.reduce((sum, e) => sum + (e.page_load_time || 0), 0);
    const avgLoadTime = eventsWithLoadTime.length > 0 
      ? Math.round(totalLoadTime / eventsWithLoadTime.length) 
      : 0;

    // Get top pages (grouped by page_url)
    const pageCounts: Record<string, { views: number; totalTime: number }> = {};
    events.forEach(e => {
      let path = '/';
      try {
        const url = new URL(e.page_url);
        path = url.pathname || '/';
      } catch {
        path = e.page_url;
      }
      if (!pageCounts[path]) {
        pageCounts[path] = { views: 0, totalTime: 0 };
      }
      pageCounts[path].views++;
      pageCounts[path].totalTime += e.time_on_page || 0;
    });

    const topPages = Object.entries(pageCounts)
      .map(([page, data]) => ({ 
        page, 
        views: data.views,
        avgTime: data.views > 0 ? Math.round(data.totalTime / data.views) : 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Categorize traffic source by referrer hostname
    function categorizeSource(referrer: string | null): string {
      if (!referrer) return 'Direct';
      try {
        const url = new URL(referrer);
        const host = url.hostname.toLowerCase();
        // Search engines
        if (host.includes('google.')) return 'Google';
        if (host.includes('bing.')) return 'Bing';
        if (host.includes('yahoo.')) return 'Yahoo';
        if (host.includes('duckduckgo.')) return 'DuckDuckGo';
        if (host.includes('baidu.')) return 'Baidu';
        // Social media
        if (host.includes('facebook.') || host.includes('fb.')) return 'Facebook';
        if (host.includes('instagram.')) return 'Instagram';
        if (host.includes('twitter.') || host.includes('x.com')) return 'Twitter/X';
        if (host.includes('linkedin.')) return 'LinkedIn';
        if (host.includes('pinterest.')) return 'Pinterest';
        if (host.includes('tiktok.')) return 'TikTok';
        if (host.includes('youtube.')) return 'YouTube';
        if (host.includes('reddit.')) return 'Reddit';
        // Return cleaned hostname for other sources
        return host.replace('www.', '');
      } catch {
        return referrer || 'Direct';
      }
    }

    // Get traffic sources (grouped by categorized referrer)
    const sourceCounts: Record<string, number> = {};
    events.forEach(e => {
      const source = categorizeSource(e.referrer);
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    const trafficSources = Object.entries(sourceCounts)
      .map(([source, count]) => ({
        source,
        visits: count,
        percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);

    // Get device breakdown
    const deviceCounts: Record<string, number> = {};
    events.forEach(e => {
      const device = e.device_type || 'unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    const devices = Object.entries(deviceCounts)
      .map(([device, count]) => ({
        device,
        count,
        percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Get browser breakdown
    const browserCounts: Record<string, number> = {};
    events.forEach(e => {
      const browser = e.browser || 'Unknown';
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    });

    const browsers = Object.entries(browserCounts)
      .map(([browser, count]) => ({
        browser,
        count,
        percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Get last event timestamp
    const lastUpdated = events.length > 0 ? events[0].created_at : null;

    logStep("Analytics fetched successfully", {
      totalVisits,
      uniqueVisitors,
      bounceRate,
      avgSessionDuration,
      avgLoadTime,
    });

    return new Response(
      JSON.stringify({
        totalVisits,
        uniqueVisitors,
        bounceRate,
        avgTimeOnPage: avgSessionDuration, // renamed for frontend compatibility
        avgLoadTime,
        topPages,
        trafficSources,
        devices,
        browsers,
        lastUpdated,
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
