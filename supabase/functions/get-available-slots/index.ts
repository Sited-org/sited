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
    const busyRanges: { startMin: number; endMin: number }[] = [];

    for (const meeting of meetings) {
      if (!meeting.start_time) continue;

      const startDate = new Date(meeting.start_time);
      const tzStart = new Date(startDate.toLocaleString('en-US', { timeZone: timezone }));

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
    return [];
  }
}

/**
 * Convert a time (hours, minutes) from one timezone to another on a given date.
 * Returns { hours, minutes, dateShift } where dateShift is -1, 0, or +1.
 */
function convertTimeBetweenTimezones(
  date: string,
  hours: number,
  minutes: number,
  fromTz: string,
  toTz: string
): { hours: number; minutes: number; dateStr: string } {
  // Build a reference date in the source timezone
  // We use a trick: format a known UTC time in both TZs and compare
  const [year, month, day] = date.split('-').map(Number);
  
  // Create a date string that represents the time in the source timezone
  // Use Intl to find the UTC offset for each timezone on this date
  const refDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  
  // Get the time in the source timezone for our reference UTC date
  const fromStr = refDate.toLocaleString('en-US', { timeZone: fromTz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const toStr = refDate.toLocaleString('en-US', { timeZone: toTz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  
  // Parse offset difference by creating dates in each timezone
  // More reliable approach: find the offset of each TZ at this point in time
  const fromParts = new Date(refDate.toLocaleString('en-US', { timeZone: fromTz }));
  const toParts = new Date(refDate.toLocaleString('en-US', { timeZone: toTz }));
  
  // The difference between fromParts and toParts gives us the offset difference
  const offsetDiffMs = toParts.getTime() - fromParts.getTime();
  
  // Apply offset to get the target time
  const sourceMinutes = hours * 60 + minutes;
  const targetMinutes = sourceMinutes + Math.round(offsetDiffMs / 60000);
  
  // Handle day overflow/underflow
  let targetDay = day;
  let adjustedMinutes = targetMinutes;
  
  if (targetMinutes < 0) {
    adjustedMinutes = targetMinutes + 1440;
    targetDay--;
  } else if (targetMinutes >= 1440) {
    adjustedMinutes = targetMinutes - 1440;
    targetDay++;
  }
  
  const targetH = Math.floor(adjustedMinutes / 60);
  const targetM = adjustedMinutes % 60;
  
  // Build adjusted date string
  const adjMonth = String(month).padStart(2, '0');
  const adjDay = String(targetDay).padStart(2, '0');
  const targetDateStr = `${year}-${adjMonth}-${adjDay}`;
  
  return { hours: targetH, minutes: targetM, dateStr: targetDateStr };
}

function formatTimeStr(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, duration_override, timezone: clientTimezone } = await req.json();
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

    const adminTimezone = config.timezone || "Australia/Sydney";
    const effectiveClientTz = clientTimezone || adminTimezone;

    // Check if day is available using local date parsing (avoid UTC shift)
    const [yr, mo, dy] = date.split('-').map(Number);
    const d = new Date(yr, mo - 1, dy);
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
      getZoomBusyRanges(date, adminTimezone),
    ]);

    const bookedTimes = new Set((bookingsResult.data || []).map(b => b.booking_time));

    const meetingDuration = duration_override ? Number(duration_override) : config.meeting_duration_minutes;

    // Generate slots in ADMIN timezone
    const [startH, startM] = config.available_hours_start.split(':').map(Number);
    const [endH, endM] = config.available_hours_end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const totalSlotMinutes = config.buffer_before_minutes + meetingDuration + config.buffer_after_minutes;

    const slots: { time: string; available: boolean; adminTime?: string }[] = [];
    let current = startMinutes;

    while (current + meetingDuration <= endMinutes) {
      const adminH = Math.floor(current / 60);
      const adminM = current % 60;
      const adminTimeStr = formatTimeStr(adminH, adminM);

      // Check Zoom conflicts (in admin timezone)
      const slotStart = current;
      const slotEnd = current + meetingDuration;
      const zoomConflict = zoomBusyRanges.some(
        range => slotStart < range.endMin && slotEnd > range.startMin
      );

      const isAvailable = !bookedTimes.has(adminTimeStr) && !zoomConflict;

      // Convert slot time from admin TZ to client TZ
      if (adminTimezone === effectiveClientTz) {
        // No conversion needed
        slots.push({ time: adminTimeStr, available: isAvailable });
      } else {
        const converted = convertTimeBetweenTimezones(date, adminH, adminM, adminTimezone, effectiveClientTz);
        // Only include if the converted time is still on the same date
        if (converted.dateStr === date) {
          const clientTimeStr = formatTimeStr(converted.hours, converted.minutes);
          slots.push({ time: clientTimeStr, available: isAvailable, adminTime: adminTimeStr });
        }
      }

      current += totalSlotMinutes;
    }

    return new Response(JSON.stringify({
      slots,
      available: true,
      config: { meeting_duration_minutes: meetingDuration },
      adminTimezone,
      clientTimezone: effectiveClientTz,
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
