import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { captcha_token, captcha_answer, booking } = body;

    // 1. Validate captcha
    if (!captcha_token || captcha_answer === undefined || captcha_answer === null) {
      return new Response(JSON.stringify({ error: 'Captcha is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: challenge, error: captchaErr } = await supabase
      .from('captcha_challenges')
      .select('*')
      .eq('token', captcha_token)
      .eq('used', false)
      .single();

    if (captchaErr || !challenge) {
      return new Response(JSON.stringify({ error: 'Invalid or expired captcha. Please try again.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date(challenge.expires_at) < new Date()) {
      await supabase.from('captcha_challenges').update({ used: true }).eq('id', challenge.id);
      return new Response(JSON.stringify({ error: 'Captcha expired. Please refresh and try again.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (Number(captcha_answer) !== challenge.answer) {
      return new Response(JSON.stringify({ error: 'Incorrect answer. Please try again.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark captcha as used
    await supabase.from('captcha_challenges').update({ used: true }).eq('id', challenge.id);

    // 2. Rate limit by IP (10 bookings per hour)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: rateData } = await supabase
      .from('rate_limits')
      .select('id, request_count')
      .eq('ip_address', ip)
      .eq('endpoint', 'submit-booking')
      .gte('window_start', windowStart)
      .single();

    if (rateData && rateData.request_count >= 10) {
      return new Response(JSON.stringify({ error: 'Too many booking attempts. Please try again later.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (rateData) {
      await supabase.from('rate_limits').update({ request_count: rateData.request_count + 1 }).eq('id', rateData.id);
    } else {
      await supabase.from('rate_limits').insert({ ip_address: ip, endpoint: 'submit-booking', request_count: 1 });
    }

    // 3. Validate required booking fields
    const required = ['first_name', 'last_name', 'email', 'phone', 'business_name', 'business_type', 'business_location', 'booking_date', 'booking_time'];
    for (const field of required) {
      if (!booking?.[field]?.toString().trim()) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 4. Insert booking with service role
    const bookingId = crypto.randomUUID();
    const { error: insertErr } = await supabase.from('bookings').insert({
      id: bookingId,
      first_name: booking.first_name.trim(),
      last_name: booking.last_name.trim(),
      email: booking.email.trim(),
      phone: booking.phone.trim(),
      business_name: booking.business_name.trim(),
      business_type: booking.business_type,
      business_location: booking.business_location.trim(),
      booking_date: booking.booking_date,
      booking_time: booking.booking_time,
      booking_type: booking.booking_type || 'discovery',
      duration_minutes: booking.duration_minutes || 20,
      notes: booking.notes || null,
    });

    if (insertErr) {
      console.error('Booking insert error:', insertErr);
      return new Response(JSON.stringify({ error: 'Failed to create booking' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Booking created: ${bookingId}`);
    return new Response(JSON.stringify({ booking_id: bookingId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('submit-booking error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
