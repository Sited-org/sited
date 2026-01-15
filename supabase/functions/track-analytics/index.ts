import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRACK-ANALYTICS] ${step}${detailsStr}`);
};

// Parse user agent to get browser and device type
function parseUserAgent(ua: string): { browser: string; deviceType: string } {
  let browser = 'Unknown';
  let deviceType = 'desktop';

  if (!ua) return { browser, deviceType };

  // Detect browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // Detect device type
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    deviceType = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
  }

  return { browser, deviceType };
}

// Safely parse integer within valid range
function safeInt(value: any, defaultValue: number | null = 0, max: number = 10000): number | null {
  if (value === null || value === undefined) return defaultValue;
  const num = parseInt(String(value), 10);
  if (isNaN(num) || num < 0 || num > max) return defaultValue;
  return num;
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    const body = await req.json();
    const { 
      tracking_id, 
      page_url, 
      page_title, 
      referrer, 
      user_agent, 
      screen_width, 
      screen_height,
      viewport_width,
      viewport_height,
      session_id,
      event_type = 'page_view',
      time_on_page = 0,
      page_load_time = 0,
      dom_content_loaded = 0,
      first_byte_time = 0,
      scroll_depth = 0,
      language,
      timezone,
      connection_type,
      color_depth,
      pixel_ratio,
      // Click tracking fields
      element_tag,
      element_text,
      element_href,
      element_id,
      element_class,
    } = body;

    logStep("Received data", { tracking_id, event_type, page_url: page_url?.substring(0, 50) });

    if (!tracking_id || !page_url) {
      logStep("Missing required fields", { tracking_id: !!tracking_id, page_url: !!page_url });
      return new Response(
        JSON.stringify({ error: "tracking_id and page_url are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Look up the lead by tracking_id
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select("id, analytics_status")
      .eq("tracking_id", tracking_id)
      .maybeSingle();

    if (leadError) {
      logStep("Error looking up lead", { error: leadError.message });
      return new Response(
        JSON.stringify({ error: "Invalid tracking ID" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!lead) {
      logStep("No lead found for tracking_id", { tracking_id });
      return new Response(
        JSON.stringify({ error: "Invalid tracking ID" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Only track if analytics is active
    if (lead.analytics_status !== 'active') {
      logStep("Analytics not active for lead", { analytics_status: lead.analytics_status });
      return new Response(
        JSON.stringify({ error: "Analytics not active" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Parse user agent for browser and device info
    const { browser, deviceType } = parseUserAgent(user_agent || '');

    // Safely parse numeric values to avoid integer overflow
    const safeScreenWidth = safeInt(screen_width, null, 10000);
    const safeScreenHeight = safeInt(screen_height, null, 10000);
    const safeViewportWidth = safeInt(viewport_width, null, 10000);
    const safeViewportHeight = safeInt(viewport_height, null, 10000);
    const safeTimeOnPage = safeInt(time_on_page, 0, 86400); // max 24 hours
    const safePageLoadTime = safeInt(page_load_time, 0, 60000); // max 60 seconds
    const safeDomContentLoaded = safeInt(dom_content_loaded, null, 60000);
    const safeFirstByteTime = safeInt(first_byte_time, null, 60000);
    const safeScrollDepth = safeInt(scroll_depth, null, 100);
    const safeColorDepth = safeInt(color_depth, null, 64);
    const safePixelRatio = pixel_ratio ? Math.min(parseFloat(String(pixel_ratio)) || 1, 10) : null;

    // For exit events, update the previous page view with time_on_page and scroll_depth
    if (event_type === 'page_exit' && session_id) {
      const updateData: any = { 
        time_on_page: safeTimeOnPage, 
        is_exit: true 
      };
      if (safeScrollDepth !== null) {
        updateData.scroll_depth = safeScrollDepth;
      }

      const { error: updateError } = await supabaseClient
        .from("website_analytics")
        .update(updateData)
        .eq("session_id", session_id)
        .eq("page_url", page_url)
        .eq("event_type", "page_view")
        .order("created_at", { ascending: false })
        .limit(1);

      if (updateError) {
        logStep("Error updating page exit", { error: updateError.message });
      } else {
        logStep("Page exit recorded", { session_id, time_on_page: safeTimeOnPage, scroll_depth: safeScrollDepth });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // For session end events, mark the session's last page as a bounce if only one page viewed
    if (event_type === 'session_end' && session_id) {
      // Count pages in this session
      const { count, error: countError } = await supabaseClient
        .from("website_analytics")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session_id)
        .eq("event_type", "page_view");

      if (!countError && count === 1) {
        // Mark as bounce
        await supabaseClient
          .from("website_analytics")
          .update({ is_bounce: true })
          .eq("session_id", session_id)
          .eq("event_type", "page_view");
        
        logStep("Session marked as bounce", { session_id });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if this is entry page (first page in session)
    let isEntryPage = true;
    if (session_id && event_type === 'page_view') {
      const { count: sessionPageCount } = await supabaseClient
        .from("website_analytics")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session_id)
        .eq("event_type", "page_view");

      isEntryPage = (sessionPageCount || 0) === 0;
    }

    // Insert the analytics event
    const insertData: any = {
      lead_id: lead.id,
      tracking_id,
      page_url: page_url.substring(0, 2000), // Limit URL length
      page_title: page_title?.substring(0, 500) || null,
      referrer: referrer?.substring(0, 2000) || null,
      user_agent: user_agent?.substring(0, 1000) || null,
      session_id: session_id || null,
      event_type,
      time_on_page: safeTimeOnPage,
      page_load_time: safePageLoadTime,
      is_bounce: false,
      is_exit: false,
      is_entry: event_type === 'page_view' ? isEntryPage : null,
      browser,
      device_type: deviceType,
      language: language?.substring(0, 10) || null,
      timezone: timezone?.substring(0, 50) || null,
      connection_type: connection_type?.substring(0, 20) || null,
    };

    // Only add screen dimensions if they're valid
    if (safeScreenWidth !== null) insertData.screen_width = safeScreenWidth;
    if (safeScreenHeight !== null) insertData.screen_height = safeScreenHeight;
    if (safeViewportWidth !== null) insertData.viewport_width = safeViewportWidth;
    if (safeViewportHeight !== null) insertData.viewport_height = safeViewportHeight;
    if (safeDomContentLoaded !== null) insertData.dom_content_loaded = safeDomContentLoaded;
    if (safeFirstByteTime !== null) insertData.first_byte_time = safeFirstByteTime;
    if (safeScrollDepth !== null) insertData.scroll_depth = safeScrollDepth;
    if (safeColorDepth !== null) insertData.color_depth = safeColorDepth;
    if (safePixelRatio !== null) insertData.pixel_ratio = safePixelRatio;

    // Add click tracking fields
    if (event_type === 'click') {
      if (element_tag) insertData.element_tag = element_tag.substring(0, 50);
      if (element_text) insertData.element_text = element_text.substring(0, 100);
      if (element_href) insertData.element_href = element_href.substring(0, 500);
      if (element_id) insertData.element_id = element_id.substring(0, 100);
      if (element_class) insertData.element_class = element_class.substring(0, 200);
    }

    const { error: insertError } = await supabaseClient
      .from("website_analytics")
      .insert(insertData);

    if (insertError) {
      logStep("Error inserting analytics", { error: insertError.message });
      return new Response(
        JSON.stringify({ error: "Failed to record analytics" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    logStep("Analytics recorded successfully", { lead_id: lead.id, event_type, isEntryPage });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
