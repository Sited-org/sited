import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not found");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const { subscription_id, lead_id, cancel_at_period_end } = await req.json();
    logStep("Received request", { subscription_id, lead_id, cancel_at_period_end });

    if (!subscription_id) {
      throw new Error("subscription_id is required");
    }

    // Cancel the subscription
    let canceledSubscription;
    if (cancel_at_period_end) {
      // Cancel at end of billing period
      canceledSubscription = await stripe.subscriptions.update(subscription_id, {
        cancel_at_period_end: true,
      });
      logStep("Subscription set to cancel at period end", { 
        id: canceledSubscription.id, 
        cancel_at: canceledSubscription.cancel_at 
      });
    } else {
      // Cancel immediately
      canceledSubscription = await stripe.subscriptions.cancel(subscription_id);
      logStep("Subscription cancelled immediately", { id: canceledSubscription.id });
    }

    // Update local transactions if lead_id provided
    if (lead_id) {
      // First fetch existing notes to preserve them
      const { data: existingTxs } = await supabaseAdmin
        .from('transactions')
        .select('id, notes')
        .eq('lead_id', lead_id)
        .eq('is_recurring', true)
        .is('recurring_end_date', null);

      for (const tx of (existingTxs || [])) {
        const existingNotes = tx.notes || '';
        const cancelNote = `[Cancelled ${new Date().toISOString().split('T')[0]}]`;
        const updatedNotes = existingNotes ? `${existingNotes}\n${cancelNote}` : cancelNote;

        await supabaseAdmin
          .from('transactions')
          .update({
            is_recurring: false,
            recurring_end_date: new Date().toISOString(),
            notes: updatedNotes,
          })
          .eq('id', tx.id);
      }
      logStep("Updated local transactions", { count: existingTxs?.length || 0 });
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: canceledSubscription.id,
          status: canceledSubscription.status,
          cancel_at_period_end: canceledSubscription.cancel_at_period_end,
          canceled_at: canceledSubscription.canceled_at,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
