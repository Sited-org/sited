import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PaymentEmailRequest {
  leadId: string;
  amount: number;
  description?: string;
  invoiceId?: string;
  stripePaymentIntentId?: string;
}

function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { leadId, amount, description, invoiceId, stripePaymentIntentId }: PaymentEmailRequest = await req.json();
    console.log("Sending payment email for lead:", leadId, "amount:", amount);

    // Check if automation is enabled
    const { data: automation } = await supabaseClient
      .from('email_automations')
      .select('*')
      .eq('automation_type', 'payment_receipt')
      .single();

    if (!automation?.is_enabled) {
      console.log("Payment receipt automation is disabled");
      return new Response(JSON.stringify({ message: "Automation disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the template
    const { data: template } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('template_type', 'payment_receipt')
      .single();

    if (!template?.is_enabled) {
      console.log("Payment receipt template is disabled");
      return new Response(JSON.stringify({ message: "Template disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get lead details
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    // Try to get invoice details from Stripe if available
    let stripeInvoiceUrl = '';
    if (stripePaymentIntentId) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });
        
        const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
        if (paymentIntent.invoice) {
          const invoice = await stripe.invoices.retrieve(paymentIntent.invoice as string);
          stripeInvoiceUrl = invoice.hosted_invoice_url || '';
        }
      } catch (stripeError) {
        console.log("Could not retrieve Stripe invoice:", stripeError);
      }
    }

    // Prepare template variables
    const variables = {
      name: lead.name || 'there',
      email: lead.email,
      business_name: lead.business_name || 'your business',
      amount: `$${(amount / 100).toFixed(2)}`,
      invoice_id: invoiceId || 'N/A',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      description: description || 'Payment received',
      invoice_url: stripeInvoiceUrl,
    };

    // Replace template variables
    const subject = replaceTemplateVariables(template.subject, variables);
    let bodyHtml = replaceTemplateVariables(template.body_html, variables);
    
    // Add invoice link if available
    if (stripeInvoiceUrl) {
      bodyHtml += `<p><a href="${stripeInvoiceUrl}" style="color: #2563eb;">View Invoice</a></p>`;
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Sited <hello@sited.co>",
      to: [lead.email],
      subject: subject,
      html: bodyHtml,
    });

    console.log("Payment email sent successfully:", emailResponse);

    // Log the email
    await supabaseClient.from('email_logs').insert({
      template_type: 'payment_receipt',
      recipient_email: lead.email,
      recipient_name: lead.name,
      lead_id: leadId,
      subject: subject,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending payment email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
