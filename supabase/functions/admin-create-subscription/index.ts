import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-CREATE-SUB] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { lead_id, price_id, membership_name, membership_price, billing_interval } = await req.json();
    logStep("Request", { lead_id, price_id, membership_name });

    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) throw new Error(`Lead not found: ${leadError?.message}`);
    logStep("Lead found", { email: lead.email, name: lead.name });

    const hasPaymentMethod = !!lead.stripe_payment_method_id;
    let customerId = lead.stripe_customer_id;

    if (!customerId) throw new Error("No Stripe customer ID on lead");

    // Attach payment method if exists
    if (hasPaymentMethod) {
      try {
        await stripe.paymentMethods.attach(lead.stripe_payment_method_id, { customer: customerId });
      } catch (e: any) {
        if (!e.message?.includes('already been attached')) {
          logStep("Payment method note", { message: e.message });
        }
      }
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: lead.stripe_payment_method_id },
      });
    }

    // Anchor to May 1st 2026
    const anchorDate = new Date(Date.UTC(2026, 4, 1)); // May 1, 2026
    logStep("Billing anchor", { anchorDate: anchorDate.toISOString() });

    const subParams: any = {
      customer: customerId,
      items: [{ price: price_id }],
      billing_cycle_anchor: Math.floor(anchorDate.getTime() / 1000),
      proration_behavior: 'none',
      metadata: { lead_id: lead.id, membership_name },
    };

    if (hasPaymentMethod) {
      subParams.default_payment_method = lead.stripe_payment_method_id;
      subParams.payment_behavior = 'error_if_incomplete';
    } else {
      subParams.collection_method = 'send_invoice';
      subParams.days_until_due = 7;
    }

    const subscription = await stripe.subscriptions.create(subParams);
    logStep("Created subscription", { id: subscription.id, status: subscription.status });

    // Record recurring transaction
    await supabaseAdmin.from('transactions').insert({
      lead_id: lead.id,
      item: membership_name,
      credit: 0,
      debit: membership_price,
      notes: `Stripe Subscription: ${subscription.id}`,
      transaction_date: new Date().toISOString(),
      is_recurring: true,
      recurring_interval: billing_interval || 'monthly',
      recurring_end_date: null,
      status: 'completed',
      invoice_status: 'not_sent',
      stripe_invoice_id: subscription.latest_invoice?.toString() || null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        status: subscription.status,
        next_billing: new Date(subscription.current_period_end * 1000).toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
