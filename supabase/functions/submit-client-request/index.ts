import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBMIT-CLIENT-REQUEST] ${step}${detailsStr}`);
};

async function verifyHmacSignature(data: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expectedSignatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(expectedSignatureBuffer)));
  if (signature.length !== expectedSignature.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

interface SessionPayload { lid: string; exp: number; rnd: string; }
interface TokenValidationResult { valid: boolean; leadId?: string; error?: string; }

async function validateSessionToken(token: string, secret: string): Promise<TokenValidationResult> {
  try {
    if (!token || typeof token !== 'string') return { valid: false, error: 'Missing or invalid token' };
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false, error: 'Invalid token format' };
    const [payloadBase64, signature] = parts;
    const isValidSignature = await verifyHmacSignature(payloadBase64, signature, secret);
    if (!isValidSignature) return { valid: false, error: 'Invalid token signature' };
    let payload: SessionPayload;
    try { payload = JSON.parse(atob(payloadBase64)); } catch { return { valid: false, error: 'Invalid token payload' }; }
    if (!payload.lid || !payload.exp || !payload.rnd) return { valid: false, error: 'Incomplete token payload' };
    if (Date.now() > payload.exp) return { valid: false, error: 'Token has expired' };
    return { valid: true, leadId: payload.lid };
  } catch { return { valid: false, error: 'Token validation failed' }; }
}

function getSessionSecret(): string {
  const secret = Deno.env.get('CLIENT_SESSION_SECRET');
  if (!secret) throw new Error('CLIENT_SESSION_SECRET is not configured');
  return secret;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { session_token, lead_id, action, request_id } = body;

    // Validate session
    if (!session_token) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
      });
    }

    const sessionSecret = getSessionSecret();
    const tokenValidation = await validateSessionToken(session_token, sessionSecret);
    if (!tokenValidation.valid) {
      return new Response(JSON.stringify({ error: tokenValidation.error || "Invalid session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
      });
    }

    if (!lead_id) throw new Error("Lead ID is required");
    if (tokenValidation.leadId !== lead_id) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403,
      });
    }

    logStep("Session validated", { lead_id, action });

    // ---- Handle draft actions ----
    if (action === 'send_draft' && request_id) {
      // Send a draft: change status from draft to pending + notify admins
      const { data: draftReq, error: fetchErr } = await supabaseClient
        .from("client_requests")
        .select("*")
        .eq("id", request_id)
        .eq("lead_id", lead_id)
        .eq("status", "draft")
        .single();

      if (fetchErr || !draftReq) throw new Error("Draft not found");

      const { error: updateErr } = await supabaseClient
        .from("client_requests")
        .update({ status: "pending" })
        .eq("id", request_id);

      if (updateErr) throw new Error("Failed to send draft");

      // Send notification to admins
      try {
        const { data: lead } = await supabaseClient.from("leads").select("name, email, business_name").eq("id", lead_id).single();
        const { data: adminProfiles } = await supabaseClient.from("admin_profiles").select("email");
        const adminEmails = adminProfiles?.map(p => p.email) || [];
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (RESEND_API_KEY && adminEmails.length > 0) {
          const clientName = body.client_name || lead?.name || 'Unknown Client';
          const emailHtml = `
            <!DOCTYPE html><html><body style="font-family: -apple-system, sans-serif; background:#f4f4f5; padding:20px;">
            <div style="max-width:600px; margin:0 auto; background:white; border-radius:12px; overflow:hidden;">
              <div style="background:#000; padding:30px; text-align:center;">
                <h1 style="color:white; margin:0;">New Client Request</h1>
              </div>
              <div style="padding:30px;">
                <p style="color:#64748b;">From <strong>${clientName}</strong></p>
                <h2 style="margin:0 0 10px;">${draftReq.title}</h2>
                ${draftReq.description ? `<p style="color:#64748b;">${draftReq.description}</p>` : ''}
                <div style="margin-top:20px; text-align:center;">
                  <a href="https://sited.lovable.app/admin/requests" style="background:#000; color:white; padding:12px 30px; border-radius:8px; text-decoration:none; font-weight:600;">View Request</a>
                </div>
              </div>
            </div></body></html>`;

          for (const email of adminEmails) {
            fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
              body: JSON.stringify({
                from: "Sited <hello@sited.co>",
                to: [email],
                subject: `New Request: ${draftReq.title}`,
                html: emailHtml,
              }),
            }).catch(() => {});
          }
        }
      } catch (e) { logStep("Notification error (non-fatal)", { error: e }); }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'delete_draft' && request_id) {
      const { error: delErr } = await supabaseClient
        .from("client_requests")
        .delete()
        .eq("id", request_id)
        .eq("lead_id", lead_id)
        .eq("status", "draft");

      if (delErr) throw new Error("Failed to delete draft");

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Normal create flow ----
    const { title, description, priority, status: requestedStatus, client_name, client_email } = body;
    const bodyContent = body.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error("Title is required");
    }

    const { data: lead, error: leadError } = await supabaseClient
      .from("leads").select("id, name, email, business_name").eq("id", lead_id).single();
    if (leadError || !lead) throw new Error("Lead not found");

    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    const sanitizedPriority = validPriorities.includes(priority) ? priority : 'normal';
    const finalStatus = requestedStatus === 'draft' ? 'draft' : 'pending';

    const { data: newRequest, error: insertError } = await supabaseClient
      .from("client_requests")
      .insert({
        lead_id,
        title: title.trim().substring(0, 500),
        description: description?.trim()?.substring(0, 2000) || null,
        body: bodyContent?.trim()?.substring(0, 10000) || null,
        priority: sanitizedPriority,
        status: finalStatus,
      })
      .select()
      .single();

    if (insertError) throw new Error("Failed to create request");
    logStep("Request created", { request_id: newRequest.id, status: finalStatus });

    // Only send notification for pending (not draft)
    if (finalStatus === 'pending') {
      try {
        const { data: adminProfiles } = await supabaseClient.from("admin_profiles").select("email, display_name");
        const adminEmails = adminProfiles?.map(p => p.email) || [];
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (RESEND_API_KEY && adminEmails.length > 0) {
          const priorityColors: Record<string, string> = { low: '#6B7280', normal: '#3B82F6', high: '#F97316', urgent: '#EF4444' };
          const emailHtml = `
            <!DOCTYPE html><html><body style="font-family: -apple-system, sans-serif; background:#f4f4f5; padding:20px;">
            <div style="max-width:600px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
              <div style="background:#000; padding:30px; text-align:center;">
                <h1 style="color:white; margin:0; font-size:24px;">New Client Request</h1>
              </div>
              <div style="padding:30px;">
                <div style="background:#f8fafc; border-radius:8px; padding:20px; margin-bottom:20px;">
                  <p style="margin:0 0 10px; color:#64748b; font-size:14px;">From</p>
                  <p style="margin:0; font-size:18px; font-weight:600;">${client_name || lead.name || 'Unknown'}</p>
                  <p style="margin:5px 0 0; color:#64748b; font-size:14px;">${client_email || lead.email || ''}</p>
                </div>
                <div style="margin-bottom:20px;">
                  <span style="display:inline-block; background:${priorityColors[sanitizedPriority]}20; color:${priorityColors[sanitizedPriority]}; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; text-transform:uppercase;">${sanitizedPriority} Priority</span>
                </div>
                <h2 style="margin:0 0 10px; font-size:20px;">${title.trim()}</h2>
                ${description ? `<p style="color:#64748b; line-height:1.6;">${description.trim()}</p>` : '<p style="color:#94a3b8; font-style:italic;">No description provided</p>'}
                <div style="margin-top:30px; text-align:center;">
                  <a href="https://sited.lovable.app/admin/requests" style="display:inline-block; background:#000; color:white; padding:12px 30px; border-radius:8px; text-decoration:none; font-weight:600;">View Request</a>
                </div>
              </div>
              <div style="background:#f8fafc; padding:20px; text-align:center; border-top:1px solid #e2e8f0;">
                <p style="margin:0; color:#94a3b8; font-size:12px;">This notification was sent from your client portal</p>
              </div>
            </div></body></html>`;

          for (const email of adminEmails) {
            fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
              body: JSON.stringify({
                from: "Sited <hello@sited.co>", to: [email],
                subject: `New Request: ${title.trim()} [${sanitizedPriority.toUpperCase()}]`,
                html: emailHtml,
              }),
            }).catch(e => logStep("Failed to send email", { email, error: e }));
          }
        }

        await supabaseClient.from("email_logs").insert({
          lead_id, template_type: "client_request_notification",
          recipient_email: adminEmails.join(", ") || "no-admins",
          recipient_name: "Admin Team",
          subject: `New Request: ${title.trim()}`,
          status: "sent",
        });
      } catch (notifyError) { logStep("Notification error (non-fatal)", { error: notifyError }); }
    }

    return new Response(
      JSON.stringify({ success: true, request: { id: newRequest.id, title: newRequest.title, description: newRequest.description, body: newRequest.body, priority: newRequest.priority, status: newRequest.status, created_at: newRequest.created_at } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
