import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GET-LEAD-SUBSCRIPTIONS] ${step}${detailStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not found");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const { lead_id } = await req.json();
    logStep("Received request", { lead_id });

    if (!lead_id) {
      throw new Error("lead_id is required");
    }

    // Get lead's Stripe customer ID
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('stripe_customer_id, name, email')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error("Lead not found");
    }

    if (!lead.stripe_customer_id) {
      logStep("No Stripe customer ID for this lead");
      return new Response(
        JSON.stringify({ success: true, subscriptions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Fetching subscriptions for customer", { customer_id: lead.stripe_customer_id });

    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: lead.stripe_customer_id,
      status: 'all', // Include all statuses to show cancelled ones too
      limit: 100,
    });

    logStep("Found subscriptions", { count: subscriptions.data.length });

    // Format subscriptions with useful info
    const formattedSubscriptions = subscriptions.data.map((sub: Stripe.Subscription) => {
      const item = sub.items.data[0];
      const price = item?.price;
      const product = price?.product;
      
      return {
        id: sub.id,
        status: sub.status,
        name: sub.metadata?.membership_name || 
              (typeof product === 'object' && product !== null ? (product as Stripe.Product).name : null) || 
              'Subscription',
        amount: price?.unit_amount ? price.unit_amount / 100 : 0,
        currency: price?.currency || 'aud',
        interval: price?.recurring?.interval || 'month',
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at,
        created: sub.created,
      };
    });

    return new Response(
      JSON.stringify({ success: true, subscriptions: formattedSubscriptions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
