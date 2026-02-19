import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFY-CLIENT-REQUEST] ${step}${detailsStr}`);
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { request_id, lead_id, title, description, priority, client_name, client_email } = await req.json();
    
    if (!request_id || !lead_id) {
      throw new Error("Request ID and Lead ID are required");
    }

    logStep("Processing notification for request", { request_id, title });

    // Fetch admin users to notify
    const { data: adminProfiles, error: adminError } = await supabaseClient
      .from("admin_profiles")
      .select("email, display_name");

    if (adminError) {
      logStep("Error fetching admin profiles", { error: adminError.message });
    }

    const adminEmails = adminProfiles?.map(p => p.email) || [];
    logStep("Admin emails to notify", { count: adminEmails.length });

    // If Resend API key exists, send email notifications
    if (RESEND_API_KEY && adminEmails.length > 0) {
      const priorityColors: Record<string, string> = {
        low: '#6B7280',
        normal: '#3B82F6',
        high: '#F97316',
        urgent: '#EF4444',
      };

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
              <h1 style="color: white; margin: 0; font-size: 24px;">New Client Request</h1>
            </div>
            <div style="padding: 30px;">
              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">From</p>
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1e293b;">${client_name || 'Unknown Client'}</p>
                <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">${client_email || 'No email'}</p>
              </div>
              
              <div style="margin-bottom: 20px;">
                <span style="display: inline-block; background: ${priorityColors[priority] || priorityColors.normal}20; color: ${priorityColors[priority] || priorityColors.normal}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${priority || 'Normal'} Priority</span>
              </div>

              <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #1e293b;">${title}</h2>
              ${description ? `<p style="margin: 0; color: #64748b; line-height: 1.6;">${description}</p>` : '<p style="margin: 0; color: #94a3b8; font-style: italic;">No description provided</p>'}
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${Deno.env.get("SITE_URL") || "https://sited.co"}/admin/requests" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Request</a>
              </div>
            </div>
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">This notification was sent from your client portal</p>
            </div>
          </div>
        </body>
        </html>
      `;

      for (const email of adminEmails) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Sited <hello@sited.co>",
              to: [email],
              subject: `New Request: ${title} [${priority?.toUpperCase() || 'NORMAL'}]`,
              html: emailHtml,
            }),
          });

          if (res.ok) {
            logStep("Email sent successfully", { email });
          } else {
            const errorText = await res.text();
            logStep("Failed to send email", { email, error: errorText });
          }
        } catch (emailError) {
          logStep("Error sending email", { email, error: emailError });
        }
      }
    } else {
      logStep("Skipping email notification - no RESEND_API_KEY or no admin emails");
    }

    // Log the notification in email_logs for tracking
    await supabaseClient.from("email_logs").insert({
      lead_id,
      template_type: "client_request_notification",
      recipient_email: adminEmails.join(", ") || "no-admins",
      recipient_name: "Admin Team",
      subject: `New Request: ${title}`,
      status: RESEND_API_KEY ? "sent" : "skipped",
    });

    logStep("Notification complete");

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
