import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPLOAD-REQUEST-ATTACHMENT] ${step}${detailsStr}`);
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

function getSessionSecret(): string {
  const secret = Deno.env.get('CLIENT_SESSION_SECRET');
  if (!secret) {
    throw new Error('CLIENT_SESSION_SECRET is not configured');
  }
  return secret;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

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

    // Parse multipart form data
    const formData = await req.formData();
    const sessionToken = formData.get('session_token') as string;
    const leadId = formData.get('lead_id') as string;
    const requestId = formData.get('request_id') as string;
    const file = formData.get('file') as File;

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    if (!leadId || !requestId || !file) {
      throw new Error("Missing required fields");
    }

    // Validate session token
    const sessionSecret = getSessionSecret();
    const tokenValidation = await validateSessionToken(sessionToken, sessionSecret);
    
    if (!tokenValidation.valid) {
      logStep("Invalid session token", { error: tokenValidation.error });
      return new Response(
        JSON.stringify({ error: tokenValidation.error || "Invalid session" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    if (tokenValidation.leadId !== leadId) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Verify the request belongs to this lead
    const { data: request, error: requestError } = await supabaseClient
      .from("client_requests")
      .select("id, lead_id")
      .eq("id", requestId)
      .eq("lead_id", leadId)
      .single();

    if (requestError || !request) {
      logStep("Request not found or access denied", { requestId, leadId });
      return new Response(
        JSON.stringify({ error: "Request not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: "File too large (max 10MB)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: "File type not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Generate secure file path
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileName = `${requestId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    logStep("Uploading file", { fileName, size: file.size, type: file.type });

    // Upload file using service role
    const { error: uploadError } = await supabaseClient.storage
      .from('request-attachments')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logStep("Upload error", { error: uploadError.message });
      throw new Error("Failed to upload file");
    }

    // Create attachment record
    const { data: attachment, error: recordError } = await supabaseClient
      .from('request_attachments')
      .insert({
        request_id: requestId,
        file_name: file.name.substring(0, 255), // Limit filename length
        file_path: fileName,
        file_size: file.size,
        content_type: file.type,
        uploaded_by: 'client',
      })
      .select()
      .single();

    if (recordError) {
      logStep("Record creation error", { error: recordError.message });
      // Try to delete the uploaded file
      await supabaseClient.storage.from('request-attachments').remove([fileName]);
      throw new Error("Failed to record attachment");
    }

    logStep("File uploaded successfully", { attachmentId: attachment.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        attachment: {
          id: attachment.id,
          file_name: attachment.file_name,
          file_path: attachment.file_path,
        }
      }),
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
