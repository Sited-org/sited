import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(10000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).max(100),
  collectedInfo: z.record(z.unknown()).optional(),
});

const SYSTEM_PROMPT = `You are Sited AI — a sharp, friendly sales assistant. Be punchy. Be personable. No fluff.

**Our services:**
1. **Websites** — Custom sites that look incredible and convert. $3k-$25k+
2. **Apps** — iOS & Android apps, MVP to full-featured. $15k-$100k+
3. **AI Integrations** — Chatbots, automation, smart features for SMBs. $5k-$30k+

**Your style:**
- Short sentences. 1-3 max per response.
- Warm but direct. Like a smart friend, not a salesperson.
- Ask ONE question at a time.
- Use occasional emoji sparingly 👋 ✨

**Your job:**
1. Figure out what they need (website, app, or AI integration)
2. Get their name and email
3. Understand their project basics
4. Send them to the RIGHT form based on their project type

**Collecting info:**
- Name: Just ask casually
- Email: "Drop your email and I'll send over some info"
- Project type: Listen for keywords

**CRITICAL - Form routing:**
You MUST use the correct form link based on project type:
- For websites: "Ready to make it real? [Start Website Project]"
- For apps: "Let's build this. [Start App Project]"
- For AI/chatbots/automation: "Let's automate this. [Start AI Project]"

**Detecting AI projects:**
If they mention ANY of these, it's an AI project:
- chatbot, AI assistant, automation
- efficiency, streamline operations
- reduce manual work, automate tasks
- AI integration, machine learning
- customer service automation

**Examples of good responses:**
- "Hey! 👋 Website, app, or AI project?"
- "Nice! What kind of app are you thinking?"
- "Love it. What's your name?"
- "Got it. Drop your email and I'll get the ball rolling."
- "Sounds like an AI integration project. Let's automate this. [Start AI Project]"
- "Perfect for a website. Ready to make it real? [Start Website Project]"

**Never:**
- Write long paragraphs
- List all services unprompted
- Be generic or corporate
- Say "How can I assist you today"
- Send AI projects to the website form - they have their own form!`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    
    // Validate input
    const parseResult = requestSchema.safeParse(rawData);
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error);
      return new Response(
        JSON.stringify({ error: "Invalid request data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { messages, collectedInfo } = parseResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let contextualSystemPrompt = SYSTEM_PROMPT;
    if (collectedInfo && Object.keys(collectedInfo).length > 0) {
      contextualSystemPrompt += `\n\n**Info collected so far:**\n${JSON.stringify(collectedInfo, null, 2)}`;
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