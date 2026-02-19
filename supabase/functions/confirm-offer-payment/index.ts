import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentIntentId, name, email, phone, tier } = await req.json();

    if (!paymentIntentId || !name || !email || !tier) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify payment succeeded with Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({ error: "Payment has not succeeded" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create/update lead as sold
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const tierLabels: Record<string, string> = {
      "basic-deposit": "Basic Blue",
      "gold": "Gold Package",
      "platinum": "Platinum Package",
    };

    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let leadId: string;

    if (existingLead) {
      // Update existing lead to sold
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          status: "sold",
          name,
          phone: phone || null,
          membership_tier: tierLabels[tier] || tier,
          stripe_customer_id: paymentIntent.customer as string,
          deal_amount: 49,
          deal_closed_at: new Date().toISOString(),
        })
        .eq("id", existingLead.id);

      if (updateError) throw updateError;
      leadId = existingLead.id;
    } else {
      // Create new lead as sold
      const { data: newLead, error: insertError } = await supabase
        .from("leads")
        .insert({
          name,
          email,
          phone: phone || null,
          project_type: "website",
          status: "sold",
          membership_tier: tierLabels[tier] || tier,
          stripe_customer_id: paymentIntent.customer as string,
          deal_amount: 49,
          deal_closed_at: new Date().toISOString(),
          form_data: {
            source: "offer_page",
            tier,
            payment_intent_id: paymentIntentId,
          },
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      leadId = newLead.id;
    }

    // Log activity
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      action: "offer_payment_received",
      details: {
        tier,
        amount: 49,
        currency: "aud",
        payment_intent_id: paymentIntentId,
      },
    });

    return new Response(
      JSON.stringify({ success: true, leadId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CONFIRM-OFFER-PAYMENT] Error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
