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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle GET requests (from email CTA click)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const clientId = url.searchParams.get("clientId");
      const analysisType = url.searchParams.get("type");

      if (!clientId || !analysisType) {
        return new Response("Invalid request parameters.", { status: 400 });
      }

      // Fetch client info
      const { data: client } = await supabase
        .from("leads")
        .select("id, name, email, business_name")
        .eq("id", clientId)
        .single();

      if (!client) {
        return new Response("Client not found.", { status: 404 });
      }

      // Fetch the most recent analysis for this client + type
      const { data: report } = await supabase
        .from("analysis_reports")
        .select("analysis_content")
        .eq("lead_id", clientId)
        .eq("analysis_type", analysisType)
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const typeLabel = ANALYSIS_TYPE_LABELS[analysisType] || analysisType;

      // Create the client request
      await supabase.from("client_requests").insert({
        lead_id: clientId,
        title: `${typeLabel} — Implementation Request`,
        description: report?.analysis_content
          ? `Client requested implementation of ${typeLabel} recommendations. Analysis summary:\n\n${report.analysis_content.slice(0, 500)}...`
          : `Client requested implementation of ${typeLabel} recommendations.`,
        priority: "normal",
        status: "pending",
        request_source: "analysis",
        analysis_type: analysisType,
      });

      // Send confirmation email to client
      if (RESEND_API_KEY && client.email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Sited <team@sited.co>",
            to: [client.email],
            subject: "We've received your request — Sited",
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #1E3A5F; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">SITED</h1>
              </div>
              <div style="padding: 30px; background-color: #FFFFFF;">
                <p>Hi ${client.name || "there"},</p>
                <p>We've received your request to implement our <strong>${typeLabel}</strong> recommendations for <strong>${client.business_name || "your website"}</strong>.</p>
                <p>Our team will review this and be in touch within 1 business day.</p>
                <p style="margin-top: 30px;">Kind regards,<br><strong>The Sited Team</strong></p>
              </div>
              <div style="padding: 20px; text-align: center; font-size: 12px; color: #718096;">
                <p>© 2026 Sited · <a href="https://sited.co" style="color: #2563EB;">sited.co</a></p>
              </div>
            </div>`,
          }),
        });
      }

      // Redirect to a thank you page
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Request Received</title></head>
        <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #F8F9FA; margin: 0;">
          <div style="text-align: center; background: white; padding: 60px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); max-width: 500px;">
            <div style="font-size: 48px; margin-bottom: 20px;">✓</div>
            <h1 style="color: #1E3A5F; margin: 0 0 16px;">Request Received!</h1>
            <p style="color: #4A5568; font-size: 16px; line-height: 1.6;">We've received your implementation request. Our team will review this and be in touch within 1 business day.</p>
            <p style="margin-top: 24px;"><a href="https://sited.co" style="color: #2563EB; font-weight: bold;">← Back to Sited</a></p>
          </div>
        </body></html>`,
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (e) {
    console.error("request-analysis-action error:", e);
    return new Response(`Error: ${(e as Error).message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
