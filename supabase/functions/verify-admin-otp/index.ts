import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, otp_code } = await req.json();
    
    if (!user_id || !otp_code) {
      return new Response(
        JSON.stringify({ error: "user_id and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying admin OTP for user_id:", user_id, "otp_code:", otp_code);

    // First check what OTPs exist for this user
    const { data: allOtps, error: allOtpsError } = await supabaseClient
      .from('admin_otp_codes')
      .select('id, otp_code, used, expires_at, created_at')
      .eq('user_id', user_id)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log("Available OTPs for user:", allOtps, "error:", allOtpsError);

    // Verify OTP - use maybeSingle() to handle 0 rows gracefully
    const { data: otpRecord, error: otpError } = await supabaseClient
      .from('admin_otp_codes')
      .select('*')
      .eq('user_id', user_id)
      .eq('otp_code', otp_code)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.log("OTP query error:", otpError);
      return new Response(
        JSON.stringify({ error: "Verification failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otpRecord) {
      console.log("No matching OTP found. Entered code:", otp_code);
      return new Response(
        JSON.stringify({ error: "Invalid verification code" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if OTP expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Verification code has expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as used
    await supabaseClient
      .from('admin_otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    console.log("Admin OTP verified successfully for user_id:", user_id);

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-admin-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
