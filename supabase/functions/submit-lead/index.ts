import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 lead submissions per hour per IP

// Validation schema
const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email").max(255, "Email too long"),
  phone: z.string().trim().max(30, "Phone too long").optional().nullable(),
  business_name: z.string().trim().max(200, "Business name too long").optional().nullable(),
  project_type: z.string().trim().min(1, "Project type is required").max(50),
  form_data: z.record(z.unknown()),
});

async function checkRateLimit(
  supabase: any,
  ipAddress: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  
  // Get current request count for this IP and endpoint
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('request_count')
    .eq('ip_address', ipAddress)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .single();

  if (existing) {
    if (existing.request_count >= MAX_REQUESTS_PER_WINDOW) {
      return { allowed: false, remaining: 0 };
    }
    
    // Increment counter
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('ip_address', ipAddress)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString());
    
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - existing.request_count - 1 };
  }

  // Create new rate limit entry
  await supabase
    .from('rate_limits')
    .insert({
      ip_address: ipAddress,
      endpoint: endpoint,
      request_count: 1,
      window_start: new Date().toISOString(),
    });

  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('cf-connecting-ip') || 
                      'unknown';

    // Check rate limit
    const rateLimit = await checkRateLimit(supabase, ipAddress, 'submit-lead');
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for IP: ${ipAddress}`);
      return new Response(
        JSON.stringify({ error: 'Too many submissions. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0'
          } 
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = leadSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validationResult.error.errors.map(e => e.message) 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, phone, business_name, project_type, form_data } = validationResult.data;

    // Insert lead
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone,
        business_name,
        project_type,
        form_data,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert lead:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit form. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Lead created successfully: ${lead.id}`);

    // Send branded instant notification to hello@sited.co
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      const projectLabel = { website: "Website", app: "App", ai: "AI" }[project_type] || project_type;
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "Sited <hello@sited.co>",
          to: ["hello@sited.co"],
          subject: `🔔 New ${projectLabel} Lead: ${name}`,
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;padding:40px 20px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="background:#141414;padding:28px 40px;border-radius:16px 16px 0 0;text-align:center;">
<h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">SITED</h1>
<p style="color:#a1a1aa;font-size:12px;margin:6px 0 0;letter-spacing:0.5px;">NEW LEAD ALERT</p>
</td></tr>
<tr><td style="background:#fff;padding:36px 40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
<h2 style="color:#141414;font-size:20px;font-weight:700;margin:0 0 8px;">New ${projectLabel} Lead 🚀</h2>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:20px;margin:16px 0;">
<tr><td>
<p style="color:#141414;font-size:14px;margin:0 0 6px;"><strong>👤</strong>&nbsp; ${name}</p>
<p style="color:#141414;font-size:14px;margin:0 0 6px;"><strong>📧</strong>&nbsp; <a href="mailto:${email}" style="color:#3b82f6;">${email}</a></p>
${phone ? `<p style="color:#141414;font-size:14px;margin:0 0 6px;"><strong>📱</strong>&nbsp; ${phone}</p>` : ''}
${business_name ? `<p style="color:#141414;font-size:14px;margin:0;"><strong>🏢</strong>&nbsp; ${business_name}</p>` : ''}
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<a href="https://sited.co/admin/leads" target="_blank" style="display:inline-block;background:#141414;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:10px;">View in Dashboard →</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:20px;text-align:center;"><p style="color:#a1a1aa;font-size:11px;margin:0;">Sited · sited.co · 0459 909 810</p></td></tr>
</table></td></tr></table></body></html>`,
        }),
      }).catch(err => console.error('Failed to send hello@ notification:', err));
    }

    // Trigger detailed notification (don't wait for it)
    fetch(`${supabaseUrl}/functions/v1/send-lead-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        businessName: business_name,
        projectType: project_type,
        formData: form_data,
      }),
    }).catch(err => console.error('Failed to send notification:', err));

    return new Response(
      JSON.stringify({ success: true, leadId: lead.id }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining)
        } 
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
