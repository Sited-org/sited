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

const ANALYSIS_TYPE_EMOJI: Record<string, string> = {
  seo: "🔍",
  infrastructure: "🏗️",
  marketing: "📈",
};

/**
 * Convert markdown-style formatting to HTML:
 * **bold** → <strong>bold</strong>
 * *italic* → <em>italic</em>
 * __underline__ → <u>underline</u>
 */
function formatAnalysisToHtml(text: string): string {
  // Split by double newlines into paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map(p => {
    let html = p.trim();
    if (!html) return '';
    
    // Convert markdown bold **text** to <strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Convert markdown italic *text* to <em> (but not inside strong tags)
    html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
    // Convert __underline__ to <u>
    html = html.replace(/__(.+?)__/g, '<u>$1</u>');
    // Convert single newlines to <br>
    html = html.replace(/\n/g, '<br>');
    
    // Check if this is a heading line (starts with emoji or strong tag)
    if (html.startsWith('<strong>') && html.includes('</strong>') && html.length < 200) {
      return `<h3 style="color: #1A1A1A; font-size: 17px; margin: 24px 0 8px 0; font-weight: 700;">${html}</h3>`;
    }
    
    return `<p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.7; color: #333333;">${html}</p>`;
  }).filter(Boolean).join('\n');
}

function buildEmailHtml(
  clientName: string,
  businessName: string,
  domain: string,
  analysisType: string,
  analysisTypeKey: string,
  analysisContent: string,
  actionLink: string
): string {
  const emoji = ANALYSIS_TYPE_EMOJI[analysisTypeKey] || "📊";
  const htmlContent = formatAnalysisToHtml(analysisContent);

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1A1A1A; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F5F5;">
  
  <!-- Header with Sited branding -->
  <div style="background-color: #000000; padding: 32px 30px; text-align: center;">
    <div style="margin-bottom: 8px;">
      <span style="display: inline-block; width: 40px; height: 40px; background-color: #FFFFFF; border-radius: 8px; line-height: 40px; font-size: 20px; font-weight: 800; color: #000000; font-family: -apple-system, sans-serif;">S</span>
    </div>
    <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 2px;">SITED</h1>
    <p style="color: #999999; margin: 6px 0 0 0; font-size: 13px; letter-spacing: 0.5px;">Monthly Website Analysis</p>
  </div>

  <!-- Greeting -->
  <div style="background-color: #FFFFFF; padding: 28px 30px; border-bottom: 1px solid #E5E5E5;">
    <p style="margin: 0 0 8px 0; font-size: 16px; color: #1A1A1A;">Hi <strong>${clientName}</strong> 👋</p>
    <p style="margin: 0; font-size: 15px; color: #555555;">Here is your monthly <strong>${emoji} ${analysisType}</strong> for <strong>${businessName}</strong> (${domain}).</p>
  </div>

  <!-- Analysis Content + CTA -->
  <div style="padding: 28px 30px; background-color: #FFFFFF;">
    <h2 style="color: #000000; font-size: 18px; margin: 0 0 20px 0; font-weight: 700; border-bottom: 2px solid #000000; padding-bottom: 10px;">📋 What We Found</h2>
    <div style="font-size: 15px; line-height: 1.8; color: #333333;">${htmlContent}</div>
    
    <!-- CTA directly after content to avoid email clipping -->
    <div style="margin-top: 28px; padding-top: 24px; border-top: 1px solid #E5E5E5; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 17px; color: #1A1A1A; font-weight: 600;">🚀 Want us to implement these changes?</p>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #666666;">Click below and our team will get started.</p>
      <a href="${actionLink}" style="display: inline-block; background-color: #000000; color: #FFFFFF; padding: 14px 36px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">Request Implementation →</a>
    </div>
  </div>

  <!-- Footer -->
  <div style="padding: 24px 30px; text-align: center; font-size: 12px; color: #999999; background-color: #000000;">
    <p style="margin: 0 0 6px 0; color: #CCCCCC; font-weight: 500;">Built Fast. Monitored Always. Improved Every Month.</p>
    <p style="margin: 0; color: #666666;">© 2026 Sited · <a href="https://sited.co" style="color: #999999;">sited.co</a></p>
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

    // Build the edge function URL for the CTA (creates draft + redirects to portal)
    const edgeFunctionBaseUrl = `${supabaseUrl}/functions/v1/request-analysis-action`;

    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const report of reports) {
      try {
        const analysisTypeLabel = ANALYSIS_TYPE_LABELS[report.analysisType] || report.analysisType;

        // CTA links to edge function which creates draft then redirects to portal login
        const actionLink = `${edgeFunctionBaseUrl}?type=${encodeURIComponent(report.analysisType)}&clientId=${encodeURIComponent(report.clientId)}`;

        const subject = `${ANALYSIS_TYPE_EMOJI[report.analysisType] || "📊"} Your Sited Monthly Report — ${analysisTypeLabel} for ${report.businessName}`;

        const html = buildEmailHtml(
          report.clientName || "there",
          report.businessName,
          report.domain || "",
          analysisTypeLabel,
          report.analysisType,
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
