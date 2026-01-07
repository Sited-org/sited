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

    const { email, access_code, lead_id } = await req.json();
    
    // Support both access_code (new) and lead_id (legacy)
    const code = access_code?.toUpperCase().trim();
    const legacyId = lead_id?.trim();
    
    if (!email || (!code && !legacyId)) {
      throw new Error("Email and Access Code are required");
    }

    logStep("Verifying access", { email, hasCode: !!code, hasLegacyId: !!legacyId });

    // Find the lead matching email and either access_code or lead_id
    let lead;
    let leadError;

    if (code) {
      // New flow: use access_code
      const result = await supabaseClient
        .from("leads")
        .select("id, name, email, phone, business_name, project_type, status, form_data, created_at, client_access_code")
        .eq("client_access_code", code)
        .eq("email", email.toLowerCase().trim())
        .single();
      
      lead = result.data;
      leadError = result.error;
    } else if (legacyId) {
      // Legacy flow: use lead_id
      const result = await supabaseClient
        .from("leads")
        .select("id, name, email, phone, business_name, project_type, status, form_data, created_at, client_access_code")
        .eq("id", legacyId)
        .eq("email", email.toLowerCase().trim())
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

    // Generate a simple session token
    const sessionToken = btoa(`${lead.id}:${Date.now()}`);

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
