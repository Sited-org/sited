import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadNotificationRequest {
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  projectType: string;
  formData: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, businessName, projectType, formData }: LeadNotificationRequest = await req.json();

    console.log("Sending lead notification for:", { name, email, projectType });

    // Format form data for email
    const formDataHtml = Object.entries(formData)
      .filter(([_, value]) => value !== "" && value !== null && value !== undefined)
      .map(([key, value]) => {
        const formattedKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());
        const formattedValue = Array.isArray(value) ? value.join(", ") : String(value);
        return `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600; color: #333; width: 200px;">${formattedKey}</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">${formattedValue}</td></tr>`;
      })
      .join("");

    const projectTypeLabel = {
      website: "Website Design & Development",
      app: "Mobile App Development",
      ai: "AI Integration",
    }[projectType] || projectType;

    const emailResponse = await resend.emails.send({
      from: "Sited Leads <onboarding@resend.dev>",
      to: ["andrewguinessfuller@gmail.com"],
      subject: `New ${projectTypeLabel} Lead: ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">New Lead Received</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">${projectTypeLabel}</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 15px; color: #1a1a1a; font-size: 18px;">Contact Information</h2>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #2563eb;">${email}</a></p>
              ${phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${phone}" style="color: #2563eb;">${phone}</a></p>` : ""}
              ${businessName ? `<p style="margin: 5px 0;"><strong>Business:</strong> ${businessName}</p>` : ""}
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h2 style="margin: 0 0 15px; color: #1a1a1a; font-size: 18px;">Form Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                ${formDataHtml}
              </table>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="mailto:${email}?subject=Re: Your ${projectTypeLabel} Project Inquiry" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reply to Lead</a>
            </div>
          </div>
          
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
            This email was sent from your Sited website contact form.
          </p>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-lead-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
