import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-RECURRING-INVOICES] ${step}${detailsStr}`);
};

// Helper function to calculate available credit for a lead
async function getAvailableCredit(supabaseAdmin: any, leadId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: transactions, error } = await supabaseAdmin
    .from("transactions")
    .select("credit, debit, transaction_date, invoice_status, item, notes")
    .eq("lead_id", leadId);

  if (error || !transactions || transactions.length === 0) {
    return 0;
  }

  const dueTxs = transactions.filter((t: any) =>
    t.transaction_date <= today + 'T23:59:59.999Z' &&
    !t.item?.startsWith('VOID:') &&
    !t.notes?.includes('[VOIDED:')
  );

  const creditPool = dueTxs.reduce((sum: number, t: any) => sum + Number(t.credit || 0), 0);
  const paidDebits = dueTxs
    .filter((t: any) => t.invoice_status === 'paid')
    .reduce((sum: number, t: any) => sum + Number(t.debit || 0), 0);

  return Math.max(0, creditPool - paidDebits);
}

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

    // Optional: Authenticate admin user if called from UI
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError || !userData.user) {
        logStep("Authentication failed", { error: userError?.message });
      } else {
        logStep("Authenticated user", { userId: userData.user.id });
      }
    }

    // Parse request body for optional parameters
    let specificLeadId: string | null = null;
    try {
      const body = await req.json();
      specificLeadId = body?.lead_id || null;
    } catch {
      // No body provided, process all
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Find all active recurring transactions that are due for billing
    // A membership is due if:
    // 1. is_recurring = true
    // 2. recurring_end_date is null (not cancelled)
    // 3. The last billing cycle has completed (need to check if we need to bill this month)
    
    let query = supabaseAdmin
      .from('transactions')
      .select(`
        id,
        lead_id,
        item,
        debit,
        recurring_interval,
        transaction_date,
        notes,
        stripe_invoice_id,
        leads!inner (
          id,
          name,
          email,
          business_name,
          stripe_customer_id,
          stripe_payment_method_id
        )
      `)
      .eq('is_recurring', true)
      .is('recurring_end_date', null)
      .not('item', 'like', 'VOID:%');

    if (specificLeadId) {
      query = query.eq('lead_id', specificLeadId);
    }

    const { data: recurringTransactions, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch recurring transactions: ${fetchError.message}`);
    }

    logStep("Found recurring transactions", { count: recurringTransactions?.length || 0 });

    if (!recurringTransactions || recurringTransactions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No recurring memberships found", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Group transactions by lead to avoid sending multiple invoices
    const leadMemberships = new Map<string, { lead: any; memberships: any[] }>();
    
    for (const tx of recurringTransactions) {
      const lead = tx.leads as any;
      if (!leadMemberships.has(lead.id)) {
        leadMemberships.set(lead.id, { lead, memberships: [] });
      }
      
      // Check if this membership needs billing this month
      // We check if there's already an invoice for this month for this membership
      const txDate = new Date(tx.transaction_date);
      const monthsElapsed = (today.getFullYear() - txDate.getFullYear()) * 12 + (today.getMonth() - txDate.getMonth());
      
      // Only include if we're in a new billing period and haven't invoiced yet
      // Check if there's already a transaction this month for this recurring item
      const { data: existingBilling } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .eq('lead_id', lead.id)
        .ilike('item', `%${tx.item}%`)
        .gte('transaction_date', `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`)
        .lte('transaction_date', `${todayStr}T23:59:59.999Z`)
        .neq('id', tx.id)
        .limit(1);

      if (!existingBilling || existingBilling.length === 0) {
        // Need to check if it's time to bill based on interval
        let shouldBill = false;
        
        switch (tx.recurring_interval?.toLowerCase()) {
          case 'daily':
            shouldBill = true;
            break;
          case 'weekly':
            const daysDiff = Math.floor((today.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
            shouldBill = daysDiff >= 7 && daysDiff % 7 === 0;
            break;
          case 'monthly':
            // Bill on the same day of each month, or on the first of each subsequent month
            const sameDay = txDate.getDate();
            shouldBill = today.getDate() === sameDay || 
                        (today.getDate() === 1 && monthsElapsed >= 1);
            break;
          case 'yearly':
            const sameMonth = txDate.getMonth();
            const sameDate = txDate.getDate();
            shouldBill = today.getMonth() === sameMonth && today.getDate() === sameDate;
            break;
          default:
            // Default to monthly
            shouldBill = today.getDate() === txDate.getDate() || 
                        (today.getDate() === 1 && monthsElapsed >= 1);
        }
        
        if (shouldBill) {
          leadMemberships.get(lead.id)!.memberships.push(tx);
        }
      }
    }

    logStep("Leads with due memberships", { count: leadMemberships.size });

    const results: any[] = [];

    // Process each lead
    for (const [leadId, { lead, memberships }] of leadMemberships) {
      if (memberships.length === 0) continue;

      try {
        logStep("Processing lead", { leadId, email: lead.email, membershipCount: memberships.length });

        // Get or create Stripe customer
        let customerId = lead.stripe_customer_id;
        
        if (!customerId) {
          // Check if customer exists by email
          const customers = await stripe.customers.list({ email: lead.email, limit: 1 });
          
          if (customers.data.length > 0) {
            customerId = customers.data[0].id;
          } else {
            // Create new customer with business name only
            const customer = await stripe.customers.create({
              email: lead.email,
              name: lead.business_name || undefined,
              metadata: { lead_id: lead.id },
            });
            customerId = customer.id;
          }
          
          // Save customer ID to lead
          await supabaseAdmin
            .from('leads')
            .update({ stripe_customer_id: customerId })
            .eq('id', lead.id);
          
          logStep("Created/found Stripe customer", { customerId });
        }

        // Calculate total amount and available credit
        const totalAmount = memberships.reduce((sum, m) => sum + Number(m.debit || 0), 0);
        const availableCredit = await getAvailableCredit(supabaseAdmin, leadId);
        const creditToApply = Math.min(availableCredit, totalAmount);
        const netAmount = totalAmount - creditToApply;

        logStep("Invoice calculation", { totalAmount, availableCredit, creditToApply, netAmount });

        // Create Stripe invoice
        const invoice = await stripe.invoices.create({
          customer: customerId,
          currency: 'aud',
          collection_method: 'send_invoice',
          days_until_due: 7,
          metadata: {
            lead_id: leadId,
            membership_items: memberships.map(m => m.item).join(', '),
            credit_applied: creditToApply.toString(),
            invoice_subtotal: totalAmount.toString(),
            invoice_net_total: netAmount.toString(),
          },
        });

        logStep("Created invoice", { invoiceId: invoice.id });

        // Add invoice items for each membership
        const transactionIds: string[] = [];
        for (const membership of memberships) {
          await stripe.invoiceItems.create({
            customer: customerId,
            invoice: invoice.id,
            amount: Math.round(Number(membership.debit) * 100),
            currency: 'aud',
            description: membership.item,
            metadata: {
              original_transaction_id: membership.id,
              lead_id: leadId,
            },
          });

          // Create debit transaction for this billing cycle
          const { data: newTx, error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
              lead_id: leadId,
              item: membership.item,
              credit: 0,
              debit: membership.debit,
              notes: `Recurring billing - Invoice ${invoice.id}`,
              transaction_date: new Date().toISOString(),
              is_recurring: false, // This is the actual charge, not the recurring definition
              status: 'completed',
              invoice_status: 'processing',
              stripe_invoice_id: invoice.id,
            })
            .select()
            .single();

          if (newTx) {
            transactionIds.push(newTx.id);
          }
        }

        // Apply credit as negative line item if available
        if (creditToApply > 0) {
          await stripe.invoiceItems.create({
            customer: customerId,
            invoice: invoice.id,
            amount: -Math.round(creditToApply * 100),
            currency: 'aud',
            description: 'Account credit applied',
            metadata: { type: 'account_credit', lead_id: leadId },
          });

          // Record credit consumption
          await supabaseAdmin
            .from('transactions')
            .insert({
              lead_id: leadId,
              item: `Credit Applied: ${memberships.map(m => m.item).join(', ')}`,
              credit: 0,
              debit: creditToApply,
              notes: `Account credit applied to invoice ${invoice.id}. Original: $${totalAmount}, Credit: $${creditToApply}, Net: $${netAmount}`,
              transaction_date: new Date().toISOString(),
              is_recurring: false,
              status: 'completed',
              invoice_status: 'paid',
              stripe_invoice_id: invoice.id,
            });

          logStep("Applied credit to invoice", { creditToApply });
        }

        // Update invoice metadata with transaction IDs
        await stripe.invoices.update(invoice.id, {
          metadata: {
            ...invoice.metadata,
            transaction_ids: transactionIds.join(','),
          },
        });

        // Finalize and send the invoice
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
        await stripe.invoices.sendInvoice(invoice.id);

        logStep("Sent invoice", { invoiceId: invoice.id, invoiceNumber: finalizedInvoice.number });

        // Update transaction statuses to 'sent'
        if (transactionIds.length > 0) {
          await supabaseAdmin
            .from('transactions')
            .update({ invoice_status: 'sent' })
            .in('id', transactionIds);
        }

        results.push({
          leadId,
          email: lead.email,
          business: lead.business_name,
          invoiceId: invoice.id,
          invoiceNumber: finalizedInvoice.number,
          totalAmount,
          creditApplied: creditToApply,
          netAmount,
          success: true,
        });

      } catch (leadError: any) {
        logStep("Error processing lead", { leadId, error: leadError.message });
        results.push({
          leadId,
          email: lead.email,
          business: lead.business_name,
          error: leadError.message,
          success: false,
        });
      }
    }

    logStep("Processing complete", { 
      total: results.length, 
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
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
