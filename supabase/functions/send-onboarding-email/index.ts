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

const SITE_URL = "https://sited.lovable.app";
const LOGO_URL = "https://storage.googleapis.com/gpt-engineer-file-uploads/bK3lO63gVKgONGtqyEYfuGBiGzy1/uploads/1769959095793-S.png";

function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}

function generateDefaultOnboardingHtml(variables: Record<string, string>): string {
  const name = variables.name || 'there';
  const tierLabel = variables.tier_label || 'your';
  const bookingUrl = `${SITE_URL}/contact?booking=discovery`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f5;">
  <div style="background: #09090b; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <img src="${LOGO_URL}" alt="Sited" width="48" height="48" style="margin-bottom: 16px;" />
    <h1 style="margin: 0; font-size: 24px; color: #fff; font-weight: 900;">Welcome to Sited!</h1>
    <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px;">Your ${tierLabel} website project has officially started.</p>
  </div>

  <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; color: #09090b;">Hey ${name},</p>
    <p style="color: #52525b;">Thank you for your deposit — we're excited to build something amazing for your business. Here's what happens next:</p>

    <div style="margin: 24px 0;">
      <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
        <div style="min-width: 32px; height: 32px; border-radius: 50%; background: #2563eb; color: #fff; font-weight: 900; font-size: 14px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">1</div>
        <div>
          <p style="font-weight: 700; color: #09090b; margin: 0 0 4px;">Book Your Discovery Call</p>
          <p style="color: #71717a; margin: 0; font-size: 14px;">Jump on a 45-minute call where we dive deep into your project — your goals, your brand, your vision. This is where the magic starts.</p>
        </div>
      </div>
      <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
        <div style="min-width: 32px; height: 32px; border-radius: 50%; background: #2563eb; color: #fff; font-weight: 900; font-size: 14px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">2</div>
        <div>
          <p style="font-weight: 700; color: #09090b; margin: 0 0 4px;">We Design & Build</p>
          <p style="color: #71717a; margin: 0; font-size: 14px;">Our team gets to work crafting your website. You'll receive updates and previews throughout the process.</p>
        </div>
      </div>
      <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
        <div style="min-width: 32px; height: 32px; border-radius: 50%; background: #2563eb; color: #fff; font-weight: 900; font-size: 14px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">3</div>
        <div>
          <p style="font-weight: 700; color: #09090b; margin: 0 0 4px;">Review & Launch</p>
          <p style="color: #71717a; margin: 0; font-size: 14px;">Once you love it, we go live. Don't love it? Your deposit is fully refunded — no questions asked.</p>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${bookingUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Book Your Discovery Call →</a>
      <p style="color: #a1a1aa; font-size: 12px; margin-top: 12px;">Please book within 24 hours to keep your project on track.</p>
    </div>

    <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 20px;">
      <p style="color: #71717a; font-size: 13px; margin: 0;">Can't make a call? No worries — you can also fill out the <a href="${bookingUrl}" style="color: #2563eb; text-decoration: none; font-weight: 600;">discovery form</a> directly and we'll review it within 24 hours.</p>
    </div>

    <p style="color: #52525b; margin-top: 24px;">Looking forward to building with you,</p>
    <p style="color: #09090b; font-weight: 700; margin: 4px 0 0;">The Sited Team</p>
  </div>

  <p style="text-align: center; color: #a1a1aa; font-size: 11px; margin-top: 20px;">
    © ${new Date().getFullYear()} Sited · <a href="https://sited.co" style="color: #a1a1aa;">sited.co</a>
  </p>
</body>
</html>`;
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

    if (automation && !automation.is_enabled) {
      console.log("Onboarding automation is disabled");
      return new Response(JSON.stringify({ message: "Automation disabled" }), {
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
    const variables: Record<string, string> = {
      name: lead.name || 'there',
      email: lead.email,
      business_name: lead.business_name || 'your business',
      project_type: lead.project_type,
      phone: lead.phone || '',
      tier_label: lead.membership_tier || '',
      booking_url: `${SITE_URL}/contact?booking=discovery`,
    };

    // Try to get the template
    const { data: template } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('template_type', 'onboarding')
      .single();

    let subject: string;
    let bodyHtml: string;

    if (template?.is_enabled) {
      subject = replaceTemplateVariables(template.subject, variables);
      bodyHtml = replaceTemplateVariables(template.body_html, variables);
    } else {
      // Use branded default
      subject = `Welcome to Sited, ${variables.name}! Here's what's next 🚀`;
      bodyHtml = generateDefaultOnboardingHtml(variables);
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Sited <hello@sited.co>",
      to: [lead.email],
      subject,
      html: bodyHtml,
    });

    console.log("Onboarding email sent successfully:", emailResponse);

    // Log the email
    await supabaseClient.from('email_logs').insert({
      template_type: 'onboarding',
      recipient_email: lead.email,
      recipient_name: lead.name,
      lead_id: leadId,
      subject,
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
