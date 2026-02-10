import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestTitle, requestDescription, requestBody, leadId } = await req.json();

    if (!requestTitle) {
      return new Response(
        JSON.stringify({ error: 'Request title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get client website URL from the lead profile
    let websiteUrl = '';
    if (leadId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: lead } = await supabase
        .from('leads')
        .select('website_url, business_name')
        .eq('id', leadId)
        .single();

      if (lead?.website_url) {
        websiteUrl = lead.website_url;
      }
    }

    // Strip HTML from body
    const plainBody = requestBody
      ? requestBody.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
      : '';

    console.log(`Generating prompt for request: "${requestTitle}", website: ${websiteUrl || 'none'}`);

    // Build the AI prompt to generate a Lovable prompt
    const systemPrompt = `You are an expert at creating precise, actionable Lovable.dev prompts for website modifications. You generate prompts that are clear, specific, and focused on implementation.

Rules:
- Do NOT mention "client" or any client-specific information
- Do NOT include business names
- Focus purely on the technical implementation requested
- Be specific about what needs to change
- If a website URL is provided, consider the context of the existing site when formulating the prompt
- The prompt should be ready to paste directly into Lovable.dev`;

    const userMessage = `Based on the following request information, create a detailed Lovable.dev prompt for implementing the requested changes:

REQUEST TITLE: ${requestTitle}
${requestDescription ? `\nDESCRIPTION: ${requestDescription}` : ''}
${plainBody ? `\nDETAILED CONTENT:\n${plainBody}` : ''}
${websiteUrl ? `\nEXISTING WEBSITE: ${websiteUrl}\nResearch and consider the existing website structure, design, and functionality when creating the prompt.` : ''}

Generate a comprehensive Lovable.dev prompt that:
1. Clearly describes what needs to be implemented or changed
2. Provides specific technical guidance where relevant
3. Considers the existing website context if provided
4. Is actionable and ready to use

The prompt MUST end with exactly this paragraph:
"Do not compromise current functionality, ensure all current & newly integrated function work seamlessly with the website. - Use current design guidelines likewise seen across the rest of the website to implement the above changes"`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate prompt');
    }

    const data = await response.json();
    const generatedPrompt = data.choices?.[0]?.message?.content || '';

    console.log('Prompt generated successfully');

    return new Response(
      JSON.stringify({ prompt: generatedPrompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-request-prompt:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
