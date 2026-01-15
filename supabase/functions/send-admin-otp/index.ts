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

    const { email, user_id } = await req.json();
    
    if (!email || !user_id) {
      return new Response(
        JSON.stringify({ error: "Email and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending admin OTP to:", email);

    // Verify the user exists in admin_profiles
    const { data: profile, error: profileError } = await supabaseClient
      .from('admin_profiles')
      .select('id, display_name, email, user_id')
      .eq('user_id', user_id)
      .eq('email', email.toLowerCase())
      .single();

    if (profileError || !profile) {
      console.log("Admin profile not found:", profileError);
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "If the account exists, a code has been sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in admin_otp_codes table
    const { error: insertError } = await supabaseClient
      .from('admin_otp_codes')
      .upsert({
        user_id: user_id,
        email: email.toLowerCase(),
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        used: false,
      }, {
        onConflict: 'user_id'
      });

    if (insertError) {
      console.error("Error storing admin OTP:", insertError);
      throw new Error("Failed to generate verification code");
    }

    // Send email with OTP
    const emailResponse = await resend.emails.send({
      from: "Sited <hello@sited.co>",
      to: [email],
      subject: "Your Admin Login Verification Code",
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
              <h1 style="color: white; margin: 0; font-size: 24px;">Sited Admin</h1>
            </div>
            <div style="padding: 30px; text-align: center;">
              <p style="color: #64748b; margin: 0 0 20px;">Hi ${profile.display_name || 'Admin'},</p>
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
                If you didn't request this code, please secure your account immediately.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Admin OTP email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-admin-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
