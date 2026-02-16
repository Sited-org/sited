import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_MESSAGES: Record<string, string> = {
  "25": "Great news! We are making solid progress on your project. The foundations are being laid and things are coming together nicely.",
  "50": "We are halfway there! Your project is taking shape and we are excited about the progress. Keep an eye out for updates!",
  "75": "We are on the home stretch! Progress is being made hourly, please keep on the lookout for emails from us if there is information we may need to gather for integrations, etc!",
  "100": "Your project is complete! We are thrilled with the final result and hope you are too. Welcome to your new digital home!",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { lead_id, progress } = await req.json();

    if (!lead_id || progress === undefined) {
      return new Response(
        JSON.stringify({ error: "lead_id and progress are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get automation settings
    const { data: automation } = await supabaseClient
      .from('email_automations')
      .select('*')
      .eq('automation_type', 'milestone_progress')
      .maybeSingle();

    if (!automation?.is_enabled) {
      return new Response(
        JSON.stringify({ success: false, reason: "Milestone emails are disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const settings = (automation.settings || {}) as Record<string, any>;
    const milestones: number[] = settings.milestones || [25, 50, 75, 100];
    const messages: Record<string, string> = settings.messages || DEFAULT_MESSAGES;

    // Check if this progress hits a milestone
    const milestone = milestones.find(m => m === progress);
    if (!milestone) {
      return new Response(
        JSON.stringify({ success: false, reason: "Not a milestone" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if we already sent this milestone email
    const { data: existingLog } = await supabaseClient
      .from('email_logs')
      .select('id')
      .eq('lead_id', lead_id)
      .eq('template_type', 'milestone_progress')
      .eq('subject', `${progress}% Complete!`)
      .limit(1)
      .maybeSingle();

    if (existingLog) {
      return new Response(
        JSON.stringify({ success: false, reason: "Already sent this milestone email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lead info
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('id, name, email, business_name')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get template
    const { data: template } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('template_type', 'milestone_progress')
      .eq('is_enabled', true)
      .maybeSingle();

    if (!template) {
      return new Response(
        JSON.stringify({ error: "Milestone template not found or disabled" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const milestoneMessage = messages[String(milestone)] || DEFAULT_MESSAGES[String(milestone)] || "Your project is progressing!";
    const clientName = lead.name || lead.business_name || 'there';

    // Replace template variables
    const subject = template.subject
      .replace(/\{\{progress\}\}/g, String(progress))
      .replace(/\{\{name\}\}/g, clientName);

    const bodyHtml = template.body_html
      .replace(/\{\{progress\}\}/g, String(progress))
      .replace(/\{\{name\}\}/g, clientName)
      .replace(/\{\{milestone_message\}\}/g, milestoneMessage)
      .replace(/\{\{business_name\}\}/g, lead.business_name || '')
      .replace(/\{\{email\}\}/g, lead.email);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Sited <hello@sited.co>",
      to: [lead.email],
      subject,
      html: bodyHtml,
    });

    console.log("Milestone email sent:", emailResponse);

    // Log the email
    await supabaseClient.from('email_logs').insert({
      template_type: 'milestone_progress',
      recipient_email: lead.email,
      recipient_name: clientName,
      lead_id: lead.id,
      subject,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    // Update automation last_run_at
    await supabaseClient
      .from('email_automations')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', automation.id);

    return new Response(
      JSON.stringify({ success: true, milestone: progress }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-milestone-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
