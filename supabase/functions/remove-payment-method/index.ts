import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REMOVE-PAYMENT-METHOD] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not set");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Verify user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");
    logStep("User authenticated", { userId: userData.user.id });

    // Check if user has permission to manage payment methods (requires can_charge_cards)
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('can_charge_cards')
      .eq('user_id', userData.user.id)
      .single();

    if (roleError || !userRole?.can_charge_cards) {
      logStep("Permission denied", { userId: userData.user.id, requiredPermission: 'can_charge_cards' });
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions: cannot manage payment methods' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    logStep("Permission validated", { permission: 'can_charge_cards' });

    const { lead_id } = await req.json();
    logStep("Received request", { lead_id });

    if (!lead_id) {
      throw new Error("Missing required field: lead_id");
    }

    // Fetch the lead to get Stripe payment method ID
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("stripe_payment_method_id, stripe_customer_id")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error("Lead not found");
    }

    if (!lead.stripe_payment_method_id) {
      throw new Error("No payment method on file");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Detach the payment method from Stripe
    try {
      await stripe.paymentMethods.detach(lead.stripe_payment_method_id);
      logStep("Payment method detached from Stripe", { payment_method_id: lead.stripe_payment_method_id });
    } catch (stripeError: any) {
      // If already detached or not found, continue
      logStep("Stripe detach warning (continuing)", { error: stripeError.message });
    }

    // Clear the payment method from the lead
    const { error: updateError } = await supabaseAdmin
      .from("leads")
      .update({
        stripe_payment_method_id: null,
      })
      .eq("id", lead_id);

    if (updateError) {
      throw new Error(`Error updating lead: ${updateError.message}`);
    }

    logStep("Payment method removed successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
