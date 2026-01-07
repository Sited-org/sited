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

// Simple hash function for password (in production, use bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    const { email, access_code, lead_id, password, new_password, mode } = await req.json();
    
    // Support both access_code (new) and lead_id (legacy)
    const code = access_code?.toUpperCase().trim();
    const legacyId = lead_id?.trim();
    
    if (!email || (!code && !legacyId)) {
      throw new Error("Email and Access Code are required");
    }

    logStep("Verifying access", { email, hasCode: !!code, hasLegacyId: !!legacyId, mode });

    // Find the lead matching email and either access_code or lead_id
    let lead;
    let leadError;

    if (code) {
      // New flow: use access_code
      const result = await supabaseClient
        .from("leads")
        .select("id, name, email, phone, business_name, project_type, status, form_data, created_at, client_password_hash, client_first_login_at, client_access_code")
        .eq("client_access_code", code)
        .eq("email", email.toLowerCase().trim())
        .single();
      
      lead = result.data;
      leadError = result.error;
    } else if (legacyId) {
      // Legacy flow: use lead_id
      const result = await supabaseClient
        .from("leads")
        .select("id, name, email, phone, business_name, project_type, status, form_data, created_at, client_password_hash, client_first_login_at, client_access_code")
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

    // Check if this is first login (no password set yet)
    const isFirstLogin = !lead.client_password_hash;

    // Mode: first_login - using access_code for first time access
    if (mode === 'first_login' || (!password && isFirstLogin)) {
      if (!isFirstLogin) {
        return new Response(
          JSON.stringify({ 
            error: "Password required",
            requiresPassword: true,
            isFirstLogin: false
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          }
        );
      }
      
      logStep("First login detected - allowing access to set password");
      
      // Generate session token
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
          isFirstLogin: true,
          requiresPasswordSetup: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Mode: set_password - setting password for first time
    if (mode === 'set_password' && new_password) {
      if (!isFirstLogin) {
        return new Response(
          JSON.stringify({ error: "Password already set" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      const hashedPassword = await hashPassword(new_password);
      
      const { error: updateError } = await supabaseClient
        .from("leads")
        .update({ 
          client_password_hash: hashedPassword,
          client_first_login_at: new Date().toISOString()
        })
        .eq("id", lead.id);

      if (updateError) {
        throw new Error("Failed to set password");
      }

      logStep("Password set successfully");
      
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
          passwordSet: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Mode: password_login - logging in with password
    if (password) {
      if (isFirstLogin) {
        return new Response(
          JSON.stringify({ 
            error: "First login required",
            isFirstLogin: true,
            requiresPasswordSetup: true
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          }
        );
      }

      const hashedPassword = await hashPassword(password);
      
      if (hashedPassword !== lead.client_password_hash) {
        logStep("Access denied - invalid password");
        return new Response(
          JSON.stringify({ error: "Invalid password" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          }
        );
      }

      logStep("Password login successful", { leadId: lead.id });
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
        isFirstLogin: false,
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
