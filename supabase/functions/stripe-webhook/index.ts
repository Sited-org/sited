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

// Helper function to calculate available credit for a lead (credit pool minus already-paid debits)
async function getAvailableCredit(leadId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: transactions, error } = await supabaseAdmin
    .from("transactions")
    .select("credit, debit, transaction_date, invoice_status, item, notes")
    .eq("lead_id", leadId);

  if (error || !transactions || transactions.length === 0) {
    return 0;
  }

  // Filter to due transactions (not future) and exclude voided
  const dueTxs = transactions.filter((t: any) =>
    t.transaction_date <= today + 'T23:59:59.999Z' &&
    !t.item?.startsWith('VOID:') &&
    !t.notes?.includes('[VOIDED:')
  );

  // Credit pool = all credits received
  const creditPool = dueTxs.reduce((sum: number, t: any) => sum + Number(t.credit || 0), 0);
  // Paid debits = debits that have been settled (invoice_status = 'paid')
  const paidDebits = dueTxs
    .filter((t: any) => t.invoice_status === 'paid')
    .reduce((sum: number, t: any) => sum + Number(t.debit || 0), 0);

  return Math.max(0, creditPool - paidDebits);
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

        // Create transaction records for the payment
        // Note: Credit is already applied as a negative line item on the invoice before charging
        // So invoice.amount_paid reflects the NET amount after credit
        if (actualLeadId && invoice.amount_paid !== undefined) {
          const amountPaid = invoice.amount_paid / 100; // Convert from cents (this is NET after credit)
          
          // Check if credit was applied by looking at the metadata
          const creditApplied = invoice.metadata?.credit_applied 
            ? parseFloat(invoice.metadata.credit_applied) 
            : 0;
          const originalAmount = invoice.metadata?.invoice_subtotal
            ? parseFloat(invoice.metadata.invoice_subtotal)
            : amountPaid + creditApplied;
          
          // For subscription invoices, include the membership name
          let itemDescription = `Payment for Invoice #${invoice.number || invoice.id}`;
          if (isSubscriptionInvoice && invoice.lines?.data?.[0]?.description) {
            itemDescription = `Payment: ${invoice.lines.data[0].description}`;
          }
          
          console.log("[STRIPE-WEBHOOK] Recording payment:", {
            amountPaid,
            creditApplied,
            originalAmount,
            isSubscription: isSubscriptionInvoice
          });
          
          // Record the net payment (what was actually charged)
          if (amountPaid > 0) {
            await supabaseAdmin
              .from('transactions')
              .insert({
                lead_id: actualLeadId,
                item: itemDescription,
                credit: amountPaid,
                debit: 0,
                notes: `Stripe Invoice ${invoice.id}${isSubscriptionInvoice ? ' (Recurring Subscription)' : ''}${creditApplied > 0 ? `. Original: $${originalAmount}, Credit applied: $${creditApplied}, Charged: $${amountPaid}` : ''}`,
                transaction_date: new Date().toISOString(),
                is_recurring: false,
                status: 'completed',
                invoice_status: 'paid',
                stripe_invoice_id: invoice.id,
              });
            console.log("[STRIPE-WEBHOOK] Created payment transaction:", amountPaid);
          } else if (creditApplied > 0) {
            // If fully covered by credit, still record a $0 payment for audit trail
            await supabaseAdmin
              .from('transactions')
              .insert({
                lead_id: actualLeadId,
                item: itemDescription,
                credit: 0,
                debit: 0,
                notes: `Stripe Invoice ${invoice.id} fully covered by account credit ($${creditApplied})`,
                transaction_date: new Date().toISOString(),
                is_recurring: false,
                status: 'completed',
                invoice_status: 'paid',
                stripe_invoice_id: invoice.id,
              });
            console.log("[STRIPE-WEBHOOK] Created $0 payment transaction (credit covered)");
          }
        }
        break;
      }

      case "invoice.created": {
        // Handle subscription invoice creation - apply credit BEFORE finalization/charging
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[STRIPE-WEBHOOK] Invoice created:", invoice.id, "Status:", invoice.status, "Billing reason:", invoice.billing_reason);
        
        const isSubscriptionInvoice = !!invoice.subscription && 
          (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_create');
        
        if (isSubscriptionInvoice && invoice.status === 'draft') {
          console.log("[STRIPE-WEBHOOK] Subscription draft invoice detected - checking credit");
          
          try {
            const subscriptionId = typeof invoice.subscription === 'string' 
              ? invoice.subscription 
              : invoice.subscription!.id;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const leadId = subscription.metadata?.lead_id;
            const membershipName = subscription.metadata?.membership_name;
            
            console.log("[STRIPE-WEBHOOK] Subscription metadata:", { leadId, membershipName });
            
            if (leadId && invoice.amount_due) {
              const invoiceAmount = invoice.amount_due / 100;
              const availableCredit = await getAvailableCredit(leadId);
              const creditToApply = Math.min(availableCredit, invoiceAmount);
              const netAmount = invoiceAmount - creditToApply;
              
              console.log("[STRIPE-WEBHOOK] Credit calculation:", {
                invoiceAmount, availableCredit, creditToApply, netAmount
              });
              
              if (creditToApply >= invoiceAmount) {
                // FULLY COVERED BY CREDIT — void the Stripe invoice, handle internally
                console.log("[STRIPE-WEBHOOK] Fully covered by credit — voiding draft invoice");
                
                // Record credit consumption
                await supabaseAdmin
                  .from('transactions')
                  .insert({
                    lead_id: leadId,
                    item: `Credit Applied: ${membershipName || 'Subscription'}`,
                    credit: 0,
                    debit: creditToApply,
                    notes: `Account credit fully covered subscription invoice ${invoice.id}. Amount: $${invoiceAmount}`,
                    transaction_date: new Date().toISOString(),
                    is_recurring: false,
                    status: 'completed',
                    invoice_status: 'paid',
                    stripe_invoice_id: invoice.id,
                  });
                
                // Record billing cycle debit as paid
                await supabaseAdmin
                  .from('transactions')
                  .insert({
                    lead_id: leadId,
                    item: membershipName || 'Subscription Renewal',
                    credit: 0,
                    debit: invoiceAmount,
                    notes: `Subscription billing cycle — paid via account credit. Stripe Subscription: ${subscriptionId}`,
                    transaction_date: new Date().toISOString(),
                    is_recurring: false,
                    status: 'completed',
                    invoice_status: 'paid',
                    stripe_invoice_id: invoice.id,
                  });
                
                // Void the draft invoice on Stripe (delete draft)
                try {
                  await stripe.invoices.del(invoice.id);
                  console.log("[STRIPE-WEBHOOK] Deleted draft invoice (credit covered)");
                } catch (delErr: any) {
                  // If delete fails, try voiding after finalize
                  console.log("[STRIPE-WEBHOOK] Could not delete draft, trying void:", delErr.message);
                  try {
                    await stripe.invoices.finalizeInvoice(invoice.id);
                    await stripe.invoices.voidInvoice(invoice.id);
                    console.log("[STRIPE-WEBHOOK] Voided invoice instead");
                  } catch (voidErr: any) {
                    console.error("[STRIPE-WEBHOOK] Could not void invoice:", voidErr.message);
                  }
                }
                
              } else if (creditToApply > 0) {
                // PARTIAL CREDIT — add negative line item for credit portion
                const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer!.id;
                
                await stripe.invoiceItems.create({
                  customer: customerId,
                  invoice: invoice.id,
                  amount: -Math.round(creditToApply * 100),
                  currency: invoice.currency || 'aud',
                  description: 'Account credit applied',
                  metadata: { type: 'account_credit', lead_id: leadId },
                });
                console.log("[STRIPE-WEBHOOK] Applied partial credit as negative line item:", creditToApply);
                
                await stripe.invoices.update(invoice.id, {
                  metadata: {
                    ...invoice.metadata,
                    lead_id: leadId,
                    membership_name: membershipName || '',
                    credit_applied: creditToApply.toString(),
                    invoice_subtotal: invoiceAmount.toString(),
                    invoice_net_total: netAmount.toString(),
                  },
                });
                
                // Record credit consumption
                await supabaseAdmin
                  .from('transactions')
                  .insert({
                    lead_id: leadId,
                    item: `Credit Applied: ${membershipName || 'Subscription'}`,
                    credit: 0,
                    debit: creditToApply,
                    notes: `Account credit applied to subscription invoice ${invoice.id}. Original: $${invoiceAmount}, Credit: $${creditToApply}, Net: $${netAmount}`,
                    transaction_date: new Date().toISOString(),
                    is_recurring: false,
                    status: 'completed',
                    invoice_status: 'paid',
                    stripe_invoice_id: invoice.id,
                  });
                
                // Record billing cycle debit
                await supabaseAdmin
                  .from('transactions')
                  .insert({
                    lead_id: leadId,
                    item: membershipName || 'Subscription Renewal',
                    credit: 0,
                    debit: invoiceAmount,
                    notes: `Subscription billing cycle ($${creditToApply.toFixed(2)} credit applied, $${netAmount.toFixed(2)} to charge). Stripe Subscription: ${subscriptionId}`,
                    transaction_date: new Date().toISOString(),
                    is_recurring: false,
                    status: 'completed',
                    invoice_status: 'processing',
                    stripe_invoice_id: invoice.id,
                  });
                
              } else {
                // NO CREDIT — just track metadata and create debit
                await stripe.invoices.update(invoice.id, {
                  metadata: {
                    ...invoice.metadata,
                    lead_id: leadId,
                    membership_name: membershipName || '',
                    credit_applied: '0',
                    invoice_subtotal: invoiceAmount.toString(),
                    invoice_net_total: invoiceAmount.toString(),
                  },
                });
                
                await supabaseAdmin
                  .from('transactions')
                  .insert({
                    lead_id: leadId,
                    item: membershipName || 'Subscription Renewal',
                    credit: 0,
                    debit: invoiceAmount,
                    notes: `Subscription billing cycle. Stripe Subscription: ${subscriptionId}`,
                    transaction_date: new Date().toISOString(),
                    is_recurring: false,
                    status: 'completed',
                    invoice_status: 'processing',
                    stripe_invoice_id: invoice.id,
                  });
              }
            }
          } catch (subError: any) {
            console.error("[STRIPE-WEBHOOK] Error handling subscription invoice:", subError.message);
          }
        }
        break;
      }

      case "invoice.finalized": {
        // Log when invoice is finalized (after credit was applied in draft stage)
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[STRIPE-WEBHOOK] Invoice finalized:", invoice.id, "Amount due:", invoice.amount_due, "Credit applied:", invoice.metadata?.credit_applied);
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
          // Mark recurring transactions as ended and no longer recurring
          await supabaseAdmin
            .from('transactions')
            .update({ 
              is_recurring: false,
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
