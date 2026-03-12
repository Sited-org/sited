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
  if (!response.ok) throw new Error(`Zoom token error [${response.status}]: ${await response.text()}`);
  return (await response.json()).access_token;
}

function formatDateForTz(dateStr: string, tz: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz });
}

function formatTimeForTz(dateStr: string, tz: string): string {
  return new Date(dateStr).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz });
}

function getTzAbbr(tz: string): string {
  const map: Record<string, string> = {
    'Australia/Sydney': 'AEST', 'Australia/Melbourne': 'AEST', 'Australia/Brisbane': 'AEST',
    'Australia/Perth': 'AWST', 'Australia/Adelaide': 'ACST', 'Australia/Hobart': 'AEST',
    'Australia/Darwin': 'ACST', 'Australia/Lord_Howe': 'LHST',
  };
  return map[tz] || 'AEST';
}

function getTypeLabel(bookingType: string): string {
  return bookingType === 'plan' ? 'Plan Call' : 'Discovery Call';
}

function buildConfirmationEmail(p: { attendeeName: string; date: string; time: string; duration: number; typeLabel: string; zoomJoinUrl: string; tzAbbr: string }): string {
  return `<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"></head>
<body style=\"margin:0;padding:0;background-color:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">
  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#f8f8f8;padding:40px 20px;\">
    <tr><td align=\"center\">
      <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;\">
        <!-- Header -->
        <tr><td style=\"background-color:#141414;padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;\">
          <h1 style=\"color:#ffffff;font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px;\">SITED</h1>
          <p style=\"color:#a1a1aa;font-size:13px;margin:8px 0 0;letter-spacing:0.5px;\">WEB DESIGN & DEVELOPMENT</p>
        </td></tr>
        <!-- Body -->
        <tr><td style=\"background-color:#ffffff;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);\">
          <h2 style=\"color:#141414;font-size:22px;font-weight:700;margin:0 0 8px;\">You're booked in! ✅</h2>
          <p style=\"color:#71717a;font-size:15px;line-height:1.6;margin:0 0 28px;\">
            Hey ${p.attendeeName}, your <strong style=\"color:#141414;\">${p.typeLabel}</strong> has been confirmed. We can't wait to chat.
          </p>
          <!-- Meeting Card -->
          <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:24px;margin-bottom:28px;\">
            <tr><td>
              <p style=\"color:#141414;font-size:15px;margin:0 0 8px;\"><strong>📅</strong>&nbsp; ${p.date}</p>
              <p style=\"color:#141414;font-size:15px;margin:0 0 8px;\"><strong>🕐</strong>&nbsp; ${p.time} (${p.tzAbbr})</p>
              <p style=\"color:#141414;font-size:15px;margin:0 0 8px;\"><strong>⏱</strong>&nbsp; ${p.duration} minutes</p>
              <p style=\"color:#141414;font-size:15px;margin:0;\"><strong>📹</strong>&nbsp; Zoom Video Call</p>
            </td></tr>
          </table>
          <!-- CTA -->
          <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">
            <tr><td align=\"center\" style=\"padding:4px 0 28px;\">
              <a href=\"${p.zoomJoinUrl}\" target=\"_blank\" style=\"display:inline-block;background-color:#141414;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;\">
                Join Zoom Meeting →
              </a>
            </td></tr>
          </table>
          <p style=\"color:#a1a1aa;font-size:13px;line-height:1.6;margin:0;text-align:center;\">
            Save this email — you'll need the link above to join. If you need to reschedule, reply to this email or call <strong>0459 909 810</strong>.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style=\"padding:24px 40px;text-align:center;\">
          <p style=\"color:#a1a1aa;font-size:11px;margin:0;\">Sited · sited.co · 0459 909 810</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildAdminNotificationEmail(p: { attendeeName: string; attendeeEmail: string; businessName: string; date: string; time: string; duration: number; typeLabel: string; zoomStartUrl: string; phone: string; location: string }): string {
  return `<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"></head>
<body style=\"margin:0;padding:0;background-color:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">
  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#f8f8f8;padding:40px 20px;\">
    <tr><td align=\"center\">
      <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;\">
        <tr><td style=\"background-color:#141414;padding:24px 40px;border-radius:16px 16px 0 0;text-align:center;\">
          <h1 style=\"color:#ffffff;font-size:18px;font-weight:800;margin:0;\">New ${p.typeLabel} 📅</h1>
        </td></tr>
        <tr><td style=\"background-color:#ffffff;padding:32px 40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);\">
          <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:20px;margin-bottom:20px;\">
            <tr><td>
              <p style=\"color:#141414;font-size:14px;margin:0 0 4px;\"><strong>Client:</strong> ${p.attendeeName}</p>
              <p style=\"color:#141414;font-size:14px;margin:0 0 4px;\"><strong>Email:</strong> ${p.attendeeEmail}</p>
              <p style=\"color:#141414;font-size:14px;margin:0 0 4px;\"><strong>Phone:</strong> ${p.phone || 'N/A'}</p>
              <p style=\"color:#141414;font-size:14px;margin:0 0 4px;\"><strong>Business:</strong> ${p.businessName}</p>
              <p style=\"color:#141414;font-size:14px;margin:0 0 4px;\"><strong>Location:</strong> ${p.location || 'N/A'}</p>
              <p style=\"color:#141414;font-size:14px;margin:0 0 4px;\"><strong>Date:</strong> ${p.date}</p>
              <p style=\"color:#141414;font-size:14px;margin:0 0 4px;\"><strong>Time:</strong> ${p.time} (AEST)</p>
              <p style=\"color:#141414;font-size:14px;margin:0;\"><strong>Duration:</strong> ${p.duration} min</p>
            </td></tr>
          </table>
          <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">
            <tr><td align=\"center\">
              <a href=\"${p.zoomStartUrl}\" target=\"_blank\" style=\"display:inline-block;background-color:#141414;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;\">
                Start Meeting →
              </a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { booking_id, topic, start_time, duration, attendee_email, attendee_name, booking_type, business_name, attendee_phone, attendee_timezone, create_lead, business_type, business_location } = body;

    if (!booking_id) throw new Error('booking_id is required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const accessToken = await getZoomAccessToken();
    const meetingDuration = duration || 20;
    const typeLabel = getTypeLabel(booking_type);
    const meetingTopic = topic || `Sited ${typeLabel}`;
    const clientTz = attendee_timezone || 'Australia/Sydney';
    const tzAbbr = getTzAbbr(clientTz);

    // Create Zoom meeting
    const meetingResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: meetingTopic, type: 2, start_time, duration: meetingDuration, timezone: 'Australia/Sydney',
        settings: { host_video: true, participant_video: true, join_before_host: false, waiting_room: true, meeting_authentication: false, auto_recording: 'none' },
      }),
    });

    if (!meetingResponse.ok) throw new Error(`Zoom meeting error [${meetingResponse.status}]: ${await meetingResponse.text()}`);
    const meeting = await meetingResponse.json();

    // Update booking with Zoom details
    await supabase.from('bookings').update({
      zoom_meeting_id: String(meeting.id),
      zoom_meeting_url: meeting.start_url,
      zoom_join_url: meeting.join_url,
    }).eq('id', booking_id);

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const formattedDate = formatDateForTz(start_time, clientTz);
    const formattedTime = formatTimeForTz(start_time, clientTz);
    const adminDate = formatDateForTz(start_time, 'Australia/Sydney');
    const adminTime = formatTimeForTz(start_time, 'Australia/Sydney');
    const firstName = attendee_name?.split(' ')[0] || 'there';

    // 1. Create lead from discovery call booking
    if (create_lead && attendee_email) {
      try {
        const { data: existing } = await supabase.from('leads').select('id').eq('email', attendee_email).maybeSingle();
        if (!existing) {
          await supabase.from('leads').insert({
            name: attendee_name || null,
            email: attendee_email,
            phone: attendee_phone || null,
            business_name: business_name || null,
            project_type: business_type || 'Discovery Call',
            status: 'discovery_call_booked',
            form_data: {
              source: 'booking',
              booking_type: booking_type,
              business_type: business_type || null,
              business_location: business_location || null,
              booking_id: booking_id,
            },
            location: business_location || null,
            industry: business_type || null,
          });
          console.log('Lead created from booking for:', attendee_email);
        } else {
          await supabase.from('leads').update({ status: 'discovery_call_booked' }).eq('id', existing.id);
          console.log('Existing lead updated to discovery_call_booked:', existing.id);
        }
      } catch (leadErr) {
        console.error('Failed to create/update lead:', leadErr);
      }
    }

    // 2. Send confirmation email to client
    if (attendee_email) {
      try {
        await resend.emails.send({
          from: "Sited <hello@sited.co>",
          to: [attendee_email],
          subject: `Your ${typeLabel} is confirmed — ${formattedDate}`,
          html: buildConfirmationEmail({ attendeeName: firstName, date: formattedDate, time: formattedTime, duration: meetingDuration, typeLabel, zoomJoinUrl: meeting.join_url, tzAbbr }),
        });
        await supabase.from('email_logs').insert({
          template_type: 'booking_confirmation', recipient_email: attendee_email,
          recipient_name: attendee_name || null, subject: `Your ${typeLabel} is confirmed`, status: 'sent', sent_at: new Date().toISOString(),
        });
        console.log('Confirmation email sent to:', attendee_email);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }
    }

    // 3. Send admin notification
    try {
      await resend.emails.send({
        from: "Sited <hello@sited.co>",
        to: ["hello@sited.co"],
        subject: `New ${typeLabel} — ${attendee_name || 'Unknown'} (${adminDate})`,
        html: buildAdminNotificationEmail({
          attendeeName: attendee_name || 'Unknown', attendeeEmail: attendee_email || 'N/A',
          businessName: business_name || 'Unknown', date: adminDate, time: adminTime,
          duration: meetingDuration, typeLabel, zoomStartUrl: meeting.start_url,
          phone: attendee_phone || '', location: business_location || '',
        }),
      });
      console.log('Admin notification email sent');
    } catch (adminEmailError) {
      console.error('Failed to send admin notification:', adminEmailError);
    }

    return new Response(JSON.stringify({
      success: true, zoom_join_url: meeting.join_url, zoom_meeting_id: meeting.id,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Zoom meeting creation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
