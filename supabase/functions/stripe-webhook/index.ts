import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  console.log("[STRIPE-WEBHOOK] Received webhook");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      console.error("[STRIPE-WEBHOOK] Missing signature or webhook secret");
      return new Response(
        JSON.stringify({ error: "Missing signature or webhook secret" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log("[STRIPE-WEBHOOK] Signature verified successfully");
    } catch (err: any) {
      console.error("[STRIPE-WEBHOOK] Signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[STRIPE-WEBHOOK] Event type:", event.type);

    switch (event.type) {
      case "invoice.sent": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[STRIPE-WEBHOOK] Invoice sent:", invoice.id);
        
        const transactionIds = invoice.metadata?.transaction_ids?.split(',') || [];
        if (transactionIds.length > 0) {
          await supabaseAdmin
            .from('transactions')
            .update({ invoice_status: 'sent' })
            .in('id', transactionIds);
          console.log("[STRIPE-WEBHOOK] Updated transactions to 'sent'");
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[STRIPE-WEBHOOK] Invoice payment failed:", invoice.id);
        
        // Update transactions by stripe_invoice_id
        await supabaseAdmin
          .from('transactions')
          .update({ invoice_status: 'sent' }) // Keep as sent, payment failed
          .eq('stripe_invoice_id', invoice.id);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[STRIPE-WEBHOOK] Invoice paid:", invoice.id);
        
        const transactionIds = invoice.metadata?.transaction_ids?.split(',') || [];
        const leadId = invoice.metadata?.lead_id;

        // Update transaction statuses to 'paid'
        if (transactionIds.length > 0) {
          await supabaseAdmin
            .from('transactions')
            .update({ invoice_status: 'paid' })
            .in('id', transactionIds);
          console.log("[STRIPE-WEBHOOK] Updated transactions to 'paid'");
        } else {
          // Fallback to stripe_invoice_id
          await supabaseAdmin
            .from('transactions')
            .update({ invoice_status: 'paid' })
            .eq('stripe_invoice_id', invoice.id);
        }

        // Capture and save the payment method from the invoice payment
        if (leadId && invoice.payment_intent) {
          try {
            const paymentIntentId = typeof invoice.payment_intent === 'string' 
              ? invoice.payment_intent 
              : invoice.payment_intent.id;
            
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            
            if (paymentIntent.payment_method) {
              const paymentMethodId = typeof paymentIntent.payment_method === 'string'
                ? paymentIntent.payment_method
                : paymentIntent.payment_method.id;
              
              // Save the payment method to the lead for future charges
              await supabaseAdmin
                .from('leads')
                .update({ stripe_payment_method_id: paymentMethodId })
                .eq('id', leadId);
              
              console.log("[STRIPE-WEBHOOK] Saved payment method to lead:", paymentMethodId);
            }
          } catch (pmError: any) {
            console.error("[STRIPE-WEBHOOK] Error saving payment method:", pmError.message);
            // Don't fail the webhook if payment method capture fails
          }
        }

        // Create a credit transaction for the payment
        if (leadId && invoice.amount_paid) {
          const amountPaid = invoice.amount_paid / 100; // Convert from cents
          
          await supabaseAdmin
            .from('transactions')
            .insert({
              lead_id: leadId,
              item: `Payment for Invoice #${invoice.number || invoice.id}`,
              credit: amountPaid,
              debit: 0,
              notes: `Stripe Invoice ${invoice.id}`,
              transaction_date: new Date().toISOString(),
              is_recurring: false,
              status: 'completed',
              invoice_status: 'paid',
              stripe_invoice_id: invoice.id,
            });
          console.log("[STRIPE-WEBHOOK] Created credit transaction for payment:", amountPaid);
        }
        break;
      }

      case "payment_intent.processing": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[STRIPE-WEBHOOK] Payment processing:", paymentIntent.id);
        
        // If this is linked to an invoice, update status
        if (paymentIntent.invoice) {
          const invoiceId = typeof paymentIntent.invoice === 'string' 
            ? paymentIntent.invoice 
            : paymentIntent.invoice.id;
          
          await supabaseAdmin
            .from('transactions')
            .update({ invoice_status: 'processing' })
            .eq('stripe_invoice_id', invoiceId);
          console.log("[STRIPE-WEBHOOK] Updated transactions to 'processing'");
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[STRIPE-WEBHOOK] Payment succeeded:", paymentIntent.id);
        
        // If this is linked to an invoice, it will be handled by invoice.paid
        // This handles direct payment intents (not via invoice)
        if (!paymentIntent.invoice) {
          const transactionIds = paymentIntent.metadata?.transaction_ids?.split(',') || [];
          if (transactionIds.length > 0) {
            await supabaseAdmin
              .from('transactions')
              .update({ invoice_status: 'paid' })
              .in('id', transactionIds);
            console.log("[STRIPE-WEBHOOK] Updated direct payment transactions to 'paid'");
          }
        }
        break;
      }

      default:
        console.log("[STRIPE-WEBHOOK] Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("[STRIPE-WEBHOOK] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
