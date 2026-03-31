import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-MEMBERSHIPS] ${step}${detailsStr}`);
};

// Canonical Stripe subscription products & prices (AUD monthly)
const SUBSCRIPTION_CATALOG: Record<string, { product_id: string; price_id: string }> = {
  "Website Maintenance (50% Off)": {
    product_id: "prod_TnRZxaGBaJrIr0",
    price_id: "price_1SpqgCKEOhx2BLuXsg4dudMG",
  },
  "Essential Blue": {
    product_id: "prod_UFLBBm0VRlSry9",
    price_id: "price_1TGqUjKEOhx2BLuXq1GvYlEF",
  },
  "Gold": {
    product_id: "prod_UFLB6tozCem5F8",
    price_id: "price_1TGqUkKEOhx2BLuXw4C6vcGG",
  },
  "Platinum": {
    product_id: "prod_UFLBRkmrYptvDJ",
    price_id: "price_1TGqUkKEOhx2BLuXJG24q0Fx",
  },
};

function findCatalogEntry(name: string): { product_id: string; price_id: string } | null {
  const lower = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(SUBSCRIPTION_CATALOG)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return val;
  }
  if (lower.includes("maintenance") || lower.includes("50%")) return SUBSCRIPTION_CATALOG["Website Maintenance (50% Off)"];
  if (lower.includes("blue") || lower.includes("essential")) return SUBSCRIPTION_CATALOG["Essential Blue"];
  if (lower.includes("gold")) return SUBSCRIPTION_CATALOG["Gold"];
  if (lower.includes("platinum")) return SUBSCRIPTION_CATALOG["Platinum"];
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

    // Find active recurring transactions without a Stripe subscription
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

    const needsSync = (unsyncedMemberships || []).filter(
      (tx: any) => !tx.notes?.includes('Stripe Subscription:')
    );

    logStep("Found unsynced memberships", { count: needsSync.length });

    const results: any[] = [];

    for (const tx of needsSync) {
      const lead = tx.leads as any;
      try {
        logStep("Processing", { lead: lead.name, item: tx.item, amount: tx.debit });

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

        // Check for existing active subscription at similar amount
        const existingSubs = await stripe.subscriptions.list({ customer: customerId, status: 'active' });
        const alreadyHasSub = existingSubs.data.some(sub => {
          const subAmount = sub.items.data[0]?.price?.unit_amount;
          return subAmount === Math.round(Number(tx.debit) * 100);
        });

        if (alreadyHasSub) {
          logStep("Already has matching subscription, skipping", { lead: lead.name });
          results.push({ lead: lead.name, item: tx.item, status: 'already_synced' });
          continue;
        }

        // Resolve canonical price or create ad-hoc
        const catalogEntry = findCatalogEntry(tx.item);
        let priceId: string;

        if (catalogEntry) {
          priceId = catalogEntry.price_id;
          logStep("Using canonical price", { priceId });
        } else {
          // Fallback: create product & price
          const intervalMap: Record<string, string> = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' };
          const stripeInterval = intervalMap[tx.recurring_interval?.toLowerCase() || 'monthly'] || 'month';
          const product = await stripe.products.create({ name: tx.item, metadata: { membership_name: tx.item } });
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(Number(tx.debit) * 100),
            currency: 'aud',
            recurring: { interval: stripeInterval as any },
          });
          priceId = price.id;
        }

        // Attach payment method if exists
        const hasPaymentMethod = !!lead.stripe_payment_method_id;
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

        // Update transaction with subscription reference
        const existingNotes = tx.notes || '';
        const updatedNotes = existingNotes
          ? `${existingNotes}\nStripe Subscription: ${subscription.id}`
          : `Stripe Subscription: ${subscription.id}`;

        await supabaseAdmin.from('transactions').update({ notes: updatedNotes }).eq('id', tx.id);

        results.push({
          lead: lead.name,
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
