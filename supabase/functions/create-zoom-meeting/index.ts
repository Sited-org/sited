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

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Zoom credentials not configured');
  }

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
    throw new Error(`Failed to get Zoom access token [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Australia/Sydney',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'Australia/Sydney',
  });
}

function getTypeLabel(bookingType: string): string {
  return bookingType === 'plan' ? 'Plan Call' : 'Discovery Call';
}

function buildConfirmationEmail(p: {
  attendeeName: string; date: string; time: string; duration: number; typeLabel: string; zoomJoinUrl: string;
}): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background-color:#0066FF;padding:32px 40px;text-align:center;">
          <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.5px;">SITED</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px;">You're booked in! ✅</h2>
          <p style="color:#71717a;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Hey ${p.attendeeName}, your <strong>${p.typeLabel}</strong> has been confirmed.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;border-radius:12px;padding:24px;margin-bottom:24px;">
            <tr><td>
              <p style="color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;font-weight:600;">Meeting Details</p>
              <p style="color:#18181b;font-size:15px;margin:0 0 6px;"><strong>📅 Date:</strong> ${p.date}</p>
              <p style="color:#18181b;font-size:15px;margin:0 0 6px;"><strong>🕐 Time:</strong> ${p.time} (AEST)</p>
              <p style="color:#18181b;font-size:15px;margin:0 0 6px;"><strong>⏱ Duration:</strong> ${p.duration} minutes</p>
              <p style="color:#18181b;font-size:15px;margin:0;"><strong>📹 Format:</strong> Zoom Video Call</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${p.zoomJoinUrl}" target="_blank" style="display:inline-block;background-color:#0066FF;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;">
                Join Zoom Meeting →
              </a>
            </td></tr>
          </table>
          <p style="color:#71717a;font-size:14px;line-height:1.6;margin:0 0 8px;">
            Save this email — you'll need the link above to join the call. If you need to reschedule, reply to this email or call us on <strong>0459 909 810</strong>.
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #e4e4e7;text-align:center;">
          <p style="color:#a1a1aa;font-size:12px;margin:0;">Sited · sited.com.au · 0459 909 810</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildAdminNotificationEmail(p: {
  attendeeName: string; attendeeEmail: string; businessName: string;
  date: string; time: string; duration: number; typeLabel: string; zoomStartUrl: string;
}): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background-color:#18181b;padding:24px 40px;text-align:center;">
          <h1 style="color:#ffffff;font-size:18px;font-weight:800;margin:0;">New Booking 📅</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="color:#71717a;font-size:14px;margin:0 0 20px;">A new <strong>${p.typeLabel}</strong> has been booked.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;border-radius:12px;padding:20px;margin-bottom:20px;">
            <tr><td>
              <p style="color:#18181b;font-size:14px;margin:0 0 4px;"><strong>Client:</strong> ${p.attendeeName}</p>
              <p style="color:#18181b;font-size:14px;margin:0 0 4px;"><strong>Email:</strong> ${p.attendeeEmail}</p>
              <p style="color:#18181b;font-size:14px;margin:0 0 4px;"><strong>Business:</strong> ${p.businessName}</p>
              <p style="color:#18181b;font-size:14px;margin:0 0 4px;"><strong>Date:</strong> ${p.date}</p>
              <p style="color:#18181b;font-size:14px;margin:0 0 4px;"><strong>Time:</strong> ${p.time} (AEST)</p>
              <p style="color:#18181b;font-size:14px;margin:0;"><strong>Duration:</strong> ${p.duration} min</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${p.zoomStartUrl}" target="_blank" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;">
                Start Zoom Meeting →
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, topic, start_time, duration, attendee_email, attendee_name, booking_type, business_name } = await req.json();

    if (!booking_id) throw new Error('booking_id is required');

    const accessToken = await getZoomAccessToken();
    const meetingDuration = duration || 20;
    const typeLabel = getTypeLabel(booking_type);
    const meetingTopic = topic || `Sited ${typeLabel}`;

    // Create Zoom meeting
    const meetingResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: meetingTopic,
        type: 2,
        start_time,
        duration: meetingDuration,
        timezone: 'Australia/Sydney',
        settings: {
          host_video: true, participant_video: true,
          join_before_host: false, waiting_room: true,
          meeting_authentication: false, auto_recording: 'none',
        },
      }),
    });

    if (!meetingResponse.ok) {
      const errorText = await meetingResponse.text();
      throw new Error(`Failed to create Zoom meeting [${meetingResponse.status}]: ${errorText}`);
    }

    const meeting = await meetingResponse.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update booking with Zoom details
    await supabase.from('bookings').update({
      zoom_meeting_id: String(meeting.id),
      zoom_meeting_url: meeting.start_url,
      zoom_join_url: meeting.join_url,
    }).eq('id', booking_id);

    // Fetch booking details for admin email (business name etc)
    let bookingBusinessName = business_name || '';
    if (!bookingBusinessName) {
      const { data: bookingRow } = await supabase.from('bookings').select('business_name').eq('id', booking_id).single();
      bookingBusinessName = bookingRow?.business_name || 'Unknown';
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const formattedDate = formatDate(start_time);
    const formattedTime = formatTime(start_time);
    const firstName = attendee_name?.split(' ')[0] || 'there';

    // 1. Send branded confirmation email to client
    if (attendee_email) {
      try {
        const emailHtml = buildConfirmationEmail({
          attendeeName: firstName,
          date: formattedDate,
          time: formattedTime,
          duration: meetingDuration,
          typeLabel,
          zoomJoinUrl: meeting.join_url,
        });

        await resend.emails.send({
          from: "Sited <hello@sited.co>",
          to: [attendee_email],
          subject: `Your ${typeLabel} is confirmed — ${formattedDate}`,
          html: emailHtml,
        });

        await supabase.from('email_logs').insert({
          template_type: 'booking_confirmation',
          recipient_email: attendee_email,
          recipient_name: attendee_name || null,
          subject: `Your ${typeLabel} is confirmed`,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        console.log('Booking confirmation email sent to:', attendee_email);
      } catch (emailError) {
        console.error('Failed to send client confirmation email:', emailError);
      }
    }

    // 2. Send admin notification email
    try {
      const adminHtml = buildAdminNotificationEmail({
        attendeeName: attendee_name || 'Unknown',
        attendeeEmail: attendee_email || 'N/A',
        businessName: bookingBusinessName,
        date: formattedDate,
        time: formattedTime,
        duration: meetingDuration,
        typeLabel,
        zoomStartUrl: meeting.start_url,
      });

      await resend.emails.send({
        from: "Sited <hello@sited.co>",
        to: ["hello@sited.co"],
        subject: `New ${typeLabel} — ${attendee_name || 'Unknown'} (${formattedDate})`,
        html: adminHtml,
      });

      console.log('Admin notification email sent');
    } catch (adminEmailError) {
      console.error('Failed to send admin notification email:', adminEmailError);
    }

    return new Response(JSON.stringify({
      success: true,
      zoom_join_url: meeting.join_url,
      zoom_meeting_id: meeting.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Zoom meeting creation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
