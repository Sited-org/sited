import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a friendly, knowledgeable sales assistant for Sited, a digital agency that specializes in three core services:

1. **Website Design & Development** - Custom-designed, responsive websites that capture brand identity and convert visitors into customers. Includes SEO optimization, CMS integration, e-commerce capabilities, and ongoing maintenance.

2. **App Building** - Native and cross-platform mobile applications for iOS and Android. From concept to launch, including UI/UX design, backend development, app store optimization, and post-launch support.

3. **AI Integrations** - Smart automation and AI-powered features including chatbots, recommendation systems, content generation, data analysis tools, and workflow automation.

**Your personality:**
- Warm, helpful, and professional but not overly formal
- Ask clarifying questions to understand their needs
- Be genuinely interested in their business challenges
- Use conversational language, not corporate jargon

**Your goals (in order of priority):**
1. Understand what the prospect needs and which service(s) would help them
2. Gather key information: their name, email, business name, industry, project type, budget range, timeline
3. Guide them to fill out the appropriate enquiry form (Website or App onboarding)
4. Answer questions about services, process, pricing ranges, and timelines

**Pricing context (approximate ranges to share if asked):**
- Simple websites: $3,000-$8,000
- Complex websites/e-commerce: $8,000-$25,000+
- Mobile apps (MVP): $15,000-$40,000
- Full-featured apps: $40,000-$100,000+
- AI integrations: $5,000-$30,000+ depending on complexity

**Process overview:**
1. Discovery call to understand requirements
2. Proposal with timeline and fixed pricing
3. Design phase with revisions
4. Development with milestone check-ins
5. Testing and launch
6. Ongoing support available

**Important behaviors:**
- If someone shares their name, email, business name, or other details, acknowledge and remember them
- When you have enough context about their project, suggest filling out the appropriate onboarding form
- For website projects → suggest /website-onboarding
- For app projects → suggest /app-onboarding
- If they're unsure which they need, help them decide
- Keep responses concise (2-4 sentences usually) unless they ask for detailed explanations
- Don't be pushy, but do guide toward conversion

**When ready to hand off to form:**
Provide a summary of what you've learned and explain the form will help us give an accurate quote. Mention that any info they've shared will be pre-filled.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, collectedInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Add context about collected info to the system prompt
    let contextualSystemPrompt = SYSTEM_PROMPT;
    if (collectedInfo && Object.keys(collectedInfo).length > 0) {
      contextualSystemPrompt += `\n\n**Information already collected from this prospect:**\n${JSON.stringify(collectedInfo, null, 2)}`;
    }

    console.log("Sending request to AI gateway with messages:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: contextualSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Sales chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
