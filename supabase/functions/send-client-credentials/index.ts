import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ClientCredentialsRequest {
  clientName: string;
  clientEmail: string;
  accessCode: string;
  portalUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-client-credentials function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, clientEmail, accessCode, portalUrl }: ClientCredentialsRequest = await req.json();

    console.log(`Sending credentials to ${clientEmail}`);

    const firstName = clientName ? clientName.split(' ')[0] : 'there';

    const emailResponse = await resend.emails.send({
      from: "Sited <hello@sited.co>",
      to: [clientEmail],
      subject: "Your Client Portal Access Details",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            
            <h1 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">
              Welcome to Your Client Portal
            </h1>
            
            <p style="color: #4b5563; font-size: 16px; margin: 0 0 24px 0;">
              Hi ${firstName},
            </p>
            
            <p style="color: #4b5563; font-size: 16px; margin: 0 0 24px 0;">
              Your client portal is ready! Here you can track your project progress, view updates, manage payments, and submit requests.
            </p>
            
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">
                Your Login Details
              </p>
              <p style="color: #111827; font-size: 16px; margin: 0 0 12px 0;">
                <strong>Email:</strong> ${clientEmail}
              </p>
              <p style="color: #111827; font-size: 16px; margin: 0;">
                <strong>Access Code:</strong> 
                <span style="font-family: monospace; font-size: 20px; font-weight: 700; letter-spacing: 0.1em; color: #2563eb;">${accessCode}</span>
              </p>
            </div>
            
            <a href="${portalUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0;">
              Access Your Portal
            </a>
            
            <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
              If the button above doesn't work, copy and paste this link into your browser:
              <br>
              <a href="${portalUrl}" style="color: #2563eb;">${portalUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This email was sent by Sited. If you didn't expect this email, please ignore it or contact us.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending client credentials email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
