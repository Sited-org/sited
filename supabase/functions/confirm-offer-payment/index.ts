import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tier pricing
const TIER_CONFIG: Record<string, { label: string; totalPrice: number }> = {
  "basic-deposit": { label: "Basic Blue", totalPrice: 549 },
  "gold": { label: "Gold Package", totalPrice: 649 },
  "platinum": { label: "Platinum Package", totalPrice: 1199 },
};

const DEPOSIT_AMOUNT = 49;

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

    const config = TIER_CONFIG[tier];
    if (!config) {
      return new Response(
        JSON.stringify({ error: `Invalid tier: ${tier}` }),
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const customerId = paymentIntent.customer as string;

    // Save the payment method from this PaymentIntent for future charges
    let paymentMethodId: string | null = null;
    if (paymentIntent.payment_method) {
      paymentMethodId = paymentIntent.payment_method as string;
      try {
        await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      } catch (_e) {
        // Already attached — fine
      }
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    const now = new Date();

    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, form_data")
      .eq("email", email)
      .maybeSingle();

    let leadId: string;

    const leadUpdate = {
      status: "new_lead",
      name,
      phone: phone || null,
      membership_tier: config.label,
      stripe_customer_id: customerId,
      stripe_payment_method_id: paymentMethodId,
      deal_amount: config.totalPrice,
      deal_closed_at: now.toISOString(),
    };

    if (existingLead) {
      const existingFormData = (existingLead.form_data as Record<string, unknown>) || {};
      const mergedFormData = {
        ...existingFormData,
        partial: false,
        offer_tier: tier,
        offer_tier_label: config.label,
        payment_intent_id: paymentIntentId,
      };

      const { error: updateError } = await supabase
        .from("leads")
        .update({ ...leadUpdate, form_data: mergedFormData })
        .eq("id", existingLead.id);

      if (updateError) throw updateError;
      leadId = existingLead.id;
    } else {
      const { data: newLead, error: insertError } = await supabase
        .from("leads")
        .insert({
          ...leadUpdate,
          email,
          project_type: "website",
          form_data: {
            source: "offer_page",
            offer_tier: tier,
            offer_tier_label: config.label,
            payment_intent_id: paymentIntentId,
          },
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      leadId = newLead.id;
    }

    // --- SIMPLE 2-ENTRY SYSTEM ---
    // 1. Full project charge (debit) — the total owed
    await supabase.from("transactions").insert({
      lead_id: leadId,
      item: `${config.label} — Website Project`,
      credit: 0,
      debit: config.totalPrice,
      status: "completed",
      invoice_status: "not_sent",
      payment_method: null,
      notes: `Full project fee for ${config.label}`,
      transaction_date: now.toISOString(),
    });

    // 2. Deposit payment received (credit) — $49 paid now
    await supabase.from("transactions").insert({
      lead_id: leadId,
      item: `${config.label} — Deposit Payment`,
      credit: DEPOSIT_AMOUNT,
      debit: 0,
      status: "completed",
      invoice_status: "paid",
      payment_method: "stripe",
      notes: `Stripe PI: ${paymentIntentId}`,
      transaction_date: now.toISOString(),
    });

    // Log activity
    const remainingAmount = config.totalPrice - DEPOSIT_AMOUNT;
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      action: "offer_payment_received",
      details: {
        tier,
        tier_label: config.label,
        deposit_amount: DEPOSIT_AMOUNT,
        total_price: config.totalPrice,
        remaining_balance: remainingAmount,
        currency: "aud",
        payment_intent_id: paymentIntentId,
        payment_method_saved: !!paymentMethodId,
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
