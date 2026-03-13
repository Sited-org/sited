import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// All tiers use $49 AUD deposit
const DEPOSIT_AMOUNT = 4900; // cents
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

    // Create PaymentIntent for $49 deposit
    const paymentIntent = await stripe.paymentIntents.create({
      amount: DEPOSIT_AMOUNT,
      currency: CURRENCY,
      customer: customerId,
      description: `${tierLabel} — $49 Website Deposit`,
      metadata: {
        tier,
        customer_name: name,
        customer_email: email,
        customer_phone: phone || "",
      },
    });

    // Create or update lead in Supabase as "sold"
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store the payment intent ID and tier in metadata for later confirmation
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
