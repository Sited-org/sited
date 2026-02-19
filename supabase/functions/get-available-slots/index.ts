import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function getZoomAccessToken(): Promise<string> {
  const accountId = Deno.env.get('ZOOM_ACCOUNT_ID');
  const clientId = Deno.env.get('ZOOM_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');
  if (!accountId || !clientId || !clientSecret) throw new Error('Zoom credentials not configured');

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=account_credentials&account_id=${accountId}`,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zoom token error [${response.status}]: ${errorText}`);
  }
  const data = await response.json();
  return data.access_token;
}

interface ZoomMeeting {
  start_time: string;
  duration: number;
}

async function getZoomBusyRanges(date: string, timezone: string): Promise<{ startMin: number; endMin: number }[]> {
  try {
    const accessToken = await getZoomAccessToken();

    // Fetch meetings for the date range
    const from = `${date}T00:00:00Z`;
    const to = `${date}T23:59:59Z`;

    const response = await fetch(
      `https://api.zoom.us/v2/users/me/meetings?type=upcoming&page_size=100&from=${date}&to=${date}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      console.error('Zoom meetings fetch failed:', response.status, await response.text());
      return [];
    }

    const data = await response.json();
    const meetings: ZoomMeeting[] = data.meetings || [];

    // Convert each meeting to minute ranges in the target timezone
    const busyRanges: { startMin: number; endMin: number }[] = [];

    for (const meeting of meetings) {
      if (!meeting.start_time) continue;

      const startDate = new Date(meeting.start_time);
      // Convert to the target timezone
      const tzStart = new Date(startDate.toLocaleString('en-US', { timeZone: timezone }));
      const meetingDate = tzStart.toISOString().split('T')[0];

      // Only include meetings on the requested date
      // Compare using the localized date
      const localYear = tzStart.getFullYear();
      const localMonth = String(tzStart.getMonth() + 1).padStart(2, '0');
      const localDay = String(tzStart.getDate()).padStart(2, '0');
      const localDateStr = `${localYear}-${localMonth}-${localDay}`;

      if (localDateStr !== date) continue;

      const startMinutes = tzStart.getHours() * 60 + tzStart.getMinutes();
      const endMinutes = startMinutes + (meeting.duration || 30);

      busyRanges.push({ startMin: startMinutes, endMin: endMinutes });
    }

    return busyRanges;
  } catch (error) {
    console.error('Error fetching Zoom busy times:', error);
    return []; // Fail open — don't block all slots if Zoom is unreachable
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, duration_override } = await req.json();
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
      timezone: "Australia/Sydney",
    };

    const timezone = config.timezone || "Australia/Sydney";

    // Check if day is available
    const d = new Date(date + 'T00:00:00');
    const dayOfWeek = d.getDay();
    if (!config.available_days.includes(dayOfWeek)) {
      return new Response(JSON.stringify({ slots: [], available: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch existing bookings and Zoom busy times in parallel
    const [bookingsResult, zoomBusyRanges] = await Promise.all([
      supabase
        .from('bookings')
        .select('booking_time, status')
        .eq('booking_date', date)
        .neq('status', 'cancelled'),
      getZoomBusyRanges(date, timezone),
    ]);

    const bookedTimes = new Set((bookingsResult.data || []).map(b => b.booking_time));

    const meetingDuration = duration_override ? Number(duration_override) : config.meeting_duration_minutes;

    // Generate available slots
    const [startH, startM] = config.available_hours_start.split(':').map(Number);
    const [endH, endM] = config.available_hours_end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const totalSlotMinutes = config.buffer_before_minutes + meetingDuration + config.buffer_after_minutes;

    const slots: { time: string; available: boolean }[] = [];
    let current = startMinutes;

    while (current + meetingDuration <= endMinutes) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const timeStr = `${displayH}:${m.toString().padStart(2, '0')} ${period}`;

      // Check if slot overlaps with any Zoom busy range
      const slotStart = current;
      const slotEnd = current + meetingDuration;
      const zoomConflict = zoomBusyRanges.some(
        range => slotStart < range.endMin && slotEnd > range.startMin
      );

      slots.push({
        time: timeStr,
        available: !bookedTimes.has(timeStr) && !zoomConflict,
      });

      current += totalSlotMinutes;
    }

    return new Response(JSON.stringify({
      slots,
      available: true,
      config: { meeting_duration_minutes: meetingDuration },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
