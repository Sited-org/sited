import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHARGE-SAVED-CARD] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const adminUserId = userData.user?.id;
    if (!adminUserId) throw new Error("User not found");
    logStep("User authenticated", { userId: adminUserId });

    // Check if user has permission to charge cards
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('can_charge_cards')
      .eq('user_id', adminUserId)
      .single();

    if (roleError || !userRole?.can_charge_cards) {
      logStep("Permission denied", { userId: adminUserId, requiredPermission: 'can_charge_cards' });
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions: cannot charge cards' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    logStep("Permission validated", { permission: 'can_charge_cards' });

    const { lead_id, amount, description, transaction_ids, item_description } = await req.json();
    if (!lead_id) throw new Error("lead_id is required");
    if (!amount || amount <= 0) throw new Error("Valid amount is required");
    logStep("Request parsed", { lead_id, amount, description, transaction_ids, item_description });

    // Fetch lead with Stripe details
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select("id, name, email, stripe_customer_id, stripe_payment_method_id")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) throw new Error("Lead not found");
    logStep("Lead found", { customerId: lead.stripe_customer_id });

    // Calculate available account credit for this lead (credit pool minus already-paid debits)
    const today = new Date().toISOString().split('T')[0];
    const { data: transactions, error: txQueryError } = await supabaseClient
      .from("transactions")
      .select("credit, debit, transaction_date, invoice_status, item, notes")
      .eq("lead_id", lead_id);

    if (txQueryError) {
      logStep("Warning: Failed to query transactions for credit calculation", { error: txQueryError.message });
    }

    let availableCredit = 0;
    if (transactions?.length) {
      const dueTxs = transactions.filter((t: any) =>
        t.transaction_date <= today + 'T23:59:59.999Z' &&
        !t.item?.startsWith('VOID:') &&
        !t.notes?.includes('[VOIDED:')
      );

      const creditPool = dueTxs.reduce((sum: number, t: any) => sum + Number(t.credit || 0), 0);
      const paidDebits = dueTxs
        .filter((t: any) => t.invoice_status === 'paid')
        .reduce((sum: number, t: any) => sum + Number(t.debit || 0), 0);

      availableCredit = Math.max(0, creditPool - paidDebits);
    }
    logStep("Calculated available credit", { availableCredit, requestedAmount: amount });

    // Determine how much credit to apply and how much to charge
    const creditToApply = Math.min(availableCredit, amount);
    const netChargeAmount = amount - creditToApply;
    logStep("Credit application calculated", { creditToApply, netChargeAmount });

    const transactionItem = item_description || `Payment received`;
    let paymentIntentId = null;
    let paymentStatus = 'succeeded';

    // If there's an amount to charge via Stripe
    if (netChargeAmount > 0) {
      if (!lead.stripe_customer_id) throw new Error("No Stripe customer found for this lead");
      if (!lead.stripe_payment_method_id) throw new Error("No saved payment method found for this lead");
      
      logStep("Charging remaining amount via Stripe", { 
        customerId: lead.stripe_customer_id, 
        paymentMethodId: lead.stripe_payment_method_id,
        netChargeAmount
      });

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      // Retrieve the payment method to determine its type
      const paymentMethod = await stripe.paymentMethods.retrieve(lead.stripe_payment_method_id);
      logStep("Payment method retrieved", { 
        type: paymentMethod.type,
        id: paymentMethod.id 
      });

      // Determine payment method types based on saved method
      let paymentMethodTypes: string[];
      if (paymentMethod.type === "au_becs_debit") {
        paymentMethodTypes = ["au_becs_debit"];
      } else {
        paymentMethodTypes = ["card"];
      }

      // Create PaymentIntent for the net amount (after credit applied)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(netChargeAmount * 100), // Convert to cents
        currency: "aud",
        customer: lead.stripe_customer_id,
        payment_method: lead.stripe_payment_method_id,
        payment_method_types: paymentMethodTypes,
        off_session: true,
        confirm: true,
        description: description || `Payment for Lead: ${lead.name || lead.email}`,
        metadata: {
          lead_id: lead.id,
          transaction_ids: transaction_ids ? JSON.stringify(transaction_ids) : undefined,
          credit_applied: creditToApply.toString(),
          original_amount: amount.toString(),
        },
        // For AU BECS debit, we need a mandate
        ...(paymentMethod.type === "au_becs_debit" && {
          mandate_data: {
            customer_acceptance: {
              type: "offline",
            },
          },
        }),
      });

      logStep("PaymentIntent created", { 
        paymentIntentId: paymentIntent.id, 
        status: paymentIntent.status 
      });

      if (paymentIntent.status !== "succeeded" && paymentIntent.status !== "processing") {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }

      paymentIntentId = paymentIntent.id;
      paymentStatus = paymentIntent.status;
    } else {
      logStep("Full amount covered by credit, no Stripe charge needed");
    }

    // Record credit application transaction if credit was used
    if (creditToApply > 0) {
      const { error: creditTxError } = await supabaseClient
        .from("transactions")
        .insert({
          lead_id: lead_id,
          item: `Credit Applied: ${transactionItem}`,
          credit: 0,
          debit: creditToApply,
          status: "completed",
          transaction_date: new Date().toISOString(),
          notes: `Account credit applied to payment. Original charge: $${amount}, Credit used: $${creditToApply}${netChargeAmount > 0 ? `, Charged to card: $${netChargeAmount}` : ''}`,
          created_by: adminUserId,
          invoice_status: 'paid',
        });

      if (creditTxError) {
        logStep("Warning: Failed to create credit application record", { error: creditTxError.message });
      } else {
        logStep("Credit application transaction recorded", { creditToApply });
      }
    }

    // Record payment received transaction (for the net amount charged or full amount if only credit)
    if (netChargeAmount > 0) {
      const { error: txError } = await supabaseClient
        .from("transactions")
        .insert({
          lead_id: lead_id,
          item: transactionItem,
          credit: netChargeAmount,
          debit: 0,
          status: paymentStatus === "processing" ? "pending" : "completed",
          transaction_date: new Date().toISOString(),
          notes: `Stripe PaymentIntent: ${paymentIntentId}${paymentStatus === "processing" ? " (processing - bank transfer may take a few days)" : ""}${creditToApply > 0 ? `. Note: $${creditToApply} credit was also applied to this payment.` : ''}`,
          created_by: adminUserId,
          invoice_status: 'paid',
        });

      if (txError) {
        logStep("Warning: Failed to create payment transaction record", { error: txError.message });
      }
    }

    // Mark selected transactions as paid if provided
    if (transaction_ids && transaction_ids.length > 0) {
      await supabaseClient
        .from("transactions")
        .update({ 
          status: paymentStatus === "processing" ? "pending" : "completed",
          invoice_status: 'paid'
        })
        .in("id", transaction_ids);
      logStep("Marked transactions as completed/pending", { transaction_ids });
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntentId,
        status: paymentStatus,
        amount: amount,
        creditApplied: creditToApply,
        amountCharged: netChargeAmount,
        message: netChargeAmount === 0 
          ? `Full amount of $${amount} covered by account credit`
          : creditToApply > 0
            ? `$${creditToApply} credit applied, $${netChargeAmount} charged to payment method`
            : paymentStatus === "processing" 
              ? "Bank transfer initiated - payment will be completed in 1-3 business days" 
              : "Payment completed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    // Check for Stripe-specific errors
    let userMessage = errorMessage;
    if (errorMessage.includes("authentication_required")) {
      userMessage = "Card requires authentication. Please update the card details.";
    } else if (errorMessage.includes("card_declined")) {
      userMessage = "Card was declined. Please try a different card.";
    }
    
    return new Response(JSON.stringify({ error: userMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});