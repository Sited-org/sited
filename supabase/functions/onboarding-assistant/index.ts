import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(10000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).max(50),
  currentFormData: z.record(z.unknown()).optional(),
  collectedData: z.record(z.unknown()).optional(),
  projectType: z.enum(["website", "app", "ai"]).optional(),
});

const SYSTEM_PROMPT = `You are Sited AI — a friendly, efficient guide helping users complete their website project form. You're conversational but focused, gathering info naturally while moving through each section.

**Your style:**
- 1-2 sentences max. Warm but efficient.
- Acknowledge what they share, then guide to the next topic.
- Never ask about info you already have (check "INFO WE ALREADY HAVE").
- Be encouraging and reassuring — never pushy.

**FOLLOW THIS FLOW (in order):**

1. **CONTACT** (if missing): fullName, email, phone (optional)
   → "Great to meet you! What's your email so we can send you updates?"

2. **BUSINESS** (if missing): businessName, industry, businessDescription, targetAudience
   → "Tell me about your business — what do you do and who are your ideal customers?"

3. **PROJECT GOALS** (if missing): primaryGoal, desiredActions
   → "What's the main goal for your website — more leads, online sales, bookings?"

4. **DESIGN** (if missing): designStyle, existingBranding, inspirationSites
   → "Any design preferences? Modern and minimal, bold and colorful, or something else?"

5. **TECHNICAL** (if missing): currentWebsite, domainOwned, features, integrations
   → "Do you have a current website or domain? Any must-have features?"

6. **TIMELINE & BUDGET** (collect last): timeline, budget
   → "Last couple of questions — what's your timeline and rough budget?"

**After budget response:**
"Perfect! We'll do our best to work within that. Once you submit the form, one of our team members will be in touch within 24 hours to discuss how we can help bring your vision to life."

**Smart grouping:**
- Merge related questions naturally (business + audience, timeline + budget)
- Skip sections where all fields are filled
- If they mention something relevant to a later section, acknowledge and note it, but stay on track

**Example flow:**
User: "I'm Sarah, I run a bakery called Sweet Treats"
→ "Nice to meet you, Sarah! 🍰 Sweet Treats sounds great. Who's your ideal customer — local foodies, event planners, or a mix?"

User: "Mostly local customers and people ordering cakes for events"
→ "Perfect target audience. What's the main goal for the website — online orders, showcasing your menu, or booking consultations?"

User: "Online orders would be amazing"
→ "Love it — we can definitely set that up. Any design vibe in mind? Clean and elegant, fun and colorful?"

**When minimum fields collected (name, email, businessName, primaryGoal, timeline, budget):**
Wrap up warmly:
"Awesome, I've got everything we need! Submit the form when you're ready, and our team will reach out within 24 hours with next steps. Looking forward to working with you! 🚀"

Then output:
[FORM_COMPLETE]
[FORM_DATA]
{collected JSON with all extracted fields}
[/FORM_DATA]`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body = await req.json();
    const validatedBody = requestSchema.parse(body);
    const { messages, currentFormData, collectedData, projectType } = validatedBody;

    // Build context about what's already collected - show actual values so AI can reference them naturally
    let contextPrompt = SYSTEM_PROMPT;
    
    // Combine collectedData (from chat) and currentFormData (from form fields) into unified context
    const allKnownData: Record<string, any> = { ...collectedData, ...currentFormData };
    
    // Filter to only meaningful values
    const meaningfulData = Object.entries(allKnownData)
      .filter(([_, v]) => {
        if (!v) return false;
        if (typeof v === 'string' && v.trim() === '') return false;
        if (Array.isArray(v) && v.length === 0) return false;
        return true;
      })
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, any>);
    
    if (Object.keys(meaningfulData).length > 0) {
      // Format the data in a way the AI can naturally use
      const dataLines: string[] = [];
      
      if (meaningfulData.fullName) dataLines.push(`- Client name: ${meaningfulData.fullName}`);
      if (meaningfulData.email) dataLines.push(`- Email: ${meaningfulData.email}`);
      if (meaningfulData.phone) dataLines.push(`- Phone: ${meaningfulData.phone}`);
      if (meaningfulData.businessName) dataLines.push(`- Business: ${meaningfulData.businessName}`);
      if (meaningfulData.industry) dataLines.push(`- Industry: ${meaningfulData.industry}`);
      if (meaningfulData.businessDescription) dataLines.push(`- What they do: ${meaningfulData.businessDescription}`);
      if (meaningfulData.targetAudience) dataLines.push(`- Target audience: ${meaningfulData.targetAudience}`);
      if (meaningfulData.primaryGoal) dataLines.push(`- Primary goal: ${meaningfulData.primaryGoal}`);
      if (meaningfulData.budget) dataLines.push(`- Budget: ${meaningfulData.budget}`);
      if (meaningfulData.timeline) dataLines.push(`- Timeline: ${meaningfulData.timeline}`);
      if (meaningfulData.designStyle) dataLines.push(`- Design preference: ${meaningfulData.designStyle}`);
      if (meaningfulData.currentWebsite) dataLines.push(`- Current website: ${meaningfulData.currentWebsite}`);
      if (meaningfulData.requiredPages?.length) dataLines.push(`- Pages needed: ${meaningfulData.requiredPages.join(', ')}`);
      if (meaningfulData.features?.length) dataLines.push(`- Features: ${meaningfulData.features.join(', ')}`);
      if (meaningfulData.integrations?.length) dataLines.push(`- Integrations: ${meaningfulData.integrations.join(', ')}`);
      
      // Add any other filled fields not explicitly listed
      const listedKeys = ['fullName', 'email', 'phone', 'businessName', 'industry', 'businessDescription', 
        'targetAudience', 'primaryGoal', 'budget', 'timeline', 'designStyle', 'currentWebsite', 
        'requiredPages', 'features', 'integrations'];
      
      Object.entries(meaningfulData).forEach(([k, v]) => {
        if (!listedKeys.includes(k) && v) {
          dataLines.push(`- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
        }
      });
      
      if (dataLines.length > 0) {
        contextPrompt += `\n\n**INFO WE ALREADY HAVE (use naturally in conversation, never ask for these again):**\n${dataLines.join('\n')}`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: contextPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Onboarding assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
