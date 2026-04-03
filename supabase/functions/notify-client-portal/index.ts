import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFY-CLIENT-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      logStep("No RESEND_API_KEY configured, skipping email");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { request_id, lead_id, title, description, priority, client_name, client_email, action_type } = await req.json();

    if (!client_email || !title) {
      throw new Error("Client email and title are required");
    }

    logStep("Sending notification to client", { client_email, title });

    const portalUrl = "https://sited.co/client-portal";

    const priorityColors: Record<string, string> = {
      low: '#6B7280',
      normal: '#3B82F6',
      high: '#F97316',
      urgent: '#EF4444',
    };

    const actionLabel = (action_type === 'asset_upload' || action_type === 'asset_collection')
      ? 'Your team needs you to upload brand assets.' 
      : 'Your team has a new update that needs your attention.';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Action Required</h1>
          </div>
          <div style="padding: 30px;">
            <p style="margin: 0 0 20px 0; color: #64748b; font-size: 16px;">
              Hi ${client_name || 'there'},
            </p>
            <p style="margin: 0 0 20px 0; color: #64748b; font-size: 14px;">
              ${actionLabel}
            </p>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <div style="margin-bottom: 10px;">
                <span style="display: inline-block; background: ${priorityColors[priority] || priorityColors.normal}20; color: ${priorityColors[priority] || priorityColors.normal}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${priority || 'Normal'} Priority</span>
              </div>
              <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1e293b;">${title}</h2>
              ${description ? `<p style="margin: 0; color: #64748b; line-height: 1.6;">${description}</p>` : ''}
            </div>
            
            <div style="text-align: center;">
              <a href="${portalUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Open Client Portal</a>
            </div>
            
            <p style="margin: 20px 0 0 0; color: #94a3b8; font-size: 13px; text-align: center;">
              Log in to your client portal to respond.
            </p>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">Sited — Custom Websites for Australian Businesses</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Sited <hello@sited.co>",
        to: [client_email],
        subject: `Action Required: ${title}`,
        html: emailHtml,
      }),
    });

    if (res.ok) {
      logStep("Email sent successfully to client", { client_email });
    } else {
      const errorText = await res.text();
      logStep("Failed to send email", { error: errorText });
    }

    // Log the email
    if (lead_id) {
      await supabaseClient.from("email_logs").insert({
        lead_id,
        template_type: "client_portal_notification",
        recipient_email: client_email,
        recipient_name: client_name || null,
        subject: `Action Required: ${title}`,
        status: res.ok ? "sent" : "failed",
        error_message: res.ok ? null : "Email delivery failed",
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
