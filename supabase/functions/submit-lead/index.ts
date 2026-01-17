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

// Validation schema - supports both old math captcha and new Google reCAPTCHA
const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email").max(255, "Email too long"),
  phone: z.string().trim().max(30, "Phone too long").optional().nullable(),
  business_name: z.string().trim().max(200, "Business name too long").optional().nullable(),
  project_type: z.string().trim().min(1, "Project type is required").max(50),
  form_data: z.record(z.unknown()),
  // Old math captcha fields (optional for backwards compatibility)
  captcha_token: z.string().optional().nullable(),
  captcha_answer: z.number().int().optional().nullable(),
  // New Google reCAPTCHA token
  recaptcha_token: z.string().optional().nullable(),
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

async function verifyMathCaptcha(
  supabase: any,
  token: string,
  answer: number
): Promise<boolean> {
  const { data: challenge } = await supabase
    .from('captcha_challenges')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!challenge || challenge.answer !== answer) {
    return false;
  }

  // Mark as used
  await supabase
    .from('captcha_challenges')
    .update({ used: true })
    .eq('token', token);

  return true;
}

// reCAPTCHA Enterprise verification
const RECAPTCHA_SITE_KEY = "6LfySkssAAAAAJ4fnEykeEgrL-7XiMzZWwYrf-VT";

async function verifyGoogleRecaptcha(token: string, expectedAction: string = "LOGIN"): Promise<boolean> {
  const apiKey = Deno.env.get('RECAPTCHA_API_KEY');
  const projectId = Deno.env.get('RECAPTCHA_PROJECT_ID');
  
  if (!apiKey || !projectId) {
    console.error('RECAPTCHA_API_KEY or RECAPTCHA_PROJECT_ID not configured');
    return false;
  }

  try {
    // reCAPTCHA Enterprise API endpoint
    const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
    
    const requestBody = {
      event: {
        token: token,
        expectedAction: expectedAction,
        siteKey: RECAPTCHA_SITE_KEY,
      }
    };

    console.log('Sending reCAPTCHA Enterprise assessment request');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    console.log('reCAPTCHA Enterprise assessment result:', JSON.stringify(result));
    
    // Check if token is valid
    if (!result.tokenProperties?.valid) {
      console.error('Invalid reCAPTCHA token:', result.tokenProperties?.invalidReason);
      return false;
    }
    
    // Check if action matches
    if (result.tokenProperties?.action !== expectedAction) {
      console.error('Action mismatch:', result.tokenProperties?.action, '!==', expectedAction);
      return false;
    }
    
    // Check risk score (0.0 is bad, 1.0 is good) - allow scores >= 0.5
    const score = result.riskAnalysis?.score ?? 0;
    console.log('reCAPTCHA risk score:', score);
    
    if (score < 0.5) {
      console.error('Low reCAPTCHA score:', score);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('reCAPTCHA Enterprise verification error:', error);
    return false;
  }
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

    const { name, email, phone, business_name, project_type, form_data, captcha_token, captcha_answer, recaptcha_token } = validationResult.data;

    // Verify CAPTCHA - support both Google reCAPTCHA and legacy math captcha
    let captchaValid = false;
    
    if (recaptcha_token) {
      // Use Google reCAPTCHA
      captchaValid = await verifyGoogleRecaptcha(recaptcha_token);
      console.log('Google reCAPTCHA verification:', captchaValid);
    } else if (captcha_token && captcha_answer !== null && captcha_answer !== undefined) {
      // Fallback to legacy math captcha
      captchaValid = await verifyMathCaptcha(supabase, captcha_token, captcha_answer);
      console.log('Math CAPTCHA verification:', captchaValid);
    }
    
    if (!captchaValid) {
      console.log('CAPTCHA verification failed');
      return new Response(
        JSON.stringify({ error: 'Security verification failed. Please try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Trigger notification (don't wait for it)
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
