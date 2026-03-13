import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-SAVED-CARD] ${step}${detailsStr}`);
};

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const adminUserId = userData.user?.id;
    if (!adminUserId) throw new Error("User not found");
    logStep("User authenticated", { userId: adminUserId });

    // Check if user has permission to view payment methods (requires can_view_payments)
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('can_view_payments')
      .eq('user_id', adminUserId)
      .single();

    if (roleError || !userRole?.can_view_payments) {
      logStep("Permission denied", { userId: adminUserId, requiredPermission: 'can_view_payments' });
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions: cannot view payment methods' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    logStep("Permission validated", { permission: 'can_view_payments' });

    const { lead_id } = await req.json();
    if (!lead_id) throw new Error("lead_id is required");
    logStep("Request parsed", { lead_id });

    // Fetch lead with Stripe details
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select("stripe_customer_id, stripe_payment_method_id")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) throw new Error("Lead not found");
    
    if (!lead.stripe_payment_method_id) {
      return new Response(
        JSON.stringify({ hasCard: false, card: null, au_becs_debit: null }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Fetch payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(lead.stripe_payment_method_id);
    logStep("Payment method retrieved", { 
      type: paymentMethod.type,
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4 || paymentMethod.au_becs_debit?.last4
    });

    // Build response based on payment method type
    const response: any = { hasCard: true };

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
    return new Response(JSON.stringify({ error: errorMessage, hasCard: false, card: null, au_becs_debit: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
