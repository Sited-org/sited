import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate secure session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
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

    const { email, access_code, otp_code } = await req.json();
    
    if (!email || !access_code || !otp_code) {
      return new Response(
        JSON.stringify({ error: "Email, access code, and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying OTP for:", email);

    // Verify OTP
    const { data: otpRecord, error: otpError } = await supabaseClient
      .from('client_otp_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp_code', otp_code)
      .eq('used', false)
      .single();

    if (otpError || !otpRecord) {
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

    // Verify access code and get lead
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('client_access_code', access_code.toUpperCase())
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as used
    await supabaseClient
      .from('client_otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // Generate session token
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log("Client verified successfully:", lead.email);

    return new Response(
      JSON.stringify({
        success: true,
        lead: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          business_name: lead.business_name,
          project_type: lead.project_type,
          status: lead.status,
          tracking_id: lead.tracking_id,
          website_url: lead.website_url,
        },
        sessionToken,
        expiresAt: expiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-client-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
