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
    logStep("User authenticated", { userId: adminUserId });

    const { lead_id, amount, description, transaction_ids } = await req.json();
    if (!lead_id) throw new Error("lead_id is required");
    if (!amount || amount <= 0) throw new Error("Valid amount is required");
    logStep("Request parsed", { lead_id, amount, description, transaction_ids });

    // Fetch lead with Stripe details
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select("id, name, email, stripe_customer_id, stripe_payment_method_id")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) throw new Error("Lead not found");
    if (!lead.stripe_customer_id) throw new Error("No Stripe customer found for this lead");
    if (!lead.stripe_payment_method_id) throw new Error("No saved payment method found for this lead");
    
    logStep("Lead found with payment details", { 
      customerId: lead.stripe_customer_id, 
      paymentMethodId: lead.stripe_payment_method_id 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create PaymentIntent and charge immediately
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "aud",
      customer: lead.stripe_customer_id,
      payment_method: lead.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      description: description || `Payment for Lead: ${lead.name || lead.email}`,
      metadata: {
        lead_id: lead.id,
        transaction_ids: transaction_ids ? JSON.stringify(transaction_ids) : undefined,
      },
    });

    logStep("PaymentIntent created", { 
      paymentIntentId: paymentIntent.id, 
      status: paymentIntent.status 
    });

    if (paymentIntent.status === "succeeded") {
      // Create credit transaction for the payment
      const { error: txError } = await supabaseClient
        .from("transactions")
        .insert({
          lead_id: lead_id,
          item: `Payment received (${paymentIntent.id})`,
          credit: amount,
          debit: 0,
          status: "completed",
          transaction_date: new Date().toISOString(),
          notes: `Stripe PaymentIntent: ${paymentIntent.id}`,
          created_by: adminUserId,
        });

      if (txError) {
        logStep("Warning: Failed to create transaction record", { error: txError.message });
      }

      // Mark selected transactions as paid if provided
      if (transaction_ids && transaction_ids.length > 0) {
        await supabaseClient
          .from("transactions")
          .update({ status: "completed" })
          .in("id", transaction_ids);
        logStep("Marked transactions as completed", { transaction_ids });
      }

      return new Response(
        JSON.stringify({
          success: true,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: amount,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }
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
