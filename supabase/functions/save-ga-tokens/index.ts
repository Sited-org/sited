 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 const logStep = (step: string, details?: any) => {
   const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
   console.log(`[SAVE-GA-TOKENS] ${step}${detailsStr}`);
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
 
 async function validateSessionToken(token: string, secret: string): Promise<{ valid: boolean; leadId?: string; error?: string }> {
   try {
     if (!token || typeof token !== 'string') {
       return { valid: false, error: 'Missing or invalid token' };
     }
     
     const parts = token.split('.');
     if (parts.length !== 2) {
       return { valid: false, error: 'Invalid token format' };
     }
     
     const [payloadBase64, signature] = parts;
     
     const isValidSignature = await verifyHmacSignature(payloadBase64, signature, secret);
     if (!isValidSignature) {
       return { valid: false, error: 'Invalid token signature' };
     }
     
     let payload: SessionPayload;
     try {
       payload = JSON.parse(atob(payloadBase64));
     } catch {
       return { valid: false, error: 'Invalid token payload' };
     }
     
     if (!payload.lid || !payload.exp || !payload.rnd) {
       return { valid: false, error: 'Incomplete token payload' };
     }
     
     if (Date.now() > payload.exp) {
       return { valid: false, error: 'Token has expired' };
     }
     
     return { valid: true, leadId: payload.lid };
   } catch (error) {
     return { valid: false, error: 'Token validation failed' };
   }
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
 
     const sessionSecret = Deno.env.get("CLIENT_SESSION_SECRET");
     if (!sessionSecret) {
       throw new Error("CLIENT_SESSION_SECRET is not configured");
     }
 
     const { lead_id, session_token, access_token, refresh_token, expires_in, property_id } = await req.json();
 
     if (!lead_id || !access_token) {
       throw new Error("Lead ID and access token are required");
     }
 
     // Validate session token
     if (!session_token) {
       return new Response(
         JSON.stringify({ error: "Authentication required" }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
       );
     }
 
     const tokenValidation = await validateSessionToken(session_token, sessionSecret);
     if (!tokenValidation.valid) {
       logStep("Invalid session token", { error: tokenValidation.error });
       return new Response(
         JSON.stringify({ error: tokenValidation.error || "Invalid session" }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
       );
     }
 
     if (tokenValidation.leadId !== lead_id) {
       return new Response(
         JSON.stringify({ error: "Access denied" }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
       );
     }
 
     logStep("Session validated, saving GA tokens", { lead_id, hasRefreshToken: !!refresh_token });
 
     // Calculate token expiry
     const expiresAt = expires_in 
       ? new Date(Date.now() + expires_in * 1000).toISOString()
       : new Date(Date.now() + 3600 * 1000).toISOString(); // Default 1 hour
 
     // Update the lead with GA tokens
     const updateData: any = {
       ga_access_token: access_token,
       ga_token_expires_at: expiresAt,
       ga_status: 'connected',
     };
 
     if (refresh_token) {
       updateData.ga_refresh_token = refresh_token;
     }
 
     if (property_id) {
       updateData.ga_property_id = property_id;
     }
 
     const { error: updateError } = await supabaseClient
       .from("leads")
       .update(updateData)
       .eq("id", lead_id);
 
     if (updateError) {
       logStep("Error updating lead", { error: updateError.message });
       throw updateError;
     }
 
     logStep("GA tokens saved successfully");
 
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