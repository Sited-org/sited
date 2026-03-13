import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-MEMBERSHIPS] ${step}${detailsStr}`);
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

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError || !userData.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Check permission
      const { data: userRole } = await supabaseAdmin
        .from('user_roles')
        .select('can_charge_cards')
        .eq('user_id', userData.user.id)
        .single();

      if (!userRole?.can_charge_cards) {
        return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Find active recurring transactions that DON'T have a Stripe subscription
    const { data: unsyncedMemberships, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select(`
        id, lead_id, item, debit, recurring_interval, notes,
        leads!inner ( id, name, email, business_name, stripe_customer_id, stripe_payment_method_id )
      `)
      .eq('is_recurring', true)
      .is('recurring_end_date', null)
      .not('item', 'like', 'VOID:%');

    if (fetchError) throw new Error(`Failed to fetch memberships: ${fetchError.message}`);

    // Filter out ones that already have a Stripe subscription
    const needsSync = (unsyncedMemberships || []).filter(
      (tx: any) => !tx.notes?.includes('Stripe Subscription:')
    );

    logStep("Found unsynced memberships", { count: needsSync.length });

    const results: any[] = [];

    for (const tx of needsSync) {
      const lead = tx.leads as any;
      try {
        logStep("Processing", { lead: lead.name, item: tx.item, amount: tx.debit });

        // Ensure Stripe customer exists
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

        // Check if this customer already has an active subscription for a similar amount
        const existingSubs = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
        });

        const alreadyHasSub = existingSubs.data.some(sub => {
          const subAmount = sub.items.data[0]?.price?.unit_amount;
          return subAmount === Math.round(Number(tx.debit) * 100);
        });

        if (alreadyHasSub) {
          logStep("Already has matching subscription, skipping", { lead: lead.name });
          results.push({ lead: lead.name, item: tx.item, status: 'already_synced' });
          continue;
        }

        // Convert interval
        const intervalMap: Record<string, string> = {
          daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year',
        };
        const stripeInterval = intervalMap[tx.recurring_interval?.toLowerCase() || 'monthly'] || 'month';

        // Create price for this membership
        const productName = tx.item;
        const existingProducts = await stripe.products.search({
          query: `name:'${productName.replace(/'/g, "\\'")}' active:'true'`,
        });

        let productId: string;
        if (existingProducts.data.length > 0) {
          productId = existingProducts.data[0].id;
        } else {
          const product = await stripe.products.create({
            name: productName,
            metadata: { membership_name: tx.item },
          });
          productId = product.id;
        }

        // Find or create a matching price
        const existingPrices = await stripe.prices.list({ product: productId, limit: 10 });
        const targetAmount = Math.round(Number(tx.debit) * 100);
        let priceId = existingPrices.data.find(
          p => p.unit_amount === targetAmount && p.currency === 'aud' && p.recurring?.interval === stripeInterval && p.active
        )?.id;

        if (!priceId) {
          const price = await stripe.prices.create({
            product: productId,
            unit_amount: targetAmount,
            currency: 'aud',
            recurring: { interval: stripeInterval as any },
          });
          priceId = price.id;
        }

        // If payment method exists, attach and set as default
        const hasPaymentMethod = !!lead.stripe_payment_method_id;
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

        // Create subscription
        const subParams: any = {
          customer: customerId,
          items: [{ price: priceId }],
          metadata: { lead_id: lead.id, membership_name: tx.item },
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

        // Update the local transaction record with the Stripe subscription reference
        const existingNotes = tx.notes || '';
        const updatedNotes = existingNotes
          ? `${existingNotes}\nStripe Subscription: ${subscription.id}`
          : `Stripe Subscription: ${subscription.id}`;

        await supabaseAdmin
          .from('transactions')
          .update({ notes: updatedNotes })
          .eq('id', tx.id);

        results.push({
          lead: lead.name,
          email: lead.email,
          item: tx.item,
          amount: tx.debit,
          subscription_id: subscription.id,
          status: subscription.status,
          collection_method: hasPaymentMethod ? 'charge_automatically' : 'send_invoice',
          success: true,
        });

      } catch (err: any) {
        logStep("Error processing", { lead: lead.name, error: err.message });
        results.push({ lead: lead.name, item: tx.item, error: err.message, success: false });
      }
    }

    logStep("Sync complete", {
      total: results.length,
      synced: results.filter(r => r.success).length,
      failed: results.filter(r => r.success === false).length,
      skipped: results.filter(r => r.status === 'already_synced').length,
    });

    return new Response(
      JSON.stringify({ success: true, results }),
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