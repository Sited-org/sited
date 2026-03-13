import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=account_credentials&account_id=${accountId}`,
  });
  if (!response.ok) throw new Error(`Zoom token error: ${await response.text()}`);
  return (await response.json()).access_token;
}

function getTypeLabel(bt: string): string {
  if (bt === 'plan') return 'Plan Call';
  if (bt === 'checkin') return 'Check-In Call';
  return 'Discovery Call';
}

function buildCancellationEmail(p: { name: string; typeLabel: string; date: string; time: string }): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f8f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="background-color:#141414;padding:28px 40px;border-radius:16px 16px 0 0;text-align:center;">
          <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">SITED</h1>
          <p style="color:#a1a1aa;font-size:12px;margin:6px 0 0;letter-spacing:0.5px;">WEB DESIGN & DEVELOPMENT</p>
        </td></tr>
        <tr><td style="background-color:#ffffff;padding:36px 40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <h2 style="color:#141414;font-size:20px;font-weight:700;margin:0 0 8px;">Booking Cancelled</h2>
          <p style="color:#71717a;font-size:14px;line-height:1.6;margin:0 0 20px;">
            Hey ${p.name}, unfortunately your <strong style="color:#141414;">${p.typeLabel}</strong> on <strong>${p.date}</strong> at <strong>${p.time}</strong> has been cancelled.
          </p>
          <p style="color:#71717a;font-size:14px;line-height:1.6;margin:0 0 20px;">
            If you'd like to rebook, please visit our website or reply to this email. We're happy to find a time that works for you.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="https://sited.co/contact" target="_blank" style="display:inline-block;background-color:#141414;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:10px;">
              Rebook a Call →
            </a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:20px;text-align:center;"><p style="color:#a1a1aa;font-size:11px;margin:0;">Sited · sited.co · 0459 909 810</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildRescheduleEmail(p: { name: string; typeLabel: string; oldDate: string; oldTime: string; newDate: string; newTime: string; zoomJoinUrl: string }): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f8f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="background-color:#141414;padding:28px 40px;border-radius:16px 16px 0 0;text-align:center;">
          <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">SITED</h1>
          <p style="color:#a1a1aa;font-size:12px;margin:6px 0 0;letter-spacing:0.5px;">WEB DESIGN & DEVELOPMENT</p>
        </td></tr>
        <tr><td style="background-color:#ffffff;padding:36px 40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <h2 style="color:#141414;font-size:20px;font-weight:700;margin:0 0 8px;">Your Call Has Been Rescheduled 📅</h2>
          <p style="color:#71717a;font-size:14px;line-height:1.6;margin:0 0 20px;">
            Hey ${p.name}, your <strong style="color:#141414;">${p.typeLabel}</strong> has been moved to a new time.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin-bottom:12px;">
            <tr><td>
              <p style="color:#991b1b;font-size:13px;margin:0;text-decoration:line-through;">
                ❌ ${p.oldDate} at ${p.oldTime}
              </p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:24px;">
            <tr><td>
              <p style="color:#166534;font-size:14px;font-weight:600;margin:0;">
                ✅ ${p.newDate} at ${p.newTime}
              </p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:4px 0 24px;">
            <a href="${p.zoomJoinUrl}" target="_blank" style="display:inline-block;background-color:#141414;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:10px;">
              Join Zoom Meeting →
            </a>
          </td></tr></table>
          <p style="color:#a1a1aa;font-size:13px;line-height:1.6;margin:0;text-align:center;">
            If this doesn't work for you, reply to this email or call <strong>0459 909 810</strong>.
          </p>
        </td></tr>
        <tr><td style="padding:20px;text-align:center;"><p style="color:#a1a1aa;font-size:11px;margin:0;">Sited · sited.co · 0459 909 810</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, booking_id, zoom_meeting_id } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Fetch admin timezone from calendar config
    const { data: configData } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'calendar_config')
      .maybeSingle();
    const adminTimezone = (configData?.setting_value as any)?.timezone || 'Australia/Brisbane';

    // Fetch booking details
    const { data: booking } = await supabase.from('bookings').select('*').eq('id', booking_id).single();
    if (!booking) throw new Error('Booking not found');

    const firstName = booking.first_name || 'there';
    const typeLabel = getTypeLabel(booking.booking_type);
    const oldDate = new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const oldTime = booking.booking_time;

    if (action === 'cancel') {
      // 1. Delete Zoom meeting
      if (zoom_meeting_id) {
        try {
          const accessToken = await getZoomAccessToken();
          const res = await fetch(`https://api.zoom.us/v2/meetings/${zoom_meeting_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });
          // 204 = success, 404 = already deleted
          if (!res.ok && res.status !== 404) {
            const errText = await res.text();
            console.error('Zoom delete error:', errText);
          } else {
            // Consume body to prevent resource leak
            await res.text();
          }
        } catch (zoomErr) {
          console.error('Zoom delete failed:', zoomErr);
        }
      }

      // 2. Update booking status
      await supabase.from('bookings').update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        zoom_meeting_id: null,
        zoom_meeting_url: null,
        zoom_join_url: null,
      }).eq('id', booking_id);

      // 3. Send cancellation email
      if (booking.email) {
        await resend.emails.send({
          from: 'Sited <hello@sited.co>',
          to: [booking.email],
          subject: `Your ${typeLabel} has been cancelled`,
          html: buildCancellationEmail({ name: firstName, typeLabel, date: oldDate, time: oldTime }),
        });
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'reschedule') {
      const { new_date, new_time, new_start_time, duration } = body;

      let newZoomJoinUrl = booking.zoom_join_url || '';
      let newZoomStartUrl = booking.zoom_meeting_url || '';
      let newZoomMeetingId = booking.zoom_meeting_id;

      // 0. Double-booking check — reject if slot is taken
      const { data: conflicting } = await supabase
        .from('bookings')
        .select('id')
        .eq('booking_date', new_date)
        .eq('booking_time', new_time)
        .neq('status', 'cancelled')
        .neq('id', booking_id)
        .maybeSingle();

      if (conflicting) {
        return new Response(JSON.stringify({ error: 'This time slot is already booked' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 1. Update Zoom meeting time — use admin timezone (not Sydney)
      if (zoom_meeting_id) {
        try {
          const accessToken = await getZoomAccessToken();
          const patchRes = await fetch(`https://api.zoom.us/v2/meetings/${zoom_meeting_id}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              start_time: new_start_time,
              duration: duration || 20,
              timezone: adminTimezone,
            }),
          });
          if (!patchRes.ok && patchRes.status !== 204) {
            const errText = await patchRes.text();
            console.error('Zoom update error:', errText);
          } else {
            await patchRes.text();
          }
        } catch (zoomErr) {
          console.error('Zoom update failed:', zoomErr);
        }
      }

      // 2. Update booking record
      await supabase.from('bookings').update({
        booking_date: new_date,
        booking_time: new_time,
        status: 'confirmed',
      }).eq('id', booking_id);

      // 3. Send reschedule email
      const newDateFormatted = new Date(new_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      if (booking.email) {
        await resend.emails.send({
          from: 'Sited <hello@sited.co>',
          to: [booking.email],
          subject: `Your ${typeLabel} has been rescheduled — ${newDateFormatted}`,
          html: buildRescheduleEmail({
            name: firstName, typeLabel, oldDate, oldTime,
            newDate: newDateFormatted, newTime: new_time,
            zoomJoinUrl: newZoomJoinUrl,
          }),
        });
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error('manage-booking error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
