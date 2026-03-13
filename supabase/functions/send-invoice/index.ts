import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InvoiceItem {
  id: string;
  item: string;
  amount: number;
  date: string;
  notes?: string;
}

interface SendInvoiceRequest {
  leadId: string;
  // clientEmail, clientName, businessName are IGNORED if provided — always sourced from DB
  clientEmail?: string;
  clientName?: string;
  businessName?: string;
  items: InvoiceItem[];
  totalAmount: number;
  dueDate?: string;
  notes?: string;
  transactionIds: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[SEND-INVOICE] Function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[SEND-INVOICE] No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[SEND-INVOICE] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has permission to send invoices (requires can_charge_cards)
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('can_charge_cards')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole?.can_charge_cards) {
      console.log("[SEND-INVOICE] Permission denied", { userId: user.id, requiredPermission: 'can_charge_cards' });
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions: cannot send invoices' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    console.log("[SEND-INVOICE] Permission validated", { permission: 'can_charge_cards' });

    const body: SendInvoiceRequest = await req.json();
    const { leadId, items, totalAmount, dueDate, notes, transactionIds } = body;

    // ALWAYS source client details from the database — never trust frontend-provided values
    const { data: leadRecord, error: leadFetchError } = await supabaseAdmin
      .from('leads')
      .select('name, email, business_name, stripe_customer_id')
      .eq('id', leadId)
      .single();

    if (leadFetchError || !leadRecord) {
      console.error("[SEND-INVOICE] Failed to fetch lead from DB:", leadFetchError?.message);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const clientEmail = leadRecord.email;
    const clientName = leadRecord.name || 'Valued Client';
    const businessName = leadRecord.business_name || undefined;

    console.log("[SEND-INVOICE] Client details sourced from DB:", { clientEmail, clientName, businessName });
    console.log("[SEND-INVOICE] Items:", items.length);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get or create Stripe customer - ALWAYS use AUD currency
    let customerId: string;
    const customerCurrency: string = 'aud'; // ALWAYS AUD
    
    if (leadRecord.stripe_customer_id) {
      customerId = leadRecord.stripe_customer_id;
      console.log("[SEND-INVOICE] Using existing customer:", customerId);
      
      // Update existing customer's name to business name (if provided) to ensure invoices show correct name
      if (businessName) {
        await stripe.customers.update(customerId, {
          name: businessName,
        });
        console.log("[SEND-INVOICE] Updated existing customer name to business name:", businessName);
      }
    } else {
      // Check if customer exists by email
      const customers = await stripe.customers.list({ email: clientEmail, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log("[SEND-INVOICE] Found customer by email:", customerId, "currency:", customerCurrency);
        
        // Update found customer's name to business name (if provided)
        if (businessName) {
          await stripe.customers.update(customerId, {
            name: businessName,
          });
          console.log("[SEND-INVOICE] Updated found customer name to business name:", businessName);
        }
      } else {
        // Create new customer - use ONLY business name for invoicing (no fallback to personal name)
        const customer = await stripe.customers.create({
          email: clientEmail,
          name: businessName || undefined, // Only use business name - never personal name on invoices
          metadata: {
            lead_id: leadId,
          },
        });
        customerId = customer.id;
        console.log("[SEND-INVOICE] Created new customer:", customerId);
      }

      // Update lead with Stripe customer ID
      await supabaseAdmin
        .from('leads')
        .update({ stripe_customer_id: customerId })
        .eq('id', leadId);
    }

    // Calculate available account credit for this lead (credit pool minus already-paid debits)
    const today = new Date().toISOString().split('T')[0];
    const { data: ledgerTxs, error: ledgerError } = await supabaseAdmin
      .from('transactions')
      .select('credit, debit, transaction_date, item, notes, invoice_status')
      .eq('lead_id', leadId);

    if (ledgerError) {
      console.warn('[SEND-INVOICE] Failed to query transactions for credit calculation:', ledgerError.message);
    }

    let availableCredit = 0;
    if (ledgerTxs?.length) {
      const dueTxs = ledgerTxs.filter(t =>
        t.transaction_date <= today + 'T23:59:59.999Z' &&
        !t.item?.startsWith('VOID:') &&
        !t.notes?.includes('[VOIDED:')
      );

      const creditPool = dueTxs.reduce((sum, t) => sum + Number(t.credit || 0), 0);
      const paidDebits = dueTxs
        .filter(t => t.invoice_status === 'paid')
        .reduce((sum, t) => sum + Number(t.debit || 0), 0);

      availableCredit = Math.max(0, creditPool - paidDebits);
    }

    const invoiceSubtotal = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const creditToApply = Math.min(availableCredit, invoiceSubtotal);
    const netInvoiceTotal = invoiceSubtotal - creditToApply;

    console.log('[SEND-INVOICE] Credit computed', { availableCredit, invoiceSubtotal, creditToApply, netInvoiceTotal });

    // Create Stripe invoice with explicit currency
    const invoiceParams: Stripe.InvoiceCreateParams = {
      customer: customerId,
      currency: customerCurrency,
      collection_method: 'send_invoice',
      days_until_due: dueDate ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 30,
      metadata: {
        lead_id: leadId,
        transaction_ids: transactionIds.join(','),
        credit_applied: creditToApply.toString(),
        invoice_subtotal: invoiceSubtotal.toString(),
        invoice_net_total: netInvoiceTotal.toString(),
      },
    };

    if (notes) {
      invoiceParams.description = notes;
    }

    const invoice = await stripe.invoices.create(invoiceParams);
    console.log('[SEND-INVOICE] Created invoice:', invoice.id, 'currency:', customerCurrency);

    // Add invoice items with matching currency (full itemisation)
    for (const item of items) {
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: Math.round(item.amount * 100), // Convert to cents
        currency: customerCurrency,
        description: `${item.item}${item.notes ? ` - ${item.notes}` : ''}`,
        metadata: {
          transaction_id: item.id,
          date: item.date,
        },
      });
    }

    // Apply account credit as a negative line item so the invoice total equals the amount actually owing
    if (creditToApply > 0) {
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: -Math.round(creditToApply * 100),
        currency: customerCurrency,
        description: 'Account credit applied',
        metadata: {
          type: 'account_credit',
        },
      });

      // Record the credit consumption in the ledger for audit trail + accurate future credit availability
      const itemsSummary = items.map(i => i.item).join(', ');
      await supabaseAdmin
        .from('transactions')
        .insert({
          lead_id: leadId,
          item: `Credit Applied (Invoice): ${itemsSummary}`,
          credit: 0,
          debit: creditToApply,
          status: 'completed',
          transaction_date: new Date().toISOString(),
          notes: `Applied $${creditToApply} account credit to invoice ${invoice.id}. Subtotal: $${invoiceSubtotal}. Net due: $${netInvoiceTotal}.`,
          created_by: user.id,
          invoice_status: 'paid',
          stripe_invoice_id: invoice.id,
        });
    }

    console.log('[SEND-INVOICE] Added', items.length, 'line items', creditToApply > 0 ? 'plus credit line item' : '');

    // Finalize and send the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    console.log("[SEND-INVOICE] Finalized invoice:", finalizedInvoice.id);

    await stripe.invoices.sendInvoice(invoice.id);
    console.log("[SEND-INVOICE] Sent invoice to:", clientEmail);

    // Update transaction statuses to 'sent' and store stripe_invoice_id
    await supabaseAdmin
      .from('transactions')
      .update({ 
        invoice_status: 'sent',
        stripe_invoice_id: invoice.id,
      })
      .in('id', transactionIds);

    console.log("[SEND-INVOICE] Updated transaction statuses");

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoiceId: invoice.id,
        invoiceUrl: finalizedInvoice.hosted_invoice_url,
        invoiceNumber: finalizedInvoice.number,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[SEND-INVOICE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
