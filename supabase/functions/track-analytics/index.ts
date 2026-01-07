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
      session_id,
      event_type = 'page_view'
    } = body;

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
      .select("id")
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

    // Insert the analytics event
    const { error: insertError } = await supabaseClient
      .from("website_analytics")
      .insert({
        lead_id: lead.id,
        tracking_id,
        page_url,
        page_title,
        referrer,
        user_agent,
        screen_width,
        screen_height,
        session_id,
        event_type,
      });

    if (insertError) {
      logStep("Error inserting analytics", { error: insertError.message });
      return new Response(
        JSON.stringify({ error: "Failed to record analytics" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    logStep("Analytics recorded successfully", { lead_id: lead.id, event_type });

    // Return a 1x1 transparent GIF for image-based tracking compatibility
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
