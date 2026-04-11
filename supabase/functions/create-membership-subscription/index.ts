import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-MEMBERSHIP-SUB] ${step}${detailsStr}`);
};

// Canonical Stripe subscription products & prices (AUD monthly)
const SUBSCRIPTION_CATALOG: Record<string, { product_id: string; price_id: string }> = {
  "Website Maintenance (50% Off)": {
    product_id: "prod_TnRZxaGBaJrIr0",
    price_id: "price_1SpqgCKEOhx2BLuXsg4dudMG", // $60/mo
  },
  "Blue Subscription": {
    product_id: "prod_UFLBBm0VRlSry9",
    price_id: "price_1TGqUjKEOhx2BLuXq1GvYlEF", // $120/mo
  },
  "Gold Subscription": {
    product_id: "prod_UFLB6tozCem5F8",
    price_id: "price_1TGqUkKEOhx2BLuXw4C6vcGG", // $139/mo
  },
  "Platinum Subscription": {
    product_id: "prod_UFLBRkmrYptvDJ",
    price_id: "price_1TGqUkKEOhx2BLuXJG24q0Fx", // $180/mo
  },
};

// Fuzzy-match membership name to canonical catalog entry
function findCatalogEntry(name: string): { product_id: string; price_id: string } | null {
  const lower = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(SUBSCRIPTION_CATALOG)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val;
    }
  }
  // Try partial matches
  if (lower.includes("maintenance") || lower.includes("50%")) return SUBSCRIPTION_CATALOG["Website Maintenance (50% Off)"];
  if (lower.includes("blue") || lower.includes("essential")) return SUBSCRIPTION_CATALOG["Blue Subscription"];
  if (lower.includes("gold")) return SUBSCRIPTION_CATALOG["Gold Subscription"];
  if (lower.includes("platinum")) return SUBSCRIPTION_CATALOG["Platinum Subscription"];
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");
    logStep("User authenticated", { userId: userData.user.id });

    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('can_charge_cards')
      .eq('user_id', userData.user.id)
      .single();

    if (roleError || !userRole?.can_charge_cards) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { lead_id, membership_name, membership_price, billing_interval, start_date, billing_start_month, charge_current_month, notes } = body;

    if (!lead_id || !membership_name || !membership_price || !billing_interval) {
      throw new Error("Missing required fields: lead_id, membership_name, membership_price, billing_interval");
    }

    logStep("Request", { lead_id, membership_name, membership_price, billing_interval, charge_current_month });

    // Get the lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) throw new Error(`Lead not found: ${leadError?.message}`);
    logStep("Lead found", { email: lead.email, name: lead.name });

    const hasPaymentMethod = !!lead.stripe_payment_method_id;

    // Get or create Stripe customer
    let customerId = lead.stripe_customer_id;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: lead.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: lead.email,
          name: lead.business_name || undefined,
          metadata: { lead_id: lead.id },
        });
        customerId = customer.id;
      }
      await supabaseAdmin.from('leads').update({ stripe_customer_id: customerId }).eq('id', lead.id);
    }

    // Attach payment method if exists
    if (hasPaymentMethod) {
      try {
        await stripe.paymentMethods.attach(lead.stripe_payment_method_id, { customer: customerId });
      } catch (e: any) {
        if (!e.message?.includes('already been attached')) {
          logStep("Payment method attachment note", { message: e.message });
        }
      }
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: lead.stripe_payment_method_id },
      });
    }

    // --- Resolve the Stripe price to use ---
    // Try canonical catalog first
    const catalogEntry = findCatalogEntry(membership_name);
    let priceId: string;

    if (catalogEntry) {
      priceId = catalogEntry.price_id;
      logStep("Using canonical price", { priceId, productId: catalogEntry.product_id });
    } else {
      // Fallback: create ad-hoc product & price (rare edge case for custom memberships)
      logStep("No canonical match — creating ad-hoc product/price", { membership_name });
      const intervalMap: Record<string, string> = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' };
      const stripeInterval = intervalMap[billing_interval.toLowerCase()] || 'month';
      const product = await stripe.products.create({
        name: membership_name,
        metadata: { membership_name },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(membership_price * 100),
        currency: 'aud',
        recurring: { interval: stripeInterval as any },
      });
      priceId = price.id;
      logStep("Created ad-hoc price", { priceId, productId: product.id });
    }

    // Determine billing anchor — admin can choose a specific start month
    const now = new Date();
    let anchorDate: Date;
    
    if (billing_start_month) {
      // billing_start_month format: "YYYY-MM" (e.g. "2026-05")
      const [year, month] = billing_start_month.split('-').map(Number);
      anchorDate = new Date(Date.UTC(year, month - 1, 1)); // month is 0-indexed
      
      // Ensure anchor is in the future
      if (anchorDate.getTime() <= now.getTime()) {
        // If selected month is current or past, push to next month
        anchorDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
      }
    } else {
      // Default: 1st of next month
      anchorDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
    }
    logStep("Billing anchor", { anchorDate: anchorDate.toISOString(), billing_start_month });

    // Create subscription
    const subParams: any = {
      customer: customerId!,
      items: [{ price: priceId }],
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

    // --- Handle immediate current-month billing ---
    let currentMonthInvoiceId: string | null = null;
    if (charge_current_month) {
      logStep("Charging current month immediately");
      const now = new Date();
      const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

      // Create a one-time invoice item for current month (full price)
      await stripe.invoiceItems.create({
        customer: customerId!,
        amount: Math.round(membership_price * 100),
        currency: 'aud',
        description: `${membership_name} — ${monthName} (Full Month)`,
      });

      // Create and finalize the invoice
      const invoiceParams: any = {
        customer: customerId!,
        auto_advance: true,
        metadata: { lead_id: lead.id, membership_name, type: 'current_month_charge' },
      };

      if (!hasPaymentMethod) {
        invoiceParams.collection_method = 'send_invoice';
        invoiceParams.days_until_due = 7;
      }

      const invoice = await stripe.invoices.create(invoiceParams);
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
      currentMonthInvoiceId = finalizedInvoice.id;
      logStep("Current month invoice created", { invoiceId: finalizedInvoice.id, status: finalizedInvoice.status });

      // If card on file, attempt to pay immediately
      if (hasPaymentMethod) {
        try {
          await stripe.invoices.pay(finalizedInvoice.id);
          logStep("Current month invoice paid immediately");
        } catch (payError: any) {
          logStep("Current month invoice payment failed — will retry via Stripe", { message: payError.message });
        }
      }

      // Record the current-month charge as a separate transaction
      await supabaseAdmin.from('transactions').insert({
        lead_id: lead.id,
        item: `${membership_name} — ${monthName}`,
        credit: 0,
        debit: membership_price,
        notes: notes ? `${notes}\nCurrent month charge — Invoice: ${finalizedInvoice.id}` : `Current month charge — Invoice: ${finalizedInvoice.id}`,
        transaction_date: new Date().toISOString(),
        is_recurring: false,
        recurring_interval: null,
        recurring_end_date: null,
        status: 'completed',
        invoice_status: hasPaymentMethod ? 'processing' : 'sent',
        stripe_invoice_id: finalizedInvoice.id,
      });
    }

    // Record recurring transaction (the subscription schedule row)
    await supabaseAdmin.from('transactions').insert({
      lead_id: lead.id,
      item: membership_name,
      credit: 0,
      debit: membership_price,
      notes: notes ? `${notes}\nStripe Subscription: ${subscription.id}` : `Stripe Subscription: ${subscription.id}`,
      transaction_date: start_date || new Date().toISOString(),
      is_recurring: true,
      recurring_interval: billing_interval,
      recurring_end_date: null,
      status: 'completed',
      invoice_status: 'not_sent',
      stripe_invoice_id: subscription.latest_invoice?.toString() || null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        customer_id: customerId,
        next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
        current_month_invoice_id: currentMonthInvoiceId,
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
