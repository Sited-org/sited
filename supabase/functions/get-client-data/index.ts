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

    const { lead_id, email } = await req.json();
    
    if (!lead_id || !email) {
      throw new Error("Lead ID and email are required");
    }

    logStep("Fetching data for lead", { lead_id });

    // Verify the lead exists and email matches
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select("*, stripe_customer_id, stripe_payment_method_id")
      .eq("id", lead_id)
      .eq("email", email.toLowerCase().trim())
      .single();

    if (leadError || !lead) {
      throw new Error("Access denied");
    }

    // Fetch transactions
    const { data: transactions, error: txError } = await supabaseClient
      .from("transactions")
      .select("*")
      .eq("lead_id", lead_id)
      .order("transaction_date", { ascending: false });

    if (txError) {
      logStep("Error fetching transactions", { error: txError.message });
    }

    // Fetch project updates
    const { data: projectUpdates, error: updateError } = await supabaseClient
      .from("project_updates")
      .select("*")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false });

    if (updateError) {
      logStep("Error fetching project updates", { error: updateError.message });
    }

    // Fetch client requests
    const { data: clientRequests, error: requestsError } = await supabaseClient
      .from("client_requests")
      .select("*")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false });

    if (requestsError) {
      logStep("Error fetching client requests", { error: requestsError.message });
    }

    // Fetch project milestones
    const { data: projectMilestones, error: milestonesError } = await supabaseClient
      .from("project_milestones")
      .select("*")
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
          project_type: lead.project_type,
          status: lead.status,
          form_data: lead.form_data,
          created_at: lead.created_at,
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
