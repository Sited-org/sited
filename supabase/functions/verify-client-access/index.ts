import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS_PER_IP = 10;
const MAX_ATTEMPTS_PER_EMAIL = 10;
const SESSION_EXPIRY_HOURS = 24;

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-CLIENT-ACCESS] ${step}${detailsStr}`);
};

async function checkRateLimit(
  supabase: any, identifier: string, endpoint: string, maxRequests: number
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const { data: existing } = await supabase
    .from('rate_limits').select('request_count')
    .eq('ip_address', identifier).eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString()).single();

  if (existing) {
    if (existing.request_count >= maxRequests) return { allowed: false, remaining: 0 };
    await supabase.from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('ip_address', identifier).eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString());
    return { allowed: true, remaining: maxRequests - existing.request_count - 1 };
  }

  await supabase.from('rate_limits').insert({
    ip_address: identifier, endpoint, request_count: 1,
    window_start: new Date().toISOString(),
  });
  return { allowed: true, remaining: maxRequests - 1 };
}

function uint8ArrayToBase64(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.byteLength; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

async function createHmacSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function getSessionSecret(): string {
  const secret = Deno.env.get('CLIENT_SESSION_SECRET');
  if (!secret) throw new Error('CLIENT_SESSION_SECRET is not configured');
  return secret;
}

async function generateSecureSessionToken(leadId: string): Promise<{ token: string; expiresAt: number }> {
  const secret = getSessionSecret();
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const randomPart = uint8ArrayToBase64(randomBytes);
  const expiresAt = Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
  const payload = { lid: leadId, exp: expiresAt, rnd: randomPart };
  const payloadBase64 = btoa(JSON.stringify(payload));
  const signature = await createHmacSignature(payloadBase64, secret);
  return { token: `${payloadBase64}.${signature}`, expiresAt };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    logStep("Function started");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('cf-connecting-ip') || 'unknown';

    const ipRateLimit = await checkRateLimit(supabaseClient, ipAddress, 'verify-client-access-ip', MAX_ATTEMPTS_PER_IP);
    if (!ipRateLimit.allowed) {
      return new Response(JSON.stringify({ error: "Too many login attempts. Please try again later." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 });
    }

    const { email, skip_session } = await req.json();
    const emailTrimmed = email?.toLowerCase().trim();
    
    if (!emailTrimmed) throw new Error("Email is required");

    const emailRateLimit = await checkRateLimit(supabaseClient, `email:${emailTrimmed}`, 'verify-client-access-email', MAX_ATTEMPTS_PER_EMAIL);
    if (!emailRateLimit.allowed) {
      return new Response(JSON.stringify({ error: "Too many login attempts for this email. Please try again later." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 });
    }

    logStep("Verifying email access", { email: emailTrimmed });

    // Find lead by email only (no access code needed)
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select("id, name, email, phone, business_name, project_type, status, form_data, created_at, tracking_id, website_url, billing_address")
      .eq("email", emailTrimmed)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (leadError || !lead) {
      logStep("Access denied - no matching lead found");
      return new Response(JSON.stringify({ error: "No account found with this email address." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    logStep("Access granted", { leadId: lead.id, name: lead.name });

    if (skip_session) {
      return new Response(JSON.stringify({ success: true, valid: true, message: "Email validated, proceed to OTP" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    const { token: sessionToken, expiresAt } = await generateSecureSessionToken(lead.id);

    return new Response(JSON.stringify({ 
      success: true, 
      lead: {
        id: lead.id, name: lead.name, email: lead.email, phone: lead.phone,
        business_name: lead.business_name, project_type: lead.project_type,
        status: lead.status, form_data: lead.form_data, created_at: lead.created_at,
        tracking_id: lead.tracking_id, website_url: lead.website_url,
        billing_address: lead.billing_address,
      },
      sessionToken, expiresAt,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
