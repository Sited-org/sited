import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { stripe_invoice_id } = await req.json();

    if (!stripe_invoice_id) {
      return new Response(
        JSON.stringify({ success: true, message: "No Stripe invoice to void" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Retrieve the invoice to check its status
    const invoice = await stripe.invoices.retrieve(stripe_invoice_id);

    if (invoice.status === "void") {
      return new Response(
        JSON.stringify({ success: true, message: "Invoice already voided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only open/uncollectible invoices can be voided
    if (invoice.status === "open" || invoice.status === "uncollectible") {
      await stripe.invoices.voidInvoice(stripe_invoice_id);
      return new Response(
        JSON.stringify({ success: true, message: "Stripe invoice voided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For draft invoices, just finalize and void
    if (invoice.status === "draft") {
      const finalized = await stripe.invoices.finalizeInvoice(stripe_invoice_id);
      if (finalized.status === "open") {
        await stripe.invoices.voidInvoice(stripe_invoice_id);
      }
      return new Response(
        JSON.stringify({ success: true, message: "Draft invoice finalized and voided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For paid invoices, we can't void but we note it
    return new Response(
      JSON.stringify({
        success: true,
        message: `Invoice status is '${invoice.status}' — cannot void in Stripe (already ${invoice.status})`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error voiding Stripe invoice:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
