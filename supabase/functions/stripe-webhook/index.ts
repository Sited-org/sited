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

// Helper function to calculate available credit for a lead
async function getAvailableCredit(leadId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: transactions, error } = await supabaseAdmin
    .from("transactions")
    .select("credit, debit, transaction_date")
    .eq("lead_id", leadId);

  if (error || !transactions || transactions.length === 0) {
    return 0;
  }

  // Calculate available credit: when total credits exceed total debits
  const totalCredits = transactions
    .filter(t => t.transaction_date <= today + 'T23:59:59.999Z')
    .reduce((sum, t) => sum + Number(t.credit || 0), 0);
  const totalDebits = transactions
    .filter(t => t.transaction_date <= today + 'T23:59:59.999Z')
    .reduce((sum, t) => sum + Number(t.debit || 0), 0);
  
  // Available credit is the surplus when credits exceed debits (negative balance)
  const balance = totalDebits - totalCredits;
  return balance < 0 ? Math.abs(balance) : 0;
}

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

        // Check if this is a subscription invoice
        const isSubscriptionInvoice = !!invoice.subscription;
        console.log("[STRIPE-WEBHOOK] Is subscription invoice:", isSubscriptionInvoice);

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

        // Capture, attach, and save the payment method from the invoice payment
        if (leadId && invoice.payment_intent) {
          try {
            const paymentIntentId = typeof invoice.payment_intent === 'string' 
              ? invoice.payment_intent 
              : invoice.payment_intent.id;
            
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            
            if (paymentIntent.payment_method && invoice.customer) {
              const paymentMethodId = typeof paymentIntent.payment_method === 'string'
                ? paymentIntent.payment_method
                : paymentIntent.payment_method.id;
              
              const customerId = typeof invoice.customer === 'string'
                ? invoice.customer
                : invoice.customer.id;
              
              // Attach the payment method to the customer (if not already attached)
              try {
                await stripe.paymentMethods.attach(paymentMethodId, {
                  customer: customerId,
                });
                console.log("[STRIPE-WEBHOOK] Attached payment method to customer:", paymentMethodId);
              } catch (attachError: any) {
                // Payment method might already be attached, that's okay
                if (!attachError.message?.includes('already been attached')) {
                  console.log("[STRIPE-WEBHOOK] Payment method attach note:", attachError.message);
                }
              }
              
              // Set as the default payment method for future invoices and subscriptions
              await stripe.customers.update(customerId, {
                invoice_settings: {
                  default_payment_method: paymentMethodId,
                },
              });
              console.log("[STRIPE-WEBHOOK] Set as default payment method for customer:", customerId);
              
              // Save the payment method and customer ID to the lead for future charges
              await supabaseAdmin
                .from('leads')
                .update({ 
                  stripe_payment_method_id: paymentMethodId,
                  stripe_customer_id: customerId,
                })
                .eq('id', leadId);
              
              console.log("[STRIPE-WEBHOOK] Saved payment method and customer to lead:", paymentMethodId);
            }
          } catch (pmError: any) {
            console.error("[STRIPE-WEBHOOK] Error saving payment method:", pmError.message);
            // Don't fail the webhook if payment method capture fails
          }
        }

        // For subscription invoices, get lead_id from subscription metadata if not in invoice
        let actualLeadId = leadId;
        if (!actualLeadId && isSubscriptionInvoice && invoice.subscription) {
          try {
            const subscriptionId = typeof invoice.subscription === 'string' 
              ? invoice.subscription 
              : invoice.subscription.id;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            actualLeadId = subscription.metadata?.lead_id;
            console.log("[STRIPE-WEBHOOK] Got lead_id from subscription:", actualLeadId);
          } catch (subError: any) {
            console.error("[STRIPE-WEBHOOK] Error getting subscription:", subError.message);
          }
        }

        // Create transaction records for the payment with automatic credit application
        if (actualLeadId && invoice.amount_paid) {
          const amountPaid = invoice.amount_paid / 100; // Convert from cents
          
          // For subscription invoices, include the membership name
          let itemDescription = `Payment for Invoice #${invoice.number || invoice.id}`;
          if (isSubscriptionInvoice && invoice.lines?.data?.[0]?.description) {
            itemDescription = `Payment: ${invoice.lines.data[0].description}`;
          }
          
          // Check for available credit and apply it automatically
          const availableCredit = await getAvailableCredit(actualLeadId);
          console.log("[STRIPE-WEBHOOK] Available credit for lead:", availableCredit);
          
          if (availableCredit > 0 && isSubscriptionInvoice) {
            // Apply credit to this subscription payment
            const creditToApply = Math.min(availableCredit, amountPaid);
            const netPaymentRecorded = amountPaid - creditToApply;
            
            console.log("[STRIPE-WEBHOOK] Applying credit to subscription:", {
              amountPaid,
              creditToApply,
              netPaymentRecorded
            });
            
            // Record the credit application (debit against the credit balance)
            if (creditToApply > 0) {
              await supabaseAdmin
                .from('transactions')
                .insert({
                  lead_id: actualLeadId,
                  item: `Credit Applied: ${itemDescription.replace('Payment: ', '')}`,
                  credit: 0,
                  debit: creditToApply,
                  notes: `Account credit automatically applied to subscription payment. Original charge: $${amountPaid}, Credit used: $${creditToApply}${netPaymentRecorded > 0 ? `, Remaining charged: $${netPaymentRecorded}` : ''}`,
                  transaction_date: new Date().toISOString(),
                  is_recurring: false,
                  status: 'completed',
                  invoice_status: 'paid',
                });
              console.log("[STRIPE-WEBHOOK] Created credit application transaction:", creditToApply);
            }
            
            // Record the net payment (what was actually charged to the card)
            // Even if credit covered it all, we still record the Stripe payment
            await supabaseAdmin
              .from('transactions')
              .insert({
                lead_id: actualLeadId,
                item: itemDescription,
                credit: amountPaid, // Full amount as credit (Stripe charged this)
                debit: 0,
                notes: `Stripe Invoice ${invoice.id}${isSubscriptionInvoice ? ' (Recurring Subscription)' : ''}${creditToApply > 0 ? `. Note: $${creditToApply} credit was also applied from account balance.` : ''}`,
                transaction_date: new Date().toISOString(),
                is_recurring: false,
                status: 'completed',
                invoice_status: 'paid',
                stripe_invoice_id: invoice.id,
              });
            console.log("[STRIPE-WEBHOOK] Created credit transaction for payment:", amountPaid);
          } else {
            // No credit available or not a subscription - standard payment recording
            await supabaseAdmin
              .from('transactions')
              .insert({
                lead_id: actualLeadId,
                item: itemDescription,
                credit: amountPaid,
                debit: 0,
                notes: `Stripe Invoice ${invoice.id}${isSubscriptionInvoice ? ' (Recurring Subscription)' : ''}`,
                transaction_date: new Date().toISOString(),
                is_recurring: false,
                status: 'completed',
                invoice_status: 'paid',
                stripe_invoice_id: invoice.id,
              });
            console.log("[STRIPE-WEBHOOK] Created credit transaction for payment:", amountPaid);
          }
        }
        break;
      }

      case "invoice.created": {
        // Handle subscription invoice creation - create debit transaction for future billing
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[STRIPE-WEBHOOK] Invoice created:", invoice.id);
        
        if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
          console.log("[STRIPE-WEBHOOK] Subscription cycle invoice detected");
          
          try {
            const subscriptionId = typeof invoice.subscription === 'string' 
              ? invoice.subscription 
              : invoice.subscription.id;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const leadId = subscription.metadata?.lead_id;
            const membershipName = subscription.metadata?.membership_name;
            
            if (leadId && invoice.amount_due) {
              const amount = invoice.amount_due / 100;
              
              // Check available credit for preview in notes
              const availableCredit = await getAvailableCredit(leadId);
              const creditNote = availableCredit > 0 
                ? ` (Available credit: $${availableCredit.toFixed(2)} will be applied automatically)`
                : '';
              
              // Create a debit transaction for this billing cycle
              await supabaseAdmin
                .from('transactions')
                .insert({
                  lead_id: leadId,
                  item: membershipName || 'Subscription Renewal',
                  credit: 0,
                  debit: amount,
                  notes: `Auto-generated for subscription billing cycle${creditNote}`,
                  transaction_date: new Date().toISOString(),
                  is_recurring: true,
                  recurring_interval: 'monthly', // Will be overwritten based on subscription
                  status: 'completed',
                  invoice_status: 'processing',
                  stripe_invoice_id: invoice.id,
                });
              console.log("[STRIPE-WEBHOOK] Created debit transaction for subscription cycle:", amount, "Available credit:", availableCredit);
            }
          } catch (subError: any) {
            console.error("[STRIPE-WEBHOOK] Error handling subscription invoice:", subError.message);
          }
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("[STRIPE-WEBHOOK] Subscription created:", subscription.id);
        console.log("[STRIPE-WEBHOOK] Subscription metadata:", subscription.metadata);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("[STRIPE-WEBHOOK] Subscription updated:", subscription.id, "Status:", subscription.status);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("[STRIPE-WEBHOOK] Subscription cancelled:", subscription.id);
        
        const leadId = subscription.metadata?.lead_id;
        if (leadId) {
          // Mark recurring transactions as ended
          await supabaseAdmin
            .from('transactions')
            .update({ 
              recurring_end_date: new Date().toISOString()
            })
            .eq('lead_id', leadId)
            .eq('is_recurring', true)
            .is('recurring_end_date', null);
          console.log("[STRIPE-WEBHOOK] Marked recurring transactions as ended for lead:", leadId);
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