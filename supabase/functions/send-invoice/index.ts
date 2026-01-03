import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  clientEmail: string;
  clientName: string;
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

    const body: SendInvoiceRequest = await req.json();
    console.log("[SEND-INVOICE] Request for:", body.clientEmail, "Items:", body.items.length);

    const { leadId, clientEmail, clientName, businessName, items, totalAmount, dueDate, notes, transactionIds } = body;

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get or create Stripe customer
    let customerId: string;
    let customerCurrency: string = 'aud'; // Default currency - always AUD
    
    // Check if lead already has a Stripe customer ID
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('stripe_customer_id')
      .eq('id', leadId)
      .maybeSingle();

    if (lead?.stripe_customer_id) {
      customerId = lead.stripe_customer_id;
      // Fetch the customer to get their currency
      const existingCustomer = await stripe.customers.retrieve(customerId);
      if (!existingCustomer.deleted && existingCustomer.currency) {
        customerCurrency = existingCustomer.currency;
      }
      console.log("[SEND-INVOICE] Using existing customer:", customerId, "currency:", customerCurrency);
    } else {
      // Check if customer exists by email
      const customers = await stripe.customers.list({ email: clientEmail, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        if (customers.data[0].currency) {
          customerCurrency = customers.data[0].currency;
        }
        console.log("[SEND-INVOICE] Found customer by email:", customerId, "currency:", customerCurrency);
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: clientEmail,
          name: clientName,
          metadata: {
            lead_id: leadId,
            business_name: businessName || '',
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

    // Create Stripe invoice with explicit currency
    const invoiceParams: Stripe.InvoiceCreateParams = {
      customer: customerId,
      currency: customerCurrency,
      collection_method: 'send_invoice',
      days_until_due: dueDate ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 30,
      metadata: {
        lead_id: leadId,
        transaction_ids: transactionIds.join(','),
      },
    };

    if (notes) {
      invoiceParams.description = notes;
    }

    const invoice = await stripe.invoices.create(invoiceParams);
    console.log("[SEND-INVOICE] Created invoice:", invoice.id, "currency:", customerCurrency);

    // Add invoice items with matching currency
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
    console.log("[SEND-INVOICE] Added", items.length, "line items");

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
