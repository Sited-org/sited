import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateSignedSessionToken(leadId: string, secret: string): Promise<{ token: string; expiresAt: string }> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const rnd = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  const payload = { lid: leadId, exp: expiresAt.getTime(), rnd };
  const payloadBase64 = btoa(JSON.stringify(payload));
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadBase64));
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  return { token: `${payloadBase64}.${signature}`, expiresAt: expiresAt.toISOString() };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const sessionSecret = Deno.env.get("CLIENT_SESSION_SECRET");
    if (!sessionSecret) throw new Error("CLIENT_SESSION_SECRET is not configured");

    const { email, otp_code } = await req.json();
    
    if (!email || !otp_code) {
      return new Response(JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("Verifying OTP for:", email);

    // Verify OTP
    const { data: otpRecord, error: otpError } = await supabaseClient
      .from('client_otp_codes').select('*')
      .eq('email', email.toLowerCase()).eq('otp_code', otp_code).eq('used', false).single();

    if (otpError || !otpRecord) {
      return new Response(JSON.stringify({ error: "Invalid verification code" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Verification code has expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get lead by email (no access code needed)
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads').select('*')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: "No account found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mark OTP as used
    await supabaseClient.from('client_otp_codes').update({ used: true }).eq('id', otpRecord.id);

    // Generate signed session token
    const { token: sessionToken, expiresAt } = await generateSignedSessionToken(lead.id, sessionSecret);

    console.log("Client verified successfully:", lead.email);

    return new Response(JSON.stringify({
      success: true,
      lead: {
        id: lead.id, name: lead.name, email: lead.email, phone: lead.phone,
        business_name: lead.business_name, project_type: lead.project_type,
        status: lead.status, tracking_id: lead.tracking_id,
        website_url: lead.website_url, billing_address: lead.billing_address,
        form_data: lead.form_data, created_at: lead.created_at,
      },
      sessionToken, expiresAt,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Error in verify-client-otp:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
