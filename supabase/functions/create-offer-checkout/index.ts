import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Stripe price IDs for each tier
const PRICE_MAP: Record<string, { price_id: string; label: string }> = {
  "basic-deposit": {
    price_id: "price_1T2OswKEOhx2BLuXhoR3UTVS",
    label: "Basic Blue Deposit ($49)",
  },
  "basic-full": {
    price_id: "price_1SxSpTKEOhx2BLuXRxnMsTiQ",
    label: "Basic Blue ($549)",
  },
  "gold": {
    price_id: "price_1SxSrJKEOhx2BLuXSoqEWFrJ",
    label: "Gold Package ($649)",
  },
  "platinum": {
    price_id: "price_1SxSsuKEOhx2BLuXuN6rgRDM",
    label: "Platinum Package ($1,199)",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tier, customer_email, customer_name } = await req.json();

    const tierConfig = PRICE_MAP[tier];
    if (!tierConfig) {
      return new Response(
        JSON.stringify({ error: `Invalid tier: ${tier}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing Stripe customer by email
    let customerId: string | undefined;
    if (customer_email) {
      const customers = await stripe.customers.list({ email: customer_email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    const origin = req.headers.get("origin") || "https://sited.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customer_email || undefined,
      line_items: [{ price: tierConfig.price_id, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/offer?payment=success`,
      cancel_url: `${origin}/offer?payment=cancelled`,
      metadata: {
        tier,
        customer_name: customer_name || "",
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-OFFER-CHECKOUT] Error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
