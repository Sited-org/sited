import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  seo: "SEO Analysis",
  infrastructure: "Infrastructure Analysis",
  marketing: "Marketing Strategy",
};

function buildEmailHtml(
  clientName: string,
  businessName: string,
  domain: string,
  analysisType: string,
  analysisContent: string,
  actionLink: string
): string {
  // Convert plain text analysis to HTML paragraphs
  const htmlContent = analysisContent
    .split("\n\n")
    .map((p) => `<p style="margin: 0 0 12px 0;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1A202C; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1E3A5F; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">SITED</h1>
    <p style="color: #93C5FD; margin: 10px 0 0 0; font-size: 14px;">Your Monthly Website Analysis</p>
  </div>
  <div style="background-color: #F8F9FA; padding: 30px; border-left: 4px solid #2563EB;">
    <p style="margin: 0 0 10px 0; font-size: 16px;">Hi ${clientName},</p>
    <p style="margin: 0; font-size: 16px;">Here is your monthly ${analysisType} for <strong>${businessName}</strong> (${domain}).</p>
  </div>
  <div style="padding: 30px; background-color: #FFFFFF;">
    <h2 style="color: #1E3A5F; font-size: 20px; margin: 0 0 20px 0;">What We Found</h2>
    <div style="font-size: 15px; line-height: 1.8; color: #4A5568;">${htmlContent}</div>
  </div>
  <div style="background-color: #EFF6FF; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #1E3A5F;">Want us to implement these changes for you?</p>
    <a href="${actionLink}" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Request Implementation →</a>
    <p style="margin: 20px 0 0 0; font-size: 13px; color: #4A5568;">This will send your request directly to your Sited team.</p>
  </div>
  <div style="padding: 20px; text-align: center; font-size: 12px; color: #718096;">
    <p style="margin: 0 0 10px 0;">Built Fast. Monitored Always. Improved Every Month.</p>
    <p style="margin: 0;">© 2026 Sited. Your digital presence, looked after properly.</p>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    // Verify admin
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) throw new Error("Admin access required");

    const { reports } = await req.json();
    if (!reports?.length) throw new Error("No reports to send");

    // Build the base URL for the action request link
    const siteUrl = Deno.env.get("SUPABASE_URL")!;

    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const report of reports) {
      try {
        const analysisTypeLabel = ANALYSIS_TYPE_LABELS[report.analysisType] || report.analysisType;

        // Create a signed action link via edge function URL
        const actionLink = `${siteUrl}/functions/v1/request-analysis-action?clientId=${encodeURIComponent(report.clientId)}&type=${encodeURIComponent(report.analysisType)}`;

        const subject = `Your Sited Monthly Report — ${analysisTypeLabel} for ${report.businessName}`;

        const html = buildEmailHtml(
          report.clientName || "there",
          report.businessName,
          report.domain || "",
          analysisTypeLabel,
          report.analysis,
          actionLink
        );

        const emailResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Sited <team@sited.co>",
            to: [report.email],
            subject,
            html,
          }),
        });

        if (!emailResp.ok) {
          const errText = await emailResp.text();
          throw new Error(`Resend error: ${errText}`);
        }

        // Update analysis_reports with sent timestamp
        if (report.reportId) {
          await supabase
            .from("analysis_reports")
            .update({ email_sent_at: new Date().toISOString() })
            .eq("id", report.reportId);
        }

        // Log email
        await supabase.from("email_logs").insert({
          lead_id: report.clientId,
          recipient_email: report.email,
          recipient_name: report.clientName,
          subject,
          template_type: "analysis_report",
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        results.sent++;
      } catch (e) {
        results.failed++;
        results.errors.push(`${report.businessName}: ${(e as Error).message}`);
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-analysis-emails error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
