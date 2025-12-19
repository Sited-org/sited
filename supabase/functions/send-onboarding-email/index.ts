import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OnboardingEmailRequest {
  leadId: string;
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

    const { leadId }: OnboardingEmailRequest = await req.json();
    console.log("Sending onboarding email for lead:", leadId);

    // Check if automation is enabled
    const { data: automation } = await supabaseClient
      .from('email_automations')
      .select('*')
      .eq('automation_type', 'onboarding')
      .single();

    if (!automation?.is_enabled) {
      console.log("Onboarding automation is disabled");
      return new Response(JSON.stringify({ message: "Automation disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the template
    const { data: template } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('template_type', 'onboarding')
      .single();

    if (!template?.is_enabled) {
      console.log("Onboarding template is disabled");
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

    // Prepare template variables
    const variables = {
      name: lead.name || 'there',
      email: lead.email,
      business_name: lead.business_name || 'your business',
      project_type: lead.project_type,
      phone: lead.phone || '',
    };

    // Replace template variables
    const subject = replaceTemplateVariables(template.subject, variables);
    const bodyHtml = replaceTemplateVariables(template.body_html, variables);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Team <onboarding@resend.dev>",
      to: [lead.email],
      subject: subject,
      html: bodyHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email
    await supabaseClient.from('email_logs').insert({
      template_type: 'onboarding',
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
    console.error("Error sending onboarding email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
