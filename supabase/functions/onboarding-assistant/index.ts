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

const SYSTEM_PROMPT = `You are Sited AI — a knowledgeable, efficient assistant helping users fill out a website project onboarding form. Be conversational and professional, but keep it real. Think of yourself as a smart friend who's done this a hundred times.

**Your personality:**
- Professional but approachable — no corporate speak
- Knowledgeable — you understand web projects, design, and business
- Efficient — you merge questions and extract multiple data points from single responses
- Helpful — you offer insights and suggestions when relevant

**Your goal:**
Collect all the information needed for a website project efficiently. You should gather information conversationally, asking 1-2 related questions at a time rather than going field by field.

**Fields to collect (merge intelligently):**

CONTACT:
- fullName (their name)
- email
- phone (optional)
- preferredContact (email/phone/video-call)
- timezone

BUSINESS:
- businessName
- industry
- businessDescription
- targetAudience

PROJECT GOALS:
- primaryGoal (generate-leads/sell-products/brand-awareness/provide-info/showcase-portfolio/booking-scheduling)
- secondaryGoals (array)
- desiredActions (what should visitors do)
- successMetrics

DESIGN:
- existingBranding (yes/no)
- brandColors (if they have them)
- designStyle (modern/classic/minimalist/bold/playful)
- inspirationSite1, inspirationSite2, inspirationSite3 (websites they like)
- requiredPages (array: Home, About, Services, etc.)

TECHNICAL:
- domainOwned (yes/no/need-help)
- currentWebsite (only if domainOwned=yes)
- domainName (only if domainOwned=yes)
- integrations (array)
- features (array)

TIMELINE:
- budget (not-sure/0-500/500-1000/1000-2500/2500+)
- timeline (asap/1-2-weeks/2-4-weeks/1-2-months/2-3-months/flexible)
- launchDate (optional specific date)
- additionalNotes

**Smart extraction rules:**
- If they mention a company, that's businessName AND you can often infer industry
- If they share a website URL, extract it as currentWebsite AND set domainOwned to "yes"
- If they describe their business, extract businessDescription AND targetAudience hints
- Look for budget hints in descriptions like "small business" or "startup" vs "enterprise"

**Conversation flow:**
1. Start by getting their name and what they're building
2. Dig into their business and audience
3. Understand their goals and what success looks like
4. Discuss design preferences and inspiration
5. Cover technical needs (domain, integrations, features)
6. Wrap up with timeline and budget

**Response format:**
- Keep responses concise (2-3 sentences max usually)
- Ask 1-2 related questions at a time
- Acknowledge what they've shared before asking more
- Offer helpful insights when relevant (e.g., "E-commerce sites typically need payment processing and inventory management — shall I note those down?")

**When you have enough info (at minimum: name, email, businessName, primaryGoal, timeline):**
Include [FORM_COMPLETE] at the end of your message, followed by:
[FORM_DATA]
{JSON object with all collected fields}
[/FORM_DATA]

**Examples of good responses:**

User: "I'm Sarah and I run a bakery called Sweet Delights"
Response: "Nice to meet you, Sarah! Sweet Delights sounds delicious 🍰 I'll note that down. What's the main thing you want your website to do — get people to visit your shop, or maybe order online?"

User: "We want people to order custom cakes online and book consultations"
Response: "Perfect — so e-commerce with a booking system. That's a pretty common setup for bakeries. Do you have a website currently, or will this be brand new? And quick one — what's the best email to reach you?"

User: "No website yet, email is sarah@sweetdelights.com, and we're looking to launch in about 2 months"
Response: "Got it! 2 months is a solid timeline for what you're building. Since you don't have a domain yet, do you want to use sweetdelights.com if it's available, or do you have something else in mind?"`;

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

    // Build context about what's already collected
    let contextPrompt = SYSTEM_PROMPT;
    
    if (collectedData && Object.keys(collectedData).length > 0) {
      contextPrompt += `\n\n**Already collected:**\n${JSON.stringify(collectedData, null, 2)}`;
    }
    
    if (currentFormData && Object.keys(currentFormData).length > 0) {
      const filledFields = Object.entries(currentFormData)
        .filter(([_, v]) => v && (typeof v !== 'object' || (Array.isArray(v) && v.length > 0)))
        .map(([k]) => k);
      if (filledFields.length > 0) {
        contextPrompt += `\n\n**Form fields already filled:** ${filledFields.join(', ')}`;
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
