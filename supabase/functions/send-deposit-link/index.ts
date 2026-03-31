import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOGO_URL = "https://storage.googleapis.com/gpt-engineer-file-uploads/bK3lO63gVKgONGtqyEYfuGBiGzy1/uploads/1769959095793-S.png";
const PAYMENT_LINK = "https://buy.stripe.com/bJe7sMfmb9tH94P9HQ5wI09";

function generateEmailHtml(firstName: string, businessName: string, depositAmount: number): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f5;">
  <div style="background: #09090b; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <img src="${LOGO_URL}" alt="Sited" width="48" height="48" style="margin-bottom: 16px;" />
    <h1 style="margin: 0; font-size: 22px; color: #fff; font-weight: 900;">Deposit Payment</h1>
    <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px;">Sited.co</p>
  </div>

  <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; color: #09090b;">Hi ${firstName},</p>
    <p style="color: #52525b;">To get started on your project for <strong>${businessName}</strong>, a refundable deposit of <strong>$${depositAmount} AUD</strong> is required.</p>
    
    <p style="color: #52525b;">This deposit secures your spot in our build queue and is fully refundable if you're not 100% satisfied with the final product.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${PAYMENT_LINK}" target="_blank" style="background: #09090b; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 40px; border-radius: 8px; display: inline-block;">Pay Deposit — $${depositAmount} AUD</a>
    </div>

    <p style="color: #52525b;">Once your deposit is received, we'll begin the build process right away.</p>

    <p style="color: #52525b; margin-top: 24px;">If you have any questions, feel free to reach out to your project manager.</p>

    <p style="color: #52525b; margin-top: 8px;">Kindly,</p>
    <p style="color: #09090b; font-weight: 700; margin: 4px 0 0;">The Sited Team</p>
  </div>

  <p style="text-align: center; color: #a1a1aa; font-size: 11px; margin-top: 20px;">
    © ${new Date().getFullYear()} Sited · <a href="https://sited.co" style="color: #a1a1aa;">sited.co</a>
  </p>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_id } = await req.json();
    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch lead details
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("email, name, business_name")
      .eq("id", lead_id)
      .single();

    if (leadErr || !lead?.email) {
      return new Response(JSON.stringify({ error: "Lead not found or no email" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get deposit amount from settings
    const { data: depositSetting } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "deposit_amount")
      .maybeSingle();

    const depositAmount = (depositSetting?.setting_value as any)?.amount ?? 49;
    const firstName = (lead.name || "").split(" ")[0] || "there";
    const businessName = lead.business_name || "your business";

    const html = generateEmailHtml(firstName, businessName, depositAmount);

    const { error: emailErr } = await resend.emails.send({
      from: "Sited <hello@sited.co>",
      to: [lead.email],
      subject: `Deposit Payment — ${businessName}`,
      html,
    });

    if (emailErr) {
      console.error("[SEND-DEPOSIT-LINK] Email error:", emailErr);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the email
    await supabase.from("email_logs").insert({
      lead_id,
      recipient_email: lead.email,
      recipient_name: lead.name,
      subject: `Deposit Payment — ${businessName}`,
      template_type: "deposit_link",
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[SEND-DEPOSIT-LINK] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
