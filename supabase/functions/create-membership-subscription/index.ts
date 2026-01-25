import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-MEMBERSHIP-SUB] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
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

    // Check if user has permission to manage subscriptions (requires can_charge_cards)
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('can_charge_cards')
      .eq('user_id', userData.user.id)
      .single();

    if (roleError || !userRole?.can_charge_cards) {
      logStep("Permission denied", { userId: userData.user.id, requiredPermission: 'can_charge_cards' });
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions: cannot manage subscriptions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    logStep("Permission validated", { permission: 'can_charge_cards' });

    const body = await req.json();
    const { 
      lead_id, 
      membership_name, 
      membership_price, 
      billing_interval, 
      start_date,
      notes 
    } = body;

    logStep("Request body", { lead_id, membership_name, membership_price, billing_interval, start_date });

    if (!lead_id || !membership_name || !membership_price || !billing_interval) {
      throw new Error("Missing required fields: lead_id, membership_name, membership_price, billing_interval");
    }

    // Get the lead details
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error(`Lead not found: ${leadError?.message || 'Unknown error'}`);
    }

    logStep("Lead found", { email: lead.email, name: lead.name });

    // Check if lead has a saved payment method - if not, we'll use invoice-based collection
    const hasPaymentMethod = !!lead.stripe_payment_method_id;
    logStep("Payment method status", { hasPaymentMethod });

    // Get or create Stripe customer
    let customerId = lead.stripe_customer_id;
    
    if (!customerId) {
      // Check if customer exists by email
      const customers = await stripe.customers.list({ email: lead.email, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      } else {
        // Create new customer - use ONLY business name for invoicing (no fallback to personal name)
        const customer = await stripe.customers.create({
          email: lead.email,
          name: lead.business_name || undefined, // Only business name - never personal name on invoices
          metadata: {
            lead_id: lead.id,
          },
        });
        customerId = customer.id;
        logStep("Created new Stripe customer with business name only", { customerId, businessName: lead.business_name });
      }
      
      // Save customer ID to lead
      await supabaseAdmin
        .from('leads')
        .update({ stripe_customer_id: customerId })
        .eq('id', lead.id);
    }

    // If payment method exists, attach it and set as default
    if (hasPaymentMethod) {
      try {
        await stripe.paymentMethods.attach(lead.stripe_payment_method_id, {
          customer: customerId,
        });
        logStep("Attached payment method to customer");
      } catch (attachError: any) {
        // Payment method might already be attached
        if (!attachError.message?.includes('already been attached')) {
          logStep("Payment method attachment note", { message: attachError.message });
        }
      }

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: lead.stripe_payment_method_id,
        },
      });
      logStep("Set default payment method");
    } else {
      logStep("No payment method - subscription will use invoice collection");
    }

    // Convert billing interval to Stripe interval
    const intervalMap: Record<string, Stripe.PriceCreateParams.Recurring.Interval> = {
      'daily': 'day',
      'weekly': 'week',
      'monthly': 'month',
      'yearly': 'year',
    };
    
    const stripeInterval = intervalMap[billing_interval.toLowerCase()] || 'month';

    // Create or find a product for this membership
    const productName = `Membership: ${membership_name}`;
    let product: Stripe.Product;
    
    // Search for existing product
    const existingProducts = await stripe.products.search({
      query: `name:'${productName.replace(/'/g, "\\'")}' active:'true'`,
    });

    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      logStep("Found existing product", { productId: product.id });
    } else {
      product = await stripe.products.create({
        name: productName,
        metadata: {
          membership_name: membership_name,
          lead_id: lead.id,
        },
      });
      logStep("Created new product", { productId: product.id });
    }

    // Create a price for this subscription
    const priceInCents = Math.round(membership_price * 100);
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: priceInCents,
      currency: 'aud',
      recurring: {
        interval: stripeInterval,
      },
      metadata: {
        membership_name: membership_name,
        lead_id: lead.id,
      },
    });
    logStep("Created price", { priceId: price.id, amount: priceInCents, interval: stripeInterval });

    // Calculate billing cycle anchor if start_date is in the future
    const now = new Date();
    const startDateTime = start_date ? new Date(start_date) : now;
    const isFutureStart = startDateTime > now;
    
    // Create the subscription - use invoice collection if no payment method
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: price.id }],
      metadata: {
        lead_id: lead.id,
        membership_name: membership_name,
      },
    };

    if (hasPaymentMethod) {
      // Auto-charge with saved payment method
      subscriptionParams.default_payment_method = lead.stripe_payment_method_id;
      subscriptionParams.payment_behavior = 'error_if_incomplete';
      logStep("Using auto-charge mode with saved payment method");
    } else {
      // Send invoices for manual payment - payment method will be saved on first payment
      subscriptionParams.collection_method = 'send_invoice';
      subscriptionParams.days_until_due = 7; // Give 7 days to pay
      logStep("Using invoice collection mode - client will receive invoice emails");
    }

    // If start date is in the future, use billing_cycle_anchor
    if (isFutureStart) {
      subscriptionParams.billing_cycle_anchor = Math.floor(startDateTime.getTime() / 1000);
      subscriptionParams.proration_behavior = 'none';
      logStep("Setting future start date", { billing_cycle_anchor: subscriptionParams.billing_cycle_anchor });
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);
    logStep("Created subscription", { 
      subscriptionId: subscription.id, 
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
    });

    // Create the initial transaction record
    const transactionDate = start_date || new Date().toISOString();
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        lead_id: lead.id,
        item: membership_name,
        credit: 0,
        debit: membership_price,
        notes: notes || `Stripe Subscription: ${subscription.id}`,
        transaction_date: transactionDate,
        is_recurring: true,
        recurring_interval: billing_interval,
        recurring_end_date: null,
        status: 'completed',
        invoice_status: isFutureStart ? 'not_sent' : 'processing',
        stripe_invoice_id: subscription.latest_invoice?.toString() || null,
      })
      .select()
      .single();

    if (transactionError) {
      logStep("Warning: Failed to create transaction record", { error: transactionError.message });
    } else {
      logStep("Created transaction record", { transactionId: transaction?.id });
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        customer_id: customerId,
        next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});