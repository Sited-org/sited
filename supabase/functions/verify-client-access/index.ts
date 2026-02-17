import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS_PER_IP = 10; // Max 10 attempts per hour per IP
const MAX_ATTEMPTS_PER_EMAIL = 10; // Max 10 attempts per hour per email

// Session token configuration
const SESSION_EXPIRY_HOURS = 24;

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-CLIENT-ACCESS] ${step}${detailsStr}`);
};

async function checkRateLimit(
  supabase: any,
  identifier: string,
  endpoint: string,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  
  // Get current request count for this identifier and endpoint
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('request_count')
    .eq('ip_address', identifier)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .single();

  if (existing) {
    if (existing.request_count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    
    // Increment counter
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('ip_address', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString());
    
    return { allowed: true, remaining: maxRequests - existing.request_count - 1 };
  }

  // Create new rate limit entry
  await supabase
    .from('rate_limits')
    .insert({
      ip_address: identifier,
      endpoint: endpoint,
      request_count: 1,
      window_start: new Date().toISOString(),
    });

  return { allowed: true, remaining: maxRequests - 1 };
}

// HMAC-SHA256 signing for session tokens
async function createHmacSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Helper function to convert Uint8Array to base64
function uint8ArrayToBase64(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.byteLength; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

function getSessionSecret(): string {
  const secret = Deno.env.get('CLIENT_SESSION_SECRET');
  if (!secret) {
    throw new Error('CLIENT_SESSION_SECRET is not configured');
  }
  return secret;
}

async function generateSecureSessionToken(leadId: string): Promise<{ token: string; expiresAt: number }> {
  const secret = getSessionSecret();
  
  // Generate cryptographically secure random component
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const randomPart = uint8ArrayToBase64(randomBytes);
  
  // Create expiry timestamp
  const expiresAt = Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
  
  // Create token payload
  const payload = {
    lid: leadId, // lead id
    exp: expiresAt, // expiry
    rnd: randomPart, // random component
  };
  
  // Encode payload as base64
  const payloadBase64 = btoa(JSON.stringify(payload));
  
  // Create HMAC signature
  const signature = await createHmacSignature(payloadBase64, secret);
  
  // Combine payload and signature: payload.signature
  const token = `${payloadBase64}.${signature}`;
  
  return { token, expiresAt };
}

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

    // Get client IP for rate limiting
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('cf-connecting-ip') || 
                      'unknown';

    // Check IP-based rate limit
    const ipRateLimit = await checkRateLimit(supabaseClient, ipAddress, 'verify-client-access-ip', MAX_ATTEMPTS_PER_IP);
    if (!ipRateLimit.allowed) {
      logStep("Rate limit exceeded for IP", { ip: ipAddress });
      return new Response(
        JSON.stringify({ error: "Too many login attempts. Please try again later." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    const { email, access_code, lead_id, skip_session } = await req.json();
    
    // Validate input
    const emailTrimmed = email?.toLowerCase().trim();
    const code = access_code?.toUpperCase().trim();
    const legacyId = lead_id?.trim();
    
    if (!emailTrimmed || (!code && !legacyId)) {
      throw new Error("Email and Access Code are required");
    }

    // Check email-based rate limit (prevents targeted brute force on specific accounts)
    const emailRateLimit = await checkRateLimit(supabaseClient, `email:${emailTrimmed}`, 'verify-client-access-email', MAX_ATTEMPTS_PER_EMAIL);
    if (!emailRateLimit.allowed) {
      logStep("Rate limit exceeded for email");
      return new Response(
        JSON.stringify({ error: "Too many login attempts for this email. Please try again later." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    logStep("Verifying access", { hasCode: !!code, hasLegacyId: !!legacyId });

    // Find the lead matching email and either access_code or lead_id
    let lead;
    let leadError;

    if (code) {
      // New flow: use access_code
      const result = await supabaseClient
        .from("leads")
        .select("id, name, email, phone, business_name, project_type, status, form_data, created_at, client_access_code")
        .eq("client_access_code", code)
        .eq("email", emailTrimmed)
        .single();
      
      lead = result.data;
      leadError = result.error;
    } else if (legacyId) {
      // Legacy flow: use lead_id
      const result = await supabaseClient
        .from("leads")
        .select("id, name, email, phone, business_name, project_type, status, form_data, created_at, client_access_code")
        .eq("id", legacyId)
        .eq("email", emailTrimmed)
        .single();
      
      lead = result.data;
      leadError = result.error;
    }

    if (leadError || !lead) {
      logStep("Access denied - no matching lead found");
      return new Response(
        JSON.stringify({ error: "Invalid email or access code. Please check your details and try again." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    logStep("Access granted", { leadId: lead.id, name: lead.name });

    // If skip_session is true, just validate credentials (for 2FA flow)
    if (skip_session) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          valid: true,
          message: "Credentials validated, proceed to 2FA"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Generate a cryptographically signed session token with expiration
    const { token: sessionToken, expiresAt } = await generateSecureSessionToken(lead.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          business_name: lead.business_name,
          project_type: lead.project_type,
          status: lead.status,
          form_data: lead.form_data,
          created_at: lead.created_at,
        },
        sessionToken,
        expiresAt,
      }),
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
