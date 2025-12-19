import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessName, location, industry, website, details } = await req.json();

    if (!businessName || !location || !industry) {
      return new Response(
        JSON.stringify({ error: 'Business name, location, and industry are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Researching business: ${businessName} in ${location}, Industry: ${industry}`);

    // First, use AI to research the business
    const researchPrompt = `You are a business research assistant. Research and provide detailed information about "${businessName}" located in ${location} in the ${industry} industry.
${website ? `Their website is: ${website}` : 'They do not have a website.'}

Search for and compile:
1. What services/products this type of ${industry} business typically offers in ${location}
2. Common customer pain points in this industry
3. What makes businesses in this industry stand out
4. Local market considerations for ${location}
5. Industry-specific design trends and expectations
6. Typical customer demographics and what appeals to them
7. Key selling points that work for ${industry} businesses
8. Any specific regulations or certifications common in this industry

Provide a comprehensive but concise research summary that can be used to create a highly targeted website.`;

    const researchResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert business researcher who helps create targeted marketing materials. Provide actionable insights based on industry knowledge and best practices.' },
          { role: 'user', content: researchPrompt }
        ],
      }),
    });

    if (!researchResponse.ok) {
      const errorText = await researchResponse.text();
      console.error('Research API error:', researchResponse.status, errorText);
      throw new Error('Failed to research business');
    }

    const researchData = await researchResponse.json();
    const researchInsights = researchData.choices?.[0]?.message?.content || '';

    console.log('Research complete, generating prompt...');

    // Now generate the Lovable prompt using the research
    const promptGenerationRequest = `Based on the following business research, create a detailed and compelling Lovable.dev prompt to generate a professional website.

BUSINESS DETAILS:
- Business Name: ${businessName}
- Location: ${location}
- Industry: ${industry}
${website ? `- Current Website: ${website}` : '- No existing website'}
${details ? `\nSALESPERSON NOTES:\n${details}` : ''}

RESEARCH INSIGHTS:
${researchInsights}

Create a comprehensive Lovable.dev prompt that:
1. Creates a stunning, industry-appropriate website
2. Incorporates the research insights to make the content highly relevant
3. Uses industry-specific terminology and appeals to the target demographic
4. Includes sections that address common customer pain points
5. Has strong calls-to-action relevant to the ${industry} industry
6. Is mobile-responsive and modern
7. Includes specific content suggestions based on the research
${details ? `8. Incorporates the salesperson's notes: ${details}` : ''}

Format the prompt ready to be copied and pasted into Lovable.dev. Make it detailed and specific, not generic.`;

    const promptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert at creating Lovable.dev prompts that generate beautiful, high-converting websites. Your prompts are detailed, specific, and result in professional websites that impress clients.' },
          { role: 'user', content: promptGenerationRequest }
        ],
      }),
    });

    if (!promptResponse.ok) {
      const errorText = await promptResponse.text();
      console.error('Prompt generation API error:', promptResponse.status, errorText);
      throw new Error('Failed to generate prompt');
    }

    const promptData = await promptResponse.json();
    const generatedPrompt = promptData.choices?.[0]?.message?.content || '';

    console.log('Prompt generated successfully');

    return new Response(
      JSON.stringify({ 
        prompt: generatedPrompt,
        research: researchInsights 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-sales-prompt:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
