import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MonthlyReportRequest {
  leadId?: string; // Optional - if provided, send to single lead; otherwise send to all active leads
}

function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}

async function generateAIRecommendations(lead: any, transactions: any[], supabaseClient: any): Promise<{ metrics: string; recommendations: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  // Helper to check if a transaction is a real payment (not internal credit)
  const isRealPayment = (t: any): boolean => {
    if (!t.credit || Number(t.credit) <= 0) return false;
    // Credit additions are internal credits, not real payments
    if (t.payment_method === 'credit') return false;
    if (t.item?.toLowerCase().includes('credit added') || t.item?.toLowerCase().includes('account credit')) return false;
    if (t.item?.toLowerCase().includes('write-off') || t.item?.toLowerCase().includes('credit removal')) return false;
    // Real payments: Stripe paid, cash, bank_transfer
    return (
      t.invoice_status === 'paid' || 
      t.payment_method === 'cash' || 
      t.payment_method === 'bank_transfer' ||
      (t.payment_method === 'other' && !t.item?.toLowerCase().includes('credit'))
    );
  };
  
  // Calculate metrics - Revenue = only real payments (Stripe + manual), NOT internal credits
  const totalRevenue = transactions
    .filter(t => t.status === 'completed' && isRealPayment(t))
    .reduce((sum, t) => sum + (t.credit || 0), 0);
  
  const totalExpenses = transactions
    .filter(t => t.debit && t.status === 'completed')
    .reduce((sum, t) => sum + (t.debit || 0), 0);
  
  const metricsHtml = `
    <ul>
      <li><strong>Total Revenue:</strong> $${totalRevenue.toLocaleString()}</li>
      <li><strong>Total Expenses:</strong> $${totalExpenses.toLocaleString()}</li>
      <li><strong>Net:</strong> $${(totalRevenue - totalExpenses).toLocaleString()}</li>
      <li><strong>Project Type:</strong> ${lead.project_type}</li>
    </ul>
  `;

  if (!LOVABLE_API_KEY) {
    return {
      metrics: metricsHtml,
      recommendations: '<p>AI recommendations are currently unavailable.</p>'
    };
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a digital marketing and business growth expert. Provide concise, actionable recommendations for improving a client's online presence and revenue. Keep responses under 200 words with bullet points."
          },
          {
            role: "user",
            content: `Based on this client's business metrics, provide 3-5 specific recommendations for landing pages, ads, or marketing strategies:

Business: ${lead.business_name || 'Unknown'}
Project Type: ${lead.project_type}
Monthly Revenue: $${totalRevenue}
Monthly Expenses: $${totalExpenses}
Net: $${totalRevenue - totalExpenses}

Provide recommendations in HTML format with bullet points (<ul><li>).`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return {
        metrics: metricsHtml,
        recommendations: '<p>Based on your metrics, consider expanding your digital presence with targeted advertising.</p>'
      };
    }

    const data = await response.json();
    const recommendations = data.choices?.[0]?.message?.content || '<p>No recommendations available.</p>';

    return { metrics: metricsHtml, recommendations };
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return {
      metrics: metricsHtml,
      recommendations: '<p>Based on your metrics, consider expanding your digital presence with targeted advertising.</p>'
    };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { leadId }: MonthlyReportRequest = await req.json();
    console.log("Sending monthly report", leadId ? `for lead: ${leadId}` : "to all active leads");

    // Check if automation is enabled
    const { data: automation } = await supabaseClient
      .from('email_automations')
      .select('*')
      .eq('automation_type', 'monthly_report')
      .single();

    if (!automation?.is_enabled) {
      console.log("Monthly report automation is disabled");
      return new Response(JSON.stringify({ message: "Automation disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the template
    const { data: template } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('template_type', 'monthly_report')
      .single();

    if (!template?.is_enabled) {
      console.log("Monthly report template is disabled");
      return new Response(JSON.stringify({ message: "Template disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get leads to send to
    let leadsQuery = supabaseClient.from('leads').select('*');
    if (leadId) {
      leadsQuery = leadsQuery.eq('id', leadId);
    } else {
      // Only send to leads with status 'sold' (active clients)
      leadsQuery = leadsQuery.eq('status', 'sold');
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      throw new Error(`Failed to fetch leads: ${leadsError.message}`);
    }

    if (!leads || leads.length === 0) {
      return new Response(JSON.stringify({ message: "No leads to send to" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const results = [];

    for (const lead of leads) {
      try {
        // Get transactions for this lead from the last month
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const { data: transactions } = await supabaseClient
          .from('transactions')
          .select('*')
          .eq('lead_id', lead.id)
          .gte('transaction_date', oneMonthAgo.toISOString());

        // Generate AI recommendations
        const { metrics, recommendations } = await generateAIRecommendations(lead, transactions || [], supabaseClient);

        // Prepare template variables
        const variables = {
          name: lead.name || 'there',
          email: lead.email,
          business_name: lead.business_name || 'your business',
          month: currentMonth,
          metrics_summary: metrics,
          ai_recommendations: recommendations,
        };

        // Replace template variables
        const subject = replaceTemplateVariables(template.subject, variables);
        const bodyHtml = replaceTemplateVariables(template.body_html, variables);

        // Send email
        const emailResponse = await resend.emails.send({
          from: "Sited <hello@sited.co>",
          to: [lead.email],
          subject: subject,
          html: bodyHtml,
        });

        console.log("Monthly report sent to:", lead.email);

        // Log the email
        await supabaseClient.from('email_logs').insert({
          template_type: 'monthly_report',
          recipient_email: lead.email,
          recipient_name: lead.name,
          lead_id: lead.id,
          subject: subject,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        results.push({ email: lead.email, success: true });
      } catch (leadError: any) {
        console.error(`Error sending to ${lead.email}:`, leadError);
        results.push({ email: lead.email, success: false, error: leadError.message });
      }
    }

    // Update last_run_at
    await supabaseClient
      .from('email_automations')
      .update({ last_run_at: new Date().toISOString() })
      .eq('automation_type', 'monthly_report');

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending monthly reports:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
