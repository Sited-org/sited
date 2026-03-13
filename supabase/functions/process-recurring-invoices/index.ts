import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

// Ensure a Stripe customer exists for the lead, return customer ID
async function ensureStripeCustomer(
  stripe: Stripe, 
  supabaseAdmin: any, 
  lead: any
): Promise<string> {
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
    
    await supabaseAdmin
      .from('leads')
      .update({ stripe_customer_id: customerId })
      .eq('id', lead.id);
    
    logStep("Created/found Stripe customer", { customerId });
  }
  
  return customerId;
}

// Handle fully credit-covered billing (no Stripe invoice needed)
async function handleCreditOnlyBilling(
  supabaseAdmin: any,
  leadId: string,
  memberships: any[],
  totalAmount: number
): Promise<any> {
  logStep("Fully covered by credit — skipping Stripe", { leadId, totalAmount });

  const transactionIds: string[] = [];

  // Create debit transactions for each membership
  for (const membership of memberships) {
    const { data: newTx } = await supabaseAdmin
      .from('transactions')
      .insert({
        lead_id: leadId,
        item: membership.item,
        credit: 0,
        debit: membership.debit,
        notes: `Recurring billing — paid via account credit`,
        transaction_date: new Date().toISOString(),
        is_recurring: false,
        status: 'completed',
        invoice_status: 'paid',
      })
      .select()
      .single();

    if (newTx) transactionIds.push(newTx.id);
  }

  // Record credit consumption
  await supabaseAdmin
    .from('transactions')
    .insert({
      lead_id: leadId,
      item: `Credit Applied: ${memberships.map(m => m.item).join(', ')}`,
      credit: 0,
      debit: totalAmount,
      notes: `Account credit applied to recurring billing. Total: $${totalAmount}`,
      transaction_date: new Date().toISOString(),
      is_recurring: false,
      status: 'completed',
      invoice_status: 'paid',
    });

  return {
    method: 'credit_only',
    totalAmount,
    creditApplied: totalAmount,
    netAmount: 0,
    transactionIds,
  };
}

// Handle billing via Stripe invoice (partial credit or no credit)
async function handleStripeInvoiceBilling(
  stripe: Stripe,
  supabaseAdmin: any,
  leadId: string,
  lead: any,
  customerId: string,
  memberships: any[],
  totalAmount: number,
  creditToApply: number
): Promise<any> {
  const netAmount = totalAmount - creditToApply;
  const hasPaymentMethod = !!lead.stripe_payment_method_id;

  logStep("Creating Stripe invoice", { 
    leadId, totalAmount, creditToApply, netAmount, hasPaymentMethod,
    collectionMethod: hasPaymentMethod ? 'charge_automatically' : 'send_invoice'
  });

  // Create Stripe invoice with appropriate collection method
  const invoiceParams: any = {
    customer: customerId,
    currency: 'aud',
    metadata: {
      lead_id: leadId,
      membership_items: memberships.map(m => m.item).join(', '),
      credit_applied: creditToApply.toString(),
      invoice_subtotal: totalAmount.toString(),
      invoice_net_total: netAmount.toString(),
    },
  };

  if (hasPaymentMethod) {
    invoiceParams.collection_method = 'charge_automatically';
    invoiceParams.default_payment_method = lead.stripe_payment_method_id;
  } else {
    invoiceParams.collection_method = 'send_invoice';
    invoiceParams.days_until_due = 7;
  }

  const invoice = await stripe.invoices.create(invoiceParams);
  logStep("Created invoice", { invoiceId: invoice.id });

  // Add invoice items for each membership at NET proportional amounts
  const transactionIds: string[] = [];
  for (const membership of memberships) {
    const membershipAmount = Number(membership.debit);
    // Proportionally reduce each line item if credit is applied
    const proportion = membershipAmount / totalAmount;
    const netLineAmount = Math.round((netAmount * proportion) * 100); // in cents

    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      amount: netLineAmount,
      currency: 'aud',
      description: membership.item,
      metadata: {
        original_transaction_id: membership.id,
        lead_id: leadId,
        original_amount: membershipAmount.toString(),
      },
    });

    // Create debit transaction for this billing cycle
    const { data: newTx } = await supabaseAdmin
      .from('transactions')
      .insert({
        lead_id: leadId,
        item: membership.item,
        credit: 0,
        debit: membership.debit,
        notes: `Recurring billing — Invoice ${invoice.id}${creditToApply > 0 ? ` (credit $${creditToApply.toFixed(2)} applied, net $${netAmount.toFixed(2)})` : ''}`,
        transaction_date: new Date().toISOString(),
        is_recurring: false,
        status: 'completed',
        invoice_status: 'processing',
        stripe_invoice_id: invoice.id,
      })
      .select()
      .single();

    if (newTx) transactionIds.push(newTx.id);
  }

  // Record credit consumption if any
  if (creditToApply > 0) {
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
    logStep("Recorded credit consumption", { creditToApply });
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
  
  if (!hasPaymentMethod) {
    await stripe.invoices.sendInvoice(invoice.id);
    logStep("Sent invoice to client", { invoiceId: invoice.id });
  } else {
    logStep("Invoice will auto-charge", { invoiceId: invoice.id });
  }

  // Update transaction statuses
  if (transactionIds.length > 0) {
    await supabaseAdmin
      .from('transactions')
      .update({ invoice_status: hasPaymentMethod ? 'processing' : 'sent' })
      .in('id', transactionIds);
  }

  return {
    method: hasPaymentMethod ? 'charge_automatically' : 'send_invoice',
    invoiceId: invoice.id,
    invoiceNumber: finalizedInvoice.number,
    totalAmount,
    creditApplied: creditToApply,
    netAmount,
    transactionIds,
  };
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

    // Optional auth
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (userData?.user) {
        logStep("Authenticated user", { userId: userData.user.id });
      }
    }

    // Parse optional lead_id filter
    let specificLeadId: string | null = null;
    try {
      const body = await req.json();
      specificLeadId = body?.lead_id || null;
    } catch {
      // No body
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Find active recurring transactions (exclude Stripe-managed subscriptions)
    let query = supabaseAdmin
      .from('transactions')
      .select(`
        id, lead_id, item, debit, recurring_interval, transaction_date, notes, stripe_invoice_id,
        leads!inner ( id, name, email, business_name, stripe_customer_id, stripe_payment_method_id )
      `)
      .eq('is_recurring', true)
      .is('recurring_end_date', null)
      .not('item', 'like', 'VOID:%')
      .not('notes', 'like', '%Stripe Subscription:%');

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

    // Group transactions by lead
    const leadMemberships = new Map<string, { lead: any; memberships: any[] }>();

    for (const tx of recurringTransactions) {
      const lead = tx.leads as any;
      if (!leadMemberships.has(lead.id)) {
        leadMemberships.set(lead.id, { lead, memberships: [] });
      }

      // Check if this membership needs billing
      const txDate = new Date(tx.transaction_date);
      const monthsElapsed = (today.getFullYear() - txDate.getFullYear()) * 12 + (today.getMonth() - txDate.getMonth());

      // Check for existing billing this month
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
            const sameDay = txDate.getDate();
            shouldBill = today.getDate() === sameDay || (today.getDate() === 1 && monthsElapsed >= 1);
            break;
          case 'yearly':
            shouldBill = today.getMonth() === txDate.getMonth() && today.getDate() === txDate.getDate();
            break;
          default:
            shouldBill = today.getDate() === txDate.getDate() || (today.getDate() === 1 && monthsElapsed >= 1);
        }

        if (shouldBill) {
          leadMemberships.get(lead.id)!.memberships.push(tx);
        }
      }
    }

    logStep("Leads with due memberships", { count: leadMemberships.size });

    const results: any[] = [];

    for (const [leadId, { lead, memberships }] of leadMemberships) {
      if (memberships.length === 0) continue;

      try {
        logStep("Processing lead", { leadId, email: lead.email, membershipCount: memberships.length });

        // 1. Ensure Stripe customer exists
        const customerId = await ensureStripeCustomer(stripe, supabaseAdmin, lead);

        // 2. Calculate totals
        const totalAmount = memberships.reduce((sum: number, m: any) => sum + Number(m.debit || 0), 0);
        const availableCredit = await getAvailableCredit(supabaseAdmin, leadId);
        const creditToApply = Math.min(availableCredit, totalAmount);

        logStep("Billing calculation", { totalAmount, availableCredit, creditToApply });

        let billingResult: any;

        // 3. Credit-first decision
        if (creditToApply >= totalAmount) {
          // FULLY COVERED BY CREDIT — no Stripe invoice
          billingResult = await handleCreditOnlyBilling(supabaseAdmin, leadId, memberships, totalAmount);
        } else {
          // PARTIAL CREDIT or NO CREDIT — create Stripe invoice for net amount
          billingResult = await handleStripeInvoiceBilling(
            stripe, supabaseAdmin, leadId, lead, customerId,
            memberships, totalAmount, creditToApply
          );
        }

        results.push({
          leadId,
          email: lead.email,
          business: lead.business_name,
          success: true,
          ...billingResult,
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
      creditOnly: results.filter(r => r.method === 'credit_only').length,
      invoiced: results.filter(r => r.method === 'send_invoice').length,
      autoCharged: results.filter(r => r.method === 'charge_automatically').length,
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
