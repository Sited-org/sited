import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tier key → product name mapping
const TIER_TO_PRODUCT: Record<string, string> = {
  "basic-deposit": "Essential Blue",
  "basic-full": "Essential Blue",
  "gold": "Gold Package",
  "platinum": "Platinum Package",
};

// Canonical deposit product & price
const DEPOSIT_PRICE_ID = "price_1T2S3HKEOhx2BLuXpqoFZGO2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tier, customer_email, customer_name, customer_phone } = await req.json();

    const productName = TIER_TO_PRODUCT[tier];
    if (!productName) {
      return new Response(
        JSON.stringify({ error: `Invalid tier: ${tier}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look up lead_id from email for metadata
    let leadId: string | null = null;
    if (customer_email) {
      const { data: lead } = await supabase
        .from("leads")
        .select("id")
        .eq("email", customer_email)
        .maybeSingle();
      leadId = lead?.id ?? null;
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
      line_items: [{ price: DEPOSIT_PRICE_ID, quantity: 1 }],
      mode: "payment",
      invoice_creation: {
        enabled: true,
        invoice_data: {
          metadata: {
            tier,
            type: "deposit",
            lead_id: leadId || "",
          },
        },
      },
      payment_intent_data: {
        setup_future_usage: "off_session",
        metadata: {
          tier,
          type: "deposit",
          customer_name: customer_name || "",
          customer_email: customer_email || "",
          customer_phone: customer_phone || "",
          lead_id: leadId || "",
        },
      },
      metadata: {
        tier,
        type: "deposit",
        customer_name: customer_name || "",
        lead_id: leadId || "",
      },
      success_url: `${origin}/offer?payment=success`,
      cancel_url: `${origin}/offer?payment=cancelled`,
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
