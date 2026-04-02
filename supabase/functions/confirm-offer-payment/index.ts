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

    const productName = TIER_TO_PRODUCT[tier];
    if (!productName) {
      return new Response(
        JSON.stringify({ error: `Invalid tier: ${tier}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the product from the products table
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("name, price")
      .eq("name", productName)
      .eq("product_type", "package")
      .eq("is_active", true)
      .maybeSingle();

    if (productError || !product) {
      console.error("[CONFIRM-OFFER-PAYMENT] Product lookup failed:", productError?.message || `No product found for "${productName}"`);
      return new Response(
        JSON.stringify({ error: `Product not found for tier: ${tier}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalPrice = product.price;
    const label = product.name;

    // Get deposit amount from system settings
    const { data: depositSetting } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "deposit_amount")
      .maybeSingle();

    const DEPOSIT_AMOUNT = (depositSetting?.setting_value as any)?.amount ?? 49;

    // Verify payment succeeded with Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({ error: "Payment has not succeeded" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      membership_tier: label,
      stripe_customer_id: customerId,
      stripe_payment_method_id: paymentMethodId,
      deal_amount: totalPrice,
      deal_closed_at: now.toISOString(),
    };

    if (existingLead) {
      const existingFormData = (existingLead.form_data as Record<string, unknown>) || {};
      const mergedFormData = {
        ...existingFormData,
        partial: false,
        offer_tier: tier,
        offer_tier_label: label,
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
            offer_tier_label: label,
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
      item: `${label} — Website Project`,
      credit: 0,
      debit: totalPrice,
      status: "completed",
      invoice_status: "not_sent",
      payment_method: null,
      notes: `Full project fee for ${label}`,
      transaction_date: now.toISOString(),
    });

    // 2. Deposit payment received (credit) — $49 paid now
    await supabase.from("transactions").insert({
      lead_id: leadId,
      item: `${label} — Deposit Payment`,
      credit: DEPOSIT_AMOUNT,
      debit: 0,
      status: "completed",
      invoice_status: "paid",
      payment_method: "stripe",
      notes: `Stripe PI: ${paymentIntentId}`,
      transaction_date: now.toISOString(),
    });

    // Log activity
    const remainingAmount = totalPrice - DEPOSIT_AMOUNT;
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      action: "offer_payment_received",
      details: {
        tier,
        tier_label: label,
        deposit_amount: DEPOSIT_AMOUNT,
        total_price: totalPrice,
        remaining_balance: remainingAmount,
        currency: "aud",
        payment_intent_id: paymentIntentId,
        payment_method_saved: !!paymentMethodId,
      },
    });

    // --- SEND EMAILS ---
    // 1. Send branded receipt email
    try {
      await supabase.functions.invoke("send-payment-email", {
        body: {
          leadId,
          amount: DEPOSIT_AMOUNT * 100, // cents
          description: `${label} — Deposit Payment`,
          stripePaymentIntentId: paymentIntentId,
        },
      });
      console.log("Receipt email sent");
    } catch (emailErr) {
      console.error("Failed to send receipt email:", emailErr);
    }

    // 2. Send onboarding email with next steps + booking link
    try {
      await supabase.functions.invoke("send-onboarding-email", {
        body: { leadId },
      });
      console.log("Onboarding email sent");
    } catch (emailErr) {
      console.error("Failed to send onboarding email:", emailErr);
    }

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
