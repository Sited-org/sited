 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 const logStep = (step: string, details?: any) => {
   const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
   console.log(`[FETCH-ANALYTICS] ${step}${detailsStr}`);
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
 
     const { lead_id, session_token, property_id } = await req.json();
 
     if (!lead_id) {
       throw new Error("Lead ID is required");
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
 
     logStep("Session validated, fetching lead data", { lead_id });
 
     // Get the lead with GA tokens
     const { data: lead, error: leadError } = await supabaseClient
       .from("leads")
       .select("ga_access_token, ga_refresh_token, ga_token_expires_at, ga_property_id, ga_status")
       .eq("id", lead_id)
       .single();
 
     if (leadError || !lead) {
       throw new Error("Lead not found");
     }
 
     // Check if analytics is connected
     if (lead.ga_status !== 'connected' || !lead.ga_access_token) {
       return new Response(
         JSON.stringify({ error: "Analytics not connected", needsConnection: true }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
       );
     }
 
     const propertyId = property_id || lead.ga_property_id;
     if (!propertyId) {
       return new Response(
         JSON.stringify({ error: "No property ID configured", needsPropertyId: true }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
       );
     }
 
     // Check if token is expired and needs refresh
     let accessToken = lead.ga_access_token;
     const tokenExpiry = lead.ga_token_expires_at ? new Date(lead.ga_token_expires_at) : null;
     
     if (tokenExpiry && tokenExpiry < new Date() && lead.ga_refresh_token) {
       logStep("Token expired, refreshing...");
       // Token refresh would happen here - for now we'll indicate reconnection needed
       return new Response(
         JSON.stringify({ error: "Session expired, please reconnect", needsConnection: true }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
       );
     }
 
     // Fetch analytics data from Google Analytics Data API
     const propertyNumericId = propertyId.replace('G-', '').replace(/\D/g, '');
     const analyticsUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyNumericId}:runReport`;
     
     // Get data for the last 30 days
     const today = new Date();
     const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
     const startDate = thirtyDaysAgo.toISOString().split('T')[0];
     const endDate = today.toISOString().split('T')[0];
 
     logStep("Fetching analytics data", { propertyId: propertyNumericId, startDate, endDate });
 
     const analyticsResponse = await fetch(analyticsUrl, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${accessToken}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         dateRanges: [{ startDate, endDate }],
         dimensions: [{ name: 'date' }],
         metrics: [
           { name: 'activeUsers' },
           { name: 'sessions' },
           { name: 'screenPageViews' },
           { name: 'averageSessionDuration' },
           { name: 'bounceRate' },
           { name: 'newUsers' },
         ],
         orderBys: [{ dimension: { dimensionName: 'date' }, desc: true }],
         limit: 30,
       }),
     });
 
     if (!analyticsResponse.ok) {
       const errorData = await analyticsResponse.text();
       logStep("Analytics API error", { status: analyticsResponse.status, error: errorData });
       
       if (analyticsResponse.status === 401 || analyticsResponse.status === 403) {
         return new Response(
           JSON.stringify({ error: "Analytics access expired, please reconnect", needsConnection: true }),
           { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
         );
       }
       
       throw new Error(`Analytics API error: ${analyticsResponse.status}`);
     }
 
     const analyticsData = await analyticsResponse.json();
     logStep("Analytics data received", { rowCount: analyticsData.rows?.length || 0 });
 
     // Parse and aggregate the data
     let totalUsers = 0;
     let totalSessions = 0;
     let totalPageviews = 0;
     let totalDuration = 0;
     let totalBounceRate = 0;
     let totalNewUsers = 0;
     let dataPoints = 0;
 
     if (analyticsData.rows) {
       analyticsData.rows.forEach((row: any) => {
         const metrics = row.metricValues || [];
         totalUsers += parseInt(metrics[0]?.value || '0');
         totalSessions += parseInt(metrics[1]?.value || '0');
         totalPageviews += parseInt(metrics[2]?.value || '0');
         totalDuration += parseFloat(metrics[3]?.value || '0');
         totalBounceRate += parseFloat(metrics[4]?.value || '0');
         totalNewUsers += parseInt(metrics[5]?.value || '0');
         dataPoints++;
       });
     }
 
     const avgSessionDuration = dataPoints > 0 ? totalDuration / dataPoints : 0;
     const avgBounceRate = dataPoints > 0 ? totalBounceRate / dataPoints : 0;
 
     const metrics = {
       activeUsers: totalUsers,
       sessions: totalSessions,
       pageviews: totalPageviews,
       avgSessionDuration: Math.round(avgSessionDuration),
       bounceRate: Math.round(avgBounceRate * 100) / 100,
       newUsers: totalNewUsers,
       dateRange: { startDate, endDate },
     };
 
     logStep("Metrics calculated", metrics);
 
     return new Response(
       JSON.stringify({ success: true, metrics }),
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