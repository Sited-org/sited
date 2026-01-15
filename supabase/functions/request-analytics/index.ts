import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REQUEST-ANALYTICS] ${step}${detailsStr}`);
};

// HMAC-SHA256 verification for session tokens
async function verifyHmacSignature(data: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expectedSignatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(expectedSignatureBuffer)));
  
  if (signature.length !== expectedSignature.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

interface SessionPayload {
  lid: string;
  exp: number;
  rnd: string;
}

async function validateSessionToken(token: string, secret: string): Promise<{ valid: boolean; leadId?: string; error?: string }> {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Missing or invalid token' };
    }
    
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [payloadBase64, signature] = parts;
    
    const isValidSignature = await verifyHmacSignature(payloadBase64, signature, secret);
    if (!isValidSignature) {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    let payload: SessionPayload;
    try {
      payload = JSON.parse(atob(payloadBase64));
    } catch {
      return { valid: false, error: 'Invalid token payload' };
    }
    
    if (!payload.lid || !payload.exp || !payload.rnd) {
      return { valid: false, error: 'Incomplete token payload' };
    }
    
    if (Date.now() > payload.exp) {
      return { valid: false, error: 'Token has expired' };
    }
    
    return { valid: true, leadId: payload.lid };
  } catch (error) {
    return { valid: false, error: 'Token validation failed' };
  }
}

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

    const sessionSecret = Deno.env.get("CLIENT_SESSION_SECRET");
    if (!sessionSecret) {
      throw new Error("CLIENT_SESSION_SECRET is not configured");
    }

    const { lead_id, session_token } = await req.json();

    if (!lead_id) {
      throw new Error("Lead ID is required");
    }

    // Validate session token
    if (!session_token) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const tokenValidation = await validateSessionToken(session_token, sessionSecret);
    if (!tokenValidation.valid) {
      logStep("Invalid session token", { error: tokenValidation.error });
      return new Response(
        JSON.stringify({ error: tokenValidation.error || "Invalid session" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    if (tokenValidation.leadId !== lead_id) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    logStep("Session validated", { lead_id });

    // Get the lead details
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select("name, email, business_name, website_url, tracking_id, analytics_status")
      .eq("id", lead_id)
      .single();

    if (leadError) {
      throw new Error("Lead not found");
    }

    // Check if already setup
    if (lead.analytics_status === 'active') {
      return new Response(
        JSON.stringify({ error: "Analytics is already active" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Update the lead to pending status
    const { error: updateError } = await supabaseClient
      .from("leads")
      .update({ analytics_status: 'pending' })
      .eq("id", lead_id);

    if (updateError) {
      logStep("Error updating lead", { error: updateError.message });
      throw updateError;
    }

    // Create a client request for the admin to action
    const clientName = lead.name || lead.business_name || lead.email;
    const websiteDisplay = lead.website_url || 'No website URL set';
    
    const trackingScript = generateTrackingScript(lead.tracking_id);
    
    const { error: requestError } = await supabaseClient
      .from("client_requests")
      .insert({
        lead_id: lead_id,
        title: "Set Up Website Analytics",
        description: `${clientName} has requested website analytics tracking.

**Website:** ${websiteDisplay}
**Tracking ID:** ${lead.tracking_id}

**Instructions:**
1. Add the tracking script below to the client's website (before </head> tag)
2. Verify the script is loading correctly
3. Mark this request as complete to activate analytics for the client

**Tracking Script:**
\`\`\`html
${trackingScript}
\`\`\``,
        priority: "normal",
        status: "pending",
      });

    if (requestError) {
      logStep("Error creating client request", { error: requestError.message });
    }

    logStep("Analytics request created successfully");

    return new Response(
      JSON.stringify({ success: true, tracking_id: lead.tracking_id }),
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

function generateTrackingScript(trackingId: string): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
  
  return `<!-- Sited Analytics -->
<script>
(function() {
  var TRACKING_ID = '${trackingId}';
  var ENDPOINT = '${supabaseUrl}/functions/v1/track-analytics';
  
  // Generate session ID
  var sessionId = sessionStorage.getItem('_sa_sid');
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    sessionStorage.setItem('_sa_sid', sessionId);
  }
  
  // Track page view
  function trackPageView() {
    var data = {
      tracking_id: TRACKING_ID,
      session_id: sessionId,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      page_load_time: 0,
      event_type: 'page_view',
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      connection_type: navigator.connection ? navigator.connection.effectiveType : null,
      color_depth: window.screen.colorDepth,
      pixel_ratio: window.devicePixelRatio
    };
    
    // Add performance timing
    if (window.performance && window.performance.timing) {
      var timing = window.performance.timing;
      data.page_load_time = timing.loadEventEnd - timing.navigationStart;
      data.dom_content_loaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      data.first_byte_time = timing.responseStart - timing.navigationStart;
    }
    
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(function() {});
  }
  
  // Track time on page
  var pageLoadTime = Date.now();
  var maxScrollDepth = 0;
  
  function trackScrollDepth() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    if (scrollPercent > maxScrollDepth) maxScrollDepth = scrollPercent;
  }
  
  window.addEventListener('scroll', trackScrollDepth, { passive: true });
  
  function trackExit() {
    var timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);
    var data = {
      tracking_id: TRACKING_ID,
      session_id: sessionId,
      page_url: window.location.href,
      event_type: 'page_exit',
      time_on_page: timeOnPage,
      scroll_depth: maxScrollDepth
    };
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, JSON.stringify(data));
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(function() {});
    }
  }
  
  // Track clicks
  document.addEventListener('click', function(e) {
    var target = e.target.closest('a, button, [data-track]');
    if (!target) return;
    
    var data = {
      tracking_id: TRACKING_ID,
      session_id: sessionId,
      page_url: window.location.href,
      event_type: 'click',
      element_tag: target.tagName,
      element_text: (target.innerText || '').substring(0, 100),
      element_href: target.href || null,
      element_id: target.id || null,
      element_class: target.className || null
    };
    
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(function() {});
  });
  
  // Track on visibility change and page unload
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') trackExit();
  });
  window.addEventListener('beforeunload', trackExit);
  window.addEventListener('pagehide', trackExit);
  
  // Track page view on load
  if (document.readyState === 'complete') {
    trackPageView();
  } else {
    window.addEventListener('load', trackPageView);
  }
})();
</script>`;
}
