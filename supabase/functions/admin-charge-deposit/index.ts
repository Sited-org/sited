import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Canonical Stripe product & price for deposit
const DEPOSIT_PRODUCT_ID = "prod_U0SzXJ49io3TW3";
const DEPOSIT_PRICE_ID = "price_1T2S3HKEOhx2BLuXpqoFZGO2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_id } = await req.json();
    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch lead
    const { data: lead } = await supabase
      .from("leads")
      .select("email, name, business_name, stripe_customer_id")
      .eq("id", lead_id)
      .single();

    if (!lead?.email) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get deposit amount from settings
    const { data: depositSetting } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "deposit_amount")
      .maybeSingle();

    const depositAmount = (depositSetting?.setting_value as any)?.amount ?? 49;
    const amountCents = Math.round(depositAmount * 100);

    // Find or create Stripe customer
    let customerId = lead.stripe_customer_id;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: lead.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: lead.email,
          name: lead.name || undefined,
        });
        customerId = customer.id;
      }
      await supabase.from("leads").update({ stripe_customer_id: customerId }).eq("id", lead_id);
    }

    // Create a PaymentIntent linked to canonical deposit product
    // setup_future_usage saves the card for future off-session charges
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "aud",
      customer: customerId,
      setup_future_usage: "off_session",
      description: `Deposit — ${lead.business_name || lead.name}`,
      metadata: {
        lead_id,
        type: "deposit",
        customer_name: lead.name || "",
        customer_email: lead.email,
        stripe_product_id: DEPOSIT_PRODUCT_ID,
        stripe_price_id: DEPOSIT_PRICE_ID,
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        depositAmount,
        customerId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[ADMIN-CHARGE-DEPOSIT] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
