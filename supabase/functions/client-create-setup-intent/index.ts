import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLIENT-CREATE-SETUP-INTENT] ${step}${detailsStr}`);
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

    const { lead_id, email, payment_method_type, session_token } = await req.json();
    if (!lead_id) throw new Error("lead_id is required");
    if (!email) throw new Error("email is required");

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

    logStep("Session validated", { lead_id, email, payment_method_type });

    // Verify lead access and get lead details
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select("id, name, email, business_name, stripe_customer_id")
      .eq("id", lead_id)
      .eq("email", email.toLowerCase().trim())
      .single();

    if (leadError || !lead) {
      throw new Error("Access denied - invalid credentials");
    }

    logStep("Lead verified", { leadId: lead.id, name: lead.name, businessName: lead.business_name });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Use ONLY business name for Stripe customer (no fallback to personal name - invoices should only show business)
    const customerName = lead.business_name || undefined;

    // Create or get Stripe customer
    let customerId = lead.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: lead.email,
        name: customerName, // Only business name - never personal name on invoices
        metadata: { 
          lead_id: lead.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to lead
      await supabaseClient
        .from("leads")
        .update({ stripe_customer_id: customerId })
        .eq("id", lead_id);

      logStep("Created new Stripe customer", { customerId });
    } else {
      logStep("Using existing Stripe customer", { customerId });
    }

    // Determine payment method types
    const paymentMethodTypes = payment_method_type === 'au_becs_debit' 
      ? ['au_becs_debit'] 
      : ['card'];

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: paymentMethodTypes,
    });

    logStep("Setup intent created", { setupIntentId: setupIntent.id });

    return new Response(
      JSON.stringify({ 
        clientSecret: setupIntent.client_secret,
        customerId,
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
