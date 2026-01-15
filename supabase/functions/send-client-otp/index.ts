import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending OTP to:", email);

    // Check if lead exists
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('id, name, email')
      .eq('email', email.toLowerCase())
      .single();

    if (leadError || !lead) {
      // Don't reveal if email exists or not
      return new Response(
        JSON.stringify({ success: true, message: "If the email exists, a code has been sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // De-dupe: if an unused OTP is still valid AND was generated in the last ~30s, don't send again.
    // We infer "generated recently" from expires_at since we set expires_at = now + 10 minutes.
    const { data: existingOtp, error: existingOtpError } = await supabaseClient
      .from('client_otp_codes')
      .select('expires_at, used')
      .eq('email', email.toLowerCase())
      .eq('used', false)
      .maybeSingle();

    if (!existingOtpError && existingOtp?.expires_at) {
      const expiresAtMs = new Date(existingOtp.expires_at).getTime();
      const nowMs = Date.now();
      const msUntilExpiry = expiresAtMs - nowMs;

      // If expiry is still ~10 minutes away, it was just generated.
      if (msUntilExpiry > 0 && msUntilExpiry > (10 * 60 * 1000 - 30_000)) {
        console.log('De-duped client OTP send (recent code already generated)');
        return new Response(
          JSON.stringify({ success: true, deduped: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: insertError } = await supabaseClient
      .from('client_otp_codes')
      .upsert({
        lead_id: lead.id,
        email: email.toLowerCase(),
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        used: false,
      }, {
        onConflict: 'email'
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      throw new Error("Failed to generate verification code");
    }

    // Send email with OTP
    const emailResponse = await resend.emails.send({
      from: "Sited <hello@sited.co>",
      to: [email],
      subject: "Your Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
          <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a1a1a, #333); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Client Portal</h1>
            </div>
            <div style="padding: 30px; text-align: center;">
              <p style="color: #64748b; margin: 0 0 20px;">Hi ${lead.name || 'there'},</p>
              <p style="color: #1e293b; margin: 0 0 20px;">Your verification code is:</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b; font-family: monospace;">${otp}</span>
              </div>
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                This code expires in 10 minutes.
              </p>
            </div>
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                If you didn't request this code, please ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("OTP email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-client-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
