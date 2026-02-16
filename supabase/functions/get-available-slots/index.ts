import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date } = await req.json(); // date in YYYY-MM-DD format
    if (!date) throw new Error('Date is required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get calendar config
    const { data: configData } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'calendar_config')
      .maybeSingle();

    const config = configData?.setting_value as any || {
      meeting_duration_minutes: 20,
      buffer_before_minutes: 5,
      buffer_after_minutes: 10,
      available_days: [1, 2, 3, 4, 5],
      available_hours_start: "09:00",
      available_hours_end: "17:00",
    };

    // Check if day is available
    const d = new Date(date + 'T00:00:00');
    const dayOfWeek = d.getDay();
    if (!config.available_days.includes(dayOfWeek)) {
      return new Response(JSON.stringify({ slots: [], available: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get existing bookings for this date
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('booking_time, status')
      .eq('booking_date', date)
      .neq('status', 'cancelled');

    const bookedTimes = new Set((existingBookings || []).map(b => b.booking_time));

    // Generate available slots
    const [startH, startM] = config.available_hours_start.split(':').map(Number);
    const [endH, endM] = config.available_hours_end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const totalSlotMinutes = config.buffer_before_minutes + config.meeting_duration_minutes + config.buffer_after_minutes;

    const slots: { time: string; available: boolean }[] = [];
    let current = startMinutes;

    while (current + config.meeting_duration_minutes <= endMinutes) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const timeStr = `${displayH}:${m.toString().padStart(2, '0')} ${period}`;

      slots.push({
        time: timeStr,
        available: !bookedTimes.has(timeStr),
      });

      current += totalSlotMinutes;
    }

    return new Response(JSON.stringify({ slots, available: true, config: { meeting_duration_minutes: config.meeting_duration_minutes } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
