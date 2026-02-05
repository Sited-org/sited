import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-CLIENT-DATA] ${step}${detailsStr}`);
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { lead_id, email, session_token } = await req.json();
    
    if (!lead_id || !email) {
      throw new Error("Lead ID and email are required");
    }

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

    logStep("Session validated, fetching data for lead", { lead_id });

    // Verify the lead exists and email matches
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select("id, name, email, phone, business_name, billing_address, website_url, tracking_id, project_type, status, form_data, created_at, stripe_customer_id, stripe_payment_method_id, analytics_status, ga_status, ga_property_id, workflow_data")
      .eq("id", lead_id)
      .eq("email", email.toLowerCase().trim())
      .single();

    if (leadError || !lead) {
      throw new Error("Access denied");
    }

    // Fetch transactions - exclude voided items and void entries from client view
    const { data: allTransactions, error: txError } = await supabaseClient
      .from("transactions")
      .select("id, item, credit, debit, status, transaction_date, invoice_status, stripe_invoice_id, is_recurring, recurring_interval, created_at, notes")
      .eq("lead_id", lead_id)
      .order("transaction_date", { ascending: false });

    if (txError) {
      logStep("Error fetching transactions", { error: txError.message });
    }

    // Filter out voided transactions and void reversal entries for client view
    // Clients should only see non-voided, real transactions
    const transactions = (allTransactions || []).filter(t => {
      // Exclude void reversal entries (items starting with "VOID:")
      if (t.item.startsWith('VOID:')) return false;
      // Exclude transactions that have been voided
      if (t.status === 'void') return false;
      if (t.notes?.includes('[VOIDED:')) return false;
      return true;
    }).map(t => ({
      id: t.id,
      item: t.item,
      credit: t.credit,
      debit: t.debit,
      status: t.status,
      transaction_date: t.transaction_date,
      invoice_status: t.invoice_status,
      is_recurring: t.is_recurring,
      recurring_interval: t.recurring_interval,
      created_at: t.created_at,
    }));

    // Fetch project updates
    const { data: projectUpdates, error: updateError } = await supabaseClient
      .from("project_updates")
      .select("id, content, created_at")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false });

    if (updateError) {
      logStep("Error fetching project updates", { error: updateError.message });
    }

    // Fetch client requests
    const { data: clientRequests, error: requestsError } = await supabaseClient
      .from("client_requests")
      .select("id, title, description, priority, status, admin_notes, created_at, completed_at, estimated_completion")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false });

    if (requestsError) {
      logStep("Error fetching client requests", { error: requestsError.message });
    }

    // Fetch project milestones
    const { data: projectMilestones, error: milestonesError } = await supabaseClient
      .from("project_milestones")
      .select("id, title, description, category, status, display_order, completed_at, created_at")
      .eq("lead_id", lead_id)
      .order("display_order", { ascending: true });

    if (milestonesError) {
      logStep("Error fetching project milestones", { error: milestonesError.message });
    }

    // Fetch saved payment method if exists
    let savedPaymentMethod = null;
    if (lead.stripe_payment_method_id) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const paymentMethod = await stripe.paymentMethods.retrieve(lead.stripe_payment_method_id);
        
        if (paymentMethod.type === 'card' && paymentMethod.card) {
          savedPaymentMethod = {
            type: 'card',
            card: {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              exp_month: paymentMethod.card.exp_month,
              exp_year: paymentMethod.card.exp_year,
            }
          };
        } else if (paymentMethod.type === 'au_becs_debit' && paymentMethod.au_becs_debit) {
          savedPaymentMethod = {
            type: 'au_becs_debit',
            au_becs_debit: {
              bsb_number: paymentMethod.au_becs_debit.bsb_number,
              last4: paymentMethod.au_becs_debit.last4,
            }
          };
        }
      } catch (e) {
        logStep("Error fetching payment method from Stripe", { error: e });
      }
    }

    logStep("Data fetched successfully");

    return new Response(
      JSON.stringify({ 
        lead: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          business_name: lead.business_name,
          billing_address: lead.billing_address,
          website_url: lead.website_url,
          tracking_id: lead.tracking_id,
          project_type: lead.project_type,
          status: lead.status,
          form_data: lead.form_data,
          created_at: lead.created_at,
          analytics_status: lead.analytics_status,
          ga_status: lead.ga_status,
          ga_property_id: lead.ga_property_id,
          workflow_data: lead.workflow_data,
        },
        transactions: transactions || [],
        projectUpdates: projectUpdates || [],
        clientRequests: clientRequests || [],
        projectMilestones: projectMilestones || [],
        savedPaymentMethod,
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
