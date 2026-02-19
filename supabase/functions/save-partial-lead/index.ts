import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SAVE-PARTIAL-LEAD] ${step}${detailsStr}`);
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 20;

async function checkRateLimit(
  supabase: any,
  ipAddress: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ipAddress)
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart);

  if (error) {
    logStep('Rate limit check error', { error: error.message });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW };
  }

  const requestCount = count || 0;
  const allowed = requestCount < MAX_REQUESTS_PER_WINDOW;

  if (allowed) {
    await supabase.from('rate_limits').insert({
      ip_address: ipAddress,
      endpoint: endpoint,
    });
  }

  return {
    allowed,
    remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - requestCount - 1),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function invoked');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      req.headers.get('cf-connecting-ip') ||
                      'unknown';

    const rateLimitResult = await checkRateLimit(supabase, ipAddress, 'save-partial-lead');
    if (!rateLimitResult.allowed) {
      logStep('Rate limit exceeded', { ip: ipAddress });
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { 
      lead_id, 
      name, 
      email, 
      phone, 
      project_type, 
      business_name,
      form_data,
      update_only, // When true, only update existing leads — never create new ones
    } = body;

    logStep('Processing request', { lead_id, email, project_type, update_only });

    // Validate required fields
    if (!email || !name || !project_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, project_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strip the legacy "partial" flag from form_data
    const cleanFormData = form_data ? { ...form_data } : {};
    delete cleanFormData.partial;

    // If lead_id is provided, update that specific lead
    if (lead_id) {
      logStep('Updating existing lead by ID', { lead_id });
      
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          name,
          email,
          phone: phone || null,
          business_name: business_name || null,
          form_data: cleanFormData,
        })
        .eq('id', lead_id);

      if (updateError) {
        logStep('Update error', { error: updateError.message });
        return new Response(
          JSON.stringify({ error: 'Failed to update lead' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, lead_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up existing lead by email (any time, not just 24h)
    const { data: existingLead, error: selectError } = await supabase
      .from('leads')
      .select('id, form_data')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      logStep('Select error', { error: selectError.message });
    }

    // If existing lead found, update it
    if (existingLead) {
      logStep('Found existing lead, updating', { lead_id: existingLead.id });
      
      // Merge form_data: keep existing data, overlay new data
      const mergedFormData = { ...(existingLead.form_data as Record<string, unknown> || {}), ...cleanFormData };
      delete mergedFormData.partial; // Clean up any legacy partial flag
      
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          name,
          phone: phone || null,
          business_name: business_name || null,
          form_data: mergedFormData,
        })
        .eq('id', existingLead.id);

      if (updateError) {
        logStep('Update existing error', { error: updateError.message });
      }

      return new Response(
        JSON.stringify({ success: true, lead_id: existingLead.id, existing: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No existing lead found
    // If update_only mode, don't create — just return success with no lead_id
    if (update_only) {
      logStep('Update-only mode: no existing lead found, skipping creation');
      return new Response(
        JSON.stringify({ success: true, lead_id: null, skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CREATE new lead (only from Lead Capture Dialog)
    logStep('Creating new lead');
    
    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone: phone || null,
        business_name: business_name || null,
        project_type,
        form_data: cleanFormData,
        status: 'warm_lead',
      })
      .select('id')
      .single();

    if (insertError) {
      logStep('Insert error', { error: insertError.message });
      return new Response(
        JSON.stringify({ error: 'Failed to save lead' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Lead created successfully', { lead_id: newLead.id });

    // Send branded instant notification to hello@sited.co
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "Sited <hello@sited.co>",
          to: ["hello@sited.co"],
          subject: `🔔 New Warm Lead: ${name}`,
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;padding:40px 20px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="background:#141414;padding:28px 40px;border-radius:16px 16px 0 0;text-align:center;">
<h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">SITED</h1>
<p style="color:#a1a1aa;font-size:12px;margin:6px 0 0;">NEW WARM LEAD</p>
</td></tr>
<tr><td style="background:#fff;padding:36px 40px;border-radius:0 0 16px 16px;">
<h2 style="color:#141414;font-size:20px;font-weight:700;margin:0 0 16px;">New Warm Lead 🔥</h2>
<table width="100%" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:20px;">
<tr><td>
<p style="color:#141414;font-size:14px;margin:0 0 6px;"><strong>👤</strong>&nbsp; ${name}</p>
<p style="color:#141414;font-size:14px;margin:0 0 6px;"><strong>📧</strong>&nbsp; ${email}</p>
${phone ? `<p style="color:#141414;font-size:14px;margin:0;"><strong>📱</strong>&nbsp; ${phone}</p>` : ''}
</td></tr></table>
<table width="100%" style="margin-top:20px;"><tr><td align="center">
<a href="https://sited.co/admin/leads" target="_blank" style="display:inline-block;background:#141414;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:10px;">View in Dashboard →</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:20px;text-align:center;"><p style="color:#a1a1aa;font-size:11px;margin:0;">Sited · sited.co · 0459 909 810</p></td></tr>
</table></td></tr></table></body></html>`,
        }),
      }).catch(err => logStep('Failed to send hello@ notification', { error: String(err) }));
    }

    return new Response(
      JSON.stringify({ success: true, lead_id: newLead.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('Unexpected error', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
