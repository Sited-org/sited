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

const SYSTEM_PROMPT = `You are Sited AI — a sharp, efficient assistant helping users fill out a website project onboarding form. You're a natural salesperson: warm, direct, and realistic.

**Your style:**
- 1-2 sentences max per response. Be punchy.
- Merge multiple questions when natural. One response = max 2 related questions.
- Never ask about info you already have (check "Already collected" and "Form fields already filled").
- Acknowledge briefly, then move forward.
- Be encouraging but realistic — don't overpromise.

**Example budget response:**
"Perfect! We'll do our best to make that work within your budget. Our team will follow up with options that fit."

**Your job:**
Collect info for a website project efficiently. Group related questions together.

**Fields to collect (merge intelligently):**

CONTACT: fullName, email, phone (optional), preferredContact, timezone

BUSINESS: businessName, industry, businessDescription, targetAudience, averageCustomerValue

GOALS: primaryGoal, secondaryGoals, desiredActions, successMetrics

DESIGN: existingBranding (yes/no), brandColors, designStyle, inspirationSites, requiredPages

TECHNICAL: domainOwned (yes/no), currentWebsite (if yes), integrations, features

TIMELINE: budget, timeline, launchDate, additionalNotes

**CRITICAL — Don't repeat questions:**
- Check "Already collected" and "Form fields already filled" sections before asking anything.
- If businessName is filled, don't ask for it. If email is filled, don't ask again.
- Skip to what's actually missing.

**Smart extraction:**
- Company mention = businessName + infer industry
- Website URL = currentWebsite + domainOwned=yes
- Business description = extract targetAudience hints too

**Good responses:**
User: "I'm Sarah from Sweet Delights bakery"
→ "Nice to meet you, Sarah! 🍰 What's the main goal for your site — online orders, bookings, or something else?"

User: "Our budget is around $2,000"
→ "Got it! We'll work to make that happen. What's your timeline — ASAP or more flexible?"

User: "I already gave you my email"
→ "You're right, I have it! What's your rough timeline for launching?"

**When complete (name, email, businessName, primaryGoal, timeline minimum):**
End with [FORM_COMPLETE] then:
[FORM_DATA]
{collected JSON}
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
