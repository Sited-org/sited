import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceItem {
  item: string;
  amount: number;
  date: string;
  notes?: string;
}

interface SendInvoiceRequest {
  clientEmail: string;
  clientName: string;
  businessName?: string;
  items: InvoiceItem[];
  totalAmount: number;
  balanceDue: number;
  invoiceNumber: string;
  dueDate?: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send invoice function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body: SendInvoiceRequest = await req.json();
    console.log("Invoice request for:", body.clientEmail);

    const { clientEmail, clientName, businessName, items, totalAmount, balanceDue, invoiceNumber, dueDate, notes } = body;

    // Generate items HTML
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.date}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.item}${item.notes ? `<br><span style="font-size: 12px; color: #6b7280;">${item.notes}</span>` : ''}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.amount.toLocaleString()}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 28px; font-weight: bold; margin: 0; color: #111827;">INVOICE</h1>
                <p style="color: #6b7280; margin: 8px 0 0 0;">#${invoiceNumber}</p>
              </div>
              
              <div style="margin-bottom: 32px;">
                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Billed to:</p>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${clientName}</p>
                ${businessName ? `<p style="margin: 4px 0 0 0; color: #374151;">${businessName}</p>` : ''}
                <p style="margin: 4px 0 0 0; color: #374151;">${clientEmail}</p>
              </div>

              ${dueDate ? `
              <div style="margin-bottom: 32px;">
                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Due Date:</p>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${dueDate}</p>
              </div>
              ` : ''}

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Date</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Description</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div style="border-top: 2px solid #111827; padding-top: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #6b7280;">Total Charged:</span>
                  <span style="font-weight: 600;">$${totalAmount.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 16px; background-color: #fef3c7; border-radius: 8px; margin-top: 16px;">
                  <span style="font-weight: 600; color: #92400e;">Balance Due:</span>
                  <span style="font-size: 24px; font-weight: bold; color: #92400e;">$${balanceDue.toLocaleString()}</span>
                </div>
              </div>

              ${notes ? `
              <div style="margin-top: 32px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #374151;">Notes:</p>
                <p style="margin: 0; color: #6b7280;">${notes}</p>
              </div>
              ` : ''}

              <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 14px;">
                <p style="margin: 0;">Thank you for your business!</p>
                <p style="margin: 8px 0 0 0;">Sited</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Sited <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `Invoice #${invoiceNumber} from Sited`,
      html: emailHtml,
    });

    console.log("Invoice email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error sending invoice:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
