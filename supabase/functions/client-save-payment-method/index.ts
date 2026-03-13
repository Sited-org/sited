import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLIENT-SAVE-PAYMENT-METHOD] ${step}${detailsStr}`);
};

// HMAC-SHA256 verification for session tokens
async function verifyHmacSignature(data: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expectedSignatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(expectedSignatureBuffer)));
  
  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

interface SessionPayload {
  lid: string;
  exp: number;
  rnd: string;
}

interface TokenValidationResult {
  valid: boolean;
  leadId?: string;
  error?: string;
}

async function validateSessionToken(token: string, secret: string): Promise<TokenValidationResult> {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Missing or invalid token' };
    }
    
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [payloadBase64, signature] = parts;
    
    // Verify signature
    const isValidSignature = await verifyHmacSignature(payloadBase64, signature, secret);
    if (!isValidSignature) {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    // Decode and parse payload
    let payload: SessionPayload;
    try {
      payload = JSON.parse(atob(payloadBase64));
    } catch {
      return { valid: false, error: 'Invalid token payload' };
    }
    
    // Validate payload structure
    if (!payload.lid || !payload.exp || !payload.rnd) {
      return { valid: false, error: 'Incomplete token payload' };
    }
    
    // Check expiry
    if (Date.now() > payload.exp) {
      return { valid: false, error: 'Token has expired' };
    }
    
    return { valid: true, leadId: payload.lid };
  } catch (error) {
    return { valid: false, error: 'Token validation failed' };
  }
}

function getSessionSecret(): string {
  const secret = Deno.env.get('CLIENT_SESSION_SECRET');
  if (!secret) {
    throw new Error('CLIENT_SESSION_SECRET is not configured');
  }
  return secret;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { lead_id, email, payment_method_id, session_token } = await req.json();
    if (!lead_id) throw new Error("lead_id is required");
    if (!email) throw new Error("email is required");
    if (!payment_method_id) throw new Error("payment_method_id is required");

    // Validate session token (required for authenticated access)
    if (!session_token) {
      logStep("Missing session token");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const sessionSecret = getSessionSecret();
    const tokenValidation = await validateSessionToken(session_token, sessionSecret);
    
    if (!tokenValidation.valid) {
      logStep("Invalid session token", { error: tokenValidation.error });
      return new Response(
        JSON.stringify({ error: tokenValidation.error || "Invalid session" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Ensure the token's lead_id matches the requested lead_id
    if (tokenValidation.leadId !== lead_id) {
      logStep("Lead ID mismatch", { tokenLeadId: tokenValidation.leadId, requestedLeadId: lead_id });
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    logStep("Session validated", { lead_id, email, payment_method_id });

    // Verify lead access
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select("id, email")
      .eq("id", lead_id)
      .eq("email", email.toLowerCase().trim())
      .single();

    if (leadError || !lead) {
      throw new Error("Access denied - invalid credentials");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Fetch payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);
    logStep("Payment method retrieved", { 
      type: paymentMethod.type, 
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4 || paymentMethod.au_becs_debit?.last4
    });

    // Save payment method ID to lead
    const { error: updateError } = await supabaseClient
      .from("leads")
      .update({ stripe_payment_method_id: payment_method_id })
      .eq("id", lead_id);

    if (updateError) throw new Error(`Failed to save payment method: ${updateError.message}`);
    logStep("Payment method saved to lead");

    // Build response based on payment method type
    const response: any = { success: true };

    if (paymentMethod.type === 'card' && paymentMethod.card) {
      response.card = {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
      };
    } else if (paymentMethod.type === 'au_becs_debit' && paymentMethod.au_becs_debit) {
      response.au_becs_debit = {
        bsb_number: paymentMethod.au_becs_debit.bsb_number,
        last4: paymentMethod.au_becs_debit.last4,
      };
    }

    return new Response(
      JSON.stringify(response),
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
