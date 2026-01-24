import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SYNC-PM-FROM-INVOICE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    logStep("User authenticated", { userId: userData.user?.id });

    const { lead_id } = await req.json();
    if (!lead_id) throw new Error("lead_id is required");

    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("id, stripe_customer_id")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) throw new Error("Lead not found");
    if (!lead.stripe_customer_id) {
      throw new Error("No Stripe customer on this lead yet");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find the most recent PAID invoice for this customer.
    // Stripe doesn't support ordering params here; default order is most recent first.
    const invoices = await stripe.invoices.list({
      customer: lead.stripe_customer_id,
      limit: 10,
    });

    const paidInvoice = invoices.data.find((inv: Stripe.Invoice) => inv.status === "paid" && !!inv.payment_intent);
    if (!paidInvoice) throw new Error("No paid invoice with a payment_intent found for this customer");

    const paymentIntentId =
      typeof paidInvoice.payment_intent === "string"
        ? paidInvoice.payment_intent
        : paidInvoice.payment_intent.id;

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!pi.payment_method) throw new Error("Paid invoice has no payment_method on the payment intent");

    const paymentMethodId =
      typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method.id;

    // Attach + set default (safe if already attached)
    try {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: lead.stripe_customer_id });
    } catch (attachError: any) {
      if (!attachError?.message?.includes("already been attached")) {
        logStep("Payment method attach note", { message: attachError?.message });
      }
    }

    await stripe.customers.update(lead.stripe_customer_id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Persist on lead
    const { error: updateError } = await supabaseAdmin
      .from("leads")
      .update({ stripe_payment_method_id: paymentMethodId })
      .eq("id", lead_id);

    if (updateError) throw new Error(`Failed updating lead: ${updateError.message}`);

    // Return a normalized response like save-payment-method
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    const response: any = { success: true, payment_method_id: paymentMethodId };

    if (pm.type === "card" && pm.card) {
      response.card = {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
      };
    } else if (pm.type === "au_becs_debit" && pm.au_becs_debit) {
      response.au_becs_debit = {
        bsb_number: pm.au_becs_debit.bsb_number,
        last4: pm.au_becs_debit.last4,
      };
    }

    logStep("Synced payment method", { lead_id, paymentMethodId, type: pm.type, invoice: paidInvoice.id });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
