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
const CURRENCY = "aud";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tier, name, email, phone } = await req.json();

    if (!name || !email || !tier) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, email, tier" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tierLabels: Record<string, string> = {
      "basic-deposit": "Basic Blue",
      "gold": "Gold Package",
      "platinum": "Platinum Package",
    };

    const tierLabel = tierLabels[tier];
    if (!tierLabel) {
      return new Response(
        JSON.stringify({ error: `Invalid tier: ${tier}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get deposit amount from system settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: depositSetting } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "deposit_amount")
      .maybeSingle();

    const depositAmount = (depositSetting?.setting_value as any)?.amount ?? 49;
    const amountCents = Math.round(depositAmount * 100);

    // Find or create Stripe customer
    let customerId: string | undefined;
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        name,
        phone: phone || undefined,
      });
      customerId = customer.id;
    }

    // Create PaymentIntent linked to the canonical deposit product
    // setup_future_usage saves the card for future charges
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: CURRENCY,
      customer: customerId,
      setup_future_usage: "off_session",
      description: `${tierLabel} — $${depositAmount} Website Deposit`,
      metadata: {
        tier,
        customer_name: name,
        customer_email: email,
        customer_phone: phone || "",
        stripe_product_id: DEPOSIT_PRODUCT_ID,
        stripe_price_id: DEPOSIT_PRICE_ID,
        type: "deposit",
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customerId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-OFFER-PAYMENT-INTENT] Error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
