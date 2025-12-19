import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-CLIENT-ACCESS] ${step}${detailsStr}`);
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

    const { email, lead_id } = await req.json();
    
    if (!email || !lead_id) {
      throw new Error("Email and Lead ID are required");
    }

    logStep("Verifying access", { email, lead_id });

    // Find the lead matching both email and ID
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select("id, name, email, phone, business_name, project_type, status, form_data, created_at")
      .eq("id", lead_id)
      .eq("email", email.toLowerCase().trim())
      .single();

    if (leadError || !lead) {
      logStep("Access denied - no matching lead found");
      return new Response(
        JSON.stringify({ error: "Invalid email or Lead ID. Please check your details and try again." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    logStep("Access granted", { leadId: lead.id, name: lead.name });

    // Generate a simple session token (in production, use JWT)
    const sessionToken = btoa(`${lead.id}:${Date.now()}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead,
        sessionToken,
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
