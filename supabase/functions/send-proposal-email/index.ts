import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOGO_URL = "https://storage.googleapis.com/gpt-engineer-file-uploads/bK3lO63gVKgONGtqyEYfuGBiGzy1/uploads/1769959095793-S.png";

function generateEmailHtml(businessName: string, clientName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f5;">
  <div style="background: #09090b; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <img src="${LOGO_URL}" alt="Sited" width="48" height="48" style="margin-bottom: 16px;" />
    <h1 style="margin: 0; font-size: 22px; color: #fff; font-weight: 900;">Your Scope of Work</h1>
    <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px;">with Sited.co</p>
  </div>

  <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; color: #09090b;">Hey ${clientName},</p>
    <p style="color: #52525b;">Please find your personalised <strong>Statement of Work</strong> for <strong>${businessName}</strong> attached to this email as a PDF.</p>
    
    <p style="color: #52525b;">This document outlines the full scope of your project — including every page, feature, and integration we'll build for you.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="font-size: 14px; color: #09090b; font-weight: 700; margin: 0 0 4px;">📎 Attachment</p>
      <p style="font-size: 13px; color: #64748b; margin: 0;">Statement of Work — ${businessName}.pdf</p>
    </div>

    <p style="color: #52525b;">If you have any questions or adjustments, simply reply to this email or reach out to your project manager.</p>

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

    const { leadId, pdfBase64, fileName, buildFlowId } = await req.json();

    if (!leadId || !pdfBase64 || !fileName) {
      throw new Error("Missing required fields: leadId, pdfBase64, fileName");
    }

    // Get lead details
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('name, email, business_name')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const clientName = lead.name || 'there';
    const businessName = lead.business_name || 'your business';

    // Decode base64 to Uint8Array for attachment
    const binaryString = atob(pdfBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Sited <hello@sited.co>",
      to: [lead.email],
      subject: `Your Scope of Work with Sited.co — ${businessName}`,
      html: generateEmailHtml(businessName, clientName),
      attachments: [
        {
          filename: fileName,
          content: Array.from(bytes),
        },
      ],
    });

    console.log("Proposal email sent:", emailResponse);

    // Log the email
    await supabaseClient.from('email_logs').insert({
      template_type: 'proposal',
      recipient_email: lead.email,
      recipient_name: lead.name,
      lead_id: leadId,
      subject: `Your Scope of Work with Sited.co — ${businessName}`,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    // Mark the proposal_sent step as complete if buildFlowId provided
    if (buildFlowId) {
      // Find the proposal step
      const { data: steps } = await supabaseClient
        .from('build_steps')
        .select('id, phase_id')
        .eq('step_key', 'proposal_sent')
        .in('phase_id', 
          (await supabaseClient
            .from('build_phases')
            .select('id')
            .eq('build_flow_id', buildFlowId)
          ).data?.map((p: any) => p.id) || []
        )
        .limit(1);

      if (steps && steps.length > 0) {
        const step = steps[0];

        // Get auth user from request
        const authHeader = req.headers.get('Authorization');
        let userId = 'system';
        if (authHeader) {
          const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
          if (user) userId = user.id;
        }

        // Insert step completion
        await supabaseClient.from('step_completions').insert({
          step_id: step.id,
          build_flow_id: buildFlowId,
          completed_by: userId,
          description: `Proposal sent to ${lead.email}`,
        });

        // Update step
        await supabaseClient.from('build_steps').update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          completed_by: userId,
        }).eq('id', step.id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending proposal email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
