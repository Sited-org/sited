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

    const { lead_id, date_range = '7d', device_filter = 'all', source_filter = 'all' } = await req.json();

    if (!lead_id) {
      throw new Error("lead_id is required");
    }

    // Get the lead's website_url and analytics_status
    const { data: leadData, error: leadError } = await supabaseClient
      .from("leads")
      .select("website_url, analytics_status")
      .eq("id", lead_id)
      .single();

    if (leadError) {
      logStep("Error fetching lead", { error: leadError.message });
    }

    // Only return analytics if status is active
    if (leadData?.analytics_status !== 'active') {
      return new Response(
        JSON.stringify({ error: "Analytics not active" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Calculate date filter
    let dateFilter = new Date();
    switch (date_range) {
      case '24h':
        dateFilter.setHours(dateFilter.getHours() - 24);
        break;
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90d':
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      case 'all':
        dateFilter = new Date(0); // Beginning of time
        break;
      default:
        dateFilter.setDate(dateFilter.getDate() - 7);
    }

    // Extract domain from website_url for filtering
    let websiteDomain: string | null = null;
    if (leadData?.website_url) {
      try {
        const url = new URL(leadData.website_url);
        websiteDomain = url.hostname.toLowerCase().replace('www.', '');
      } catch {
        websiteDomain = null;
      }
    }
    logStep("Filters applied", { websiteDomain, date_range, device_filter, source_filter });

    // Build query
    let query = supabaseClient
      .from("website_analytics")
      .select("*")
      .eq("lead_id", lead_id)
      .gte("created_at", dateFilter.toISOString())
      .order("created_at", { ascending: false });

    // Apply device filter
    if (device_filter !== 'all') {
      query = query.eq("device_type", device_filter);
    }

    const { data: allEvents, error: eventsError } = await query;

    if (eventsError) {
      logStep("Error fetching events", { error: eventsError.message });
      throw eventsError;
    }

    // Filter events to only include those from the client's actual website domain
    let filteredEvents = (allEvents || []).filter(e => {
      if (!websiteDomain) return true;
      try {
        const eventUrl = new URL(e.page_url);
        const eventDomain = eventUrl.hostname.toLowerCase().replace('www.', '');
        return eventDomain === websiteDomain;
      } catch {
        return false;
      }
    });

    // Apply source filter
    if (source_filter !== 'all') {
      filteredEvents = filteredEvents.filter(e => {
        const source = categorizeSource(e.referrer);
        switch (source_filter) {
          case 'direct': return source === 'Direct';
          case 'organic': return ['Google', 'Bing', 'Yahoo', 'DuckDuckGo', 'Baidu'].includes(source);
          case 'social': return ['Facebook', 'Instagram', 'Twitter/X', 'LinkedIn', 'Pinterest', 'TikTok', 'YouTube', 'Reddit'].includes(source);
          case 'referral': return source !== 'Direct' && !['Google', 'Bing', 'Yahoo', 'DuckDuckGo', 'Baidu', 'Facebook', 'Instagram', 'Twitter/X', 'LinkedIn', 'Pinterest', 'TikTok', 'YouTube', 'Reddit'].includes(source);
          default: return true;
        }
      });
    }

    logStep("Events filtered", { 
      total: allEvents?.length || 0, 
      filtered: filteredEvents.length,
      websiteDomain 
    });

    // Separate page views and clicks
    const pageViews = filteredEvents.filter(e => e.event_type === 'page_view');
    const clicks = filteredEvents.filter(e => e.event_type === 'click');
    const exits = filteredEvents.filter(e => e.event_type === 'page_exit');

    const totalPageViews = pageViews.length;

    // Get unique sessions
    const uniqueSessions = new Set(pageViews.map(e => e.session_id).filter(Boolean));
    const uniqueVisitors = uniqueSessions.size;

    // Calculate bounce rate
    const bouncedSessions = pageViews.filter(e => e.is_bounce).length;
    const bounceRate = uniqueVisitors > 0 ? Math.round((bouncedSessions / uniqueVisitors) * 100) : 0;

    // Calculate average session duration
    const sessionTimes: Record<string, number> = {};
    const sessionPageCounts: Record<string, number> = {};
    pageViews.forEach(e => {
      if (e.session_id) {
        sessionPageCounts[e.session_id] = (sessionPageCounts[e.session_id] || 0) + 1;
        if (e.time_on_page > 0) {
          sessionTimes[e.session_id] = (sessionTimes[e.session_id] || 0) + e.time_on_page;
        }
      }
    });
    const sessionDurations = Object.values(sessionTimes);
    const avgSessionDuration = sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
      : 0;

    // Average pages per session
    const pageCounts = Object.values(sessionPageCounts);
    const avgPagesPerSession = pageCounts.length > 0
      ? Number((pageCounts.reduce((a, b) => a + b, 0) / pageCounts.length).toFixed(1))
      : 0;

    // Calculate average time on page
    const eventsWithTime = pageViews.filter(e => e.time_on_page > 0);
    const avgTimeOnPage = eventsWithTime.length > 0
      ? Math.round(eventsWithTime.reduce((sum, e) => sum + e.time_on_page, 0) / eventsWithTime.length)
      : 0;

    // Calculate average page load time
    const eventsWithLoadTime = pageViews.filter(e => e.page_load_time > 0);
    const avgLoadTime = eventsWithLoadTime.length > 0 
      ? Math.round(eventsWithLoadTime.reduce((sum, e) => sum + (e.page_load_time || 0), 0) / eventsWithLoadTime.length) 
      : 0;

    // Get top pages
    const pageCounts2: Record<string, { views: number; totalTime: number; bounces: number; exits: number }> = {};
    pageViews.forEach(e => {
      let path = '/';
      try {
        const url = new URL(e.page_url);
        path = url.pathname || '/';
      } catch {
        path = e.page_url;
      }
      if (!pageCounts2[path]) {
        pageCounts2[path] = { views: 0, totalTime: 0, bounces: 0, exits: 0 };
      }
      pageCounts2[path].views++;
      pageCounts2[path].totalTime += e.time_on_page || 0;
      if (e.is_bounce) pageCounts2[path].bounces++;
      if (e.is_exit) pageCounts2[path].exits++;
    });

    const topPages = Object.entries(pageCounts2)
      .map(([page, data]) => ({ 
        page, 
        views: data.views,
        avgTimeOnPage: data.views > 0 ? Math.round(data.totalTime / data.views) : 0,
        bounceRate: data.views > 0 ? Math.round((data.bounces / data.views) * 100) : 0,
        exitRate: data.views > 0 ? Math.round((data.exits / data.views) * 100) : 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    // Entry pages
    const entryPageCounts: Record<string, { entries: number; bounces: number }> = {};
    pageViews.filter(e => e.is_entry).forEach(e => {
      let path = '/';
      try {
        const url = new URL(e.page_url);
        path = url.pathname || '/';
      } catch {
        path = e.page_url;
      }
      if (!entryPageCounts[path]) {
        entryPageCounts[path] = { entries: 0, bounces: 0 };
      }
      entryPageCounts[path].entries++;
      if (e.is_bounce) entryPageCounts[path].bounces++;
    });

    const entryPages = Object.entries(entryPageCounts)
      .map(([page, data]) => ({
        page,
        entries: data.entries,
        bounceRate: data.entries > 0 ? Math.round((data.bounces / data.entries) * 100) : 0
      }))
      .sort((a, b) => b.entries - a.entries)
      .slice(0, 10);

    // Exit pages
    const exitPageCounts: Record<string, { exits: number; views: number }> = {};
    pageViews.forEach(e => {
      let path = '/';
      try {
        const url = new URL(e.page_url);
        path = url.pathname || '/';
      } catch {
        path = e.page_url;
      }
      if (!exitPageCounts[path]) {
        exitPageCounts[path] = { exits: 0, views: 0 };
      }
      exitPageCounts[path].views++;
      if (e.is_exit) exitPageCounts[path].exits++;
    });

    const exitPages = Object.entries(exitPageCounts)
      .filter(([_, data]) => data.exits > 0)
      .map(([page, data]) => ({
        page,
        exits: data.exits,
        exitRate: data.views > 0 ? Math.round((data.exits / data.views) * 100) : 0
      }))
      .sort((a, b) => b.exits - a.exits)
      .slice(0, 10);

    // Traffic sources
    const sourceCounts: Record<string, number> = {};
    pageViews.forEach(e => {
      const source = categorizeSource(e.referrer);
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    const trafficSources = Object.entries(sourceCounts)
      .map(([source, count]) => ({
        source,
        visits: count,
        percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    // Device breakdown
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    pageViews.forEach(e => {
      const device = (e.device_type || 'desktop').toLowerCase();
      if (device in deviceCounts) {
        deviceCounts[device]++;
      } else {
        deviceCounts.desktop++;
      }
    });

    const total = Object.values(deviceCounts).reduce((a, b) => a + b, 0) || 1;
    const devices = {
      desktop: Math.round((deviceCounts.desktop / total) * 100),
      mobile: Math.round((deviceCounts.mobile / total) * 100),
      tablet: Math.round((deviceCounts.tablet / total) * 100)
    };

    // Browser breakdown
    const browserCounts: Record<string, number> = {};
    pageViews.forEach(e => {
      const browser = e.browser || 'Unknown';
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    });

    const browsers = Object.entries(browserCounts)
      .map(([browser, count]) => ({
        browser,
        count,
        percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Screen resolutions
    const resolutionCounts: Record<string, number> = {};
    pageViews.forEach(e => {
      if (e.screen_width && e.screen_height) {
        const res = `${e.screen_width}x${e.screen_height}`;
        resolutionCounts[res] = (resolutionCounts[res] || 0) + 1;
      }
    });

    const screenResolutions = Object.entries(resolutionCounts)
      .map(([resolution, count]) => ({
        resolution,
        count,
        percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // New vs Returning
    const sessionFirstSeen: Record<string, Date> = {};
    const returningSessionIds = new Set<string>();
    
    // This is a simplified version - in reality you'd track this differently
    const allSessionIds = Array.from(uniqueSessions);
    const newPercentage = 70; // Placeholder - would need historical data
    const returningPercentage = 30;

    const newVsReturning = {
      new: newPercentage,
      returning: returningPercentage
    };

    // Hourly traffic
    const hourlyTraffic: number[] = new Array(24).fill(0);
    pageViews.forEach(e => {
      const hour = new Date(e.created_at).getHours();
      hourlyTraffic[hour]++;
    });

    const hourlyTrafficData = hourlyTraffic.map((visits, hour) => ({ hour, visits }));

    // Daily traffic
    const dailyTraffic: Record<string, { visits: number; sessions: Set<string> }> = {};
    pageViews.forEach(e => {
      const date = new Date(e.created_at).toISOString().split('T')[0];
      if (!dailyTraffic[date]) {
        dailyTraffic[date] = { visits: 0, sessions: new Set() };
      }
      dailyTraffic[date].visits++;
      if (e.session_id) dailyTraffic[date].sessions.add(e.session_id);
    });

    const dailyTrafficData = Object.entries(dailyTraffic)
      .map(([date, data]) => ({
        date,
        visits: data.visits,
        uniqueVisitors: data.sessions.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get last event timestamp
    const lastUpdated = pageViews.length > 0 ? pageViews[0].created_at : null;

    logStep("Analytics computed successfully", {
      totalPageViews,
      uniqueVisitors,
      bounceRate,
      avgSessionDuration,
    });

    return new Response(
      JSON.stringify({
        totalPageViews,
        totalVisits: totalPageViews,
        uniqueVisitors,
        bounceRate,
        avgSessionDuration,
        avgTimeOnPage,
        avgLoadTime,
        avgPagesPerSession,
        topPages,
        entryPages,
        exitPages,
        trafficSources,
        devices,
        browsers,
        screenResolutions,
        newVsReturning,
        hourlyTraffic: hourlyTrafficData,
        dailyTraffic: dailyTrafficData,
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
