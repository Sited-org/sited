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
  currentStep: z.number().optional(),
});

// Define step requirements
const STEP_FIELDS: Record<number, string[]> = {
  1: ["fullName", "email"], // Contact Info - required
  2: ["businessName", "industry", "businessDescription", "targetAudience"], // Business Details
  3: ["primaryGoal", "desiredActions"], // Project Goals
  4: ["designStyle"], // Design & Content
  5: ["domainOwned"], // Technical Requirements
  6: ["budget", "timeline"], // Timeline & Budget
};

const SYSTEM_PROMPT = `You are Sited AI — a friendly, efficient guide helping users complete their website project form. You're conversational but focused, gathering info naturally while moving through each section.

**Your style:**
- 1-2 sentences max. Warm but efficient.
- Acknowledge what they share, then guide to the next topic.
- Never ask about info you already have (check "INFO WE ALREADY HAVE").
- Be encouraging and reassuring — never pushy.

**CRITICAL: EXTRACT ALL INFO IMMEDIATELY**
Whenever the user shares ANY information, you MUST call the extract_form_data tool to capture it. Even partial info should be extracted right away. This populates the form in real-time.

**FOLLOW THIS FLOW (in order):**

1. **CONTACT** (Step 1): fullName, email, phone
   → "Great to meet you! What's your email so we can send you updates?"

2. **BUSINESS** (Step 2): businessName, industry, businessDescription, targetAudience
   → "Tell me about your business — what do you do and who are your ideal customers?"

3. **PROJECT GOALS** (Step 3): primaryGoal, desiredActions
   → "What's the main goal for your website — more leads, online sales, bookings?"

4. **DESIGN** (Step 4): designStyle, existingBranding
   → "Any design preferences? Modern and minimal, bold and colorful, or something else?"

5. **TECHNICAL** (Step 5): currentWebsite, domainOwned, features, integrations
   → "Do you have a current website or domain? Any must-have features?"

6. **TIMELINE & BUDGET** (Step 6): timeline, budget
   → "Last couple of questions — what's your timeline and rough budget?"

**After budget response:**
"Perfect! We'll do our best to work within that. Once you submit the form, one of our team members will be in touch within 24 hours to discuss how we can help bring your vision to life."

**Smart grouping:**
- Merge related questions naturally (business + audience, timeline + budget)
- Skip sections where all fields are filled
- If they mention something relevant to a later section, acknowledge and note it, but stay on track

**Value mappings for select fields:**
- industry: retail, healthcare, finance, realestate, hospitality, professional, technology, education, nonprofit, creative, construction, other
- primaryGoal: generate-leads, sell-products, brand-awareness, provide-info, showcase-portfolio, booking-scheduling
- designStyle: modern-minimal, bold-colorful, elegant-professional, playful-friendly, corporate-classic, dark-edgy
- timeline: asap, 1-2-weeks, 2-4-weeks, 1-2-months, 2-3-months, flexible
- budget: not-sure, 0-500, 500-1000, 1000-2500, 2500+
- domainOwned: yes, no, need-help`;

// Tool definition for extracting form data
const extractFormDataTool = {
  type: "function",
  function: {
    name: "extract_form_data",
    description: "Extract and store form field values from the user's message. Call this EVERY time the user provides any information that maps to a form field. Extract immediately as they share info.",
    parameters: {
      type: "object",
      properties: {
        fullName: { type: "string", description: "User's full name" },
        email: { type: "string", description: "User's email address" },
        phone: { type: "string", description: "User's phone number" },
        businessName: { type: "string", description: "Name of their business/company" },
        industry: { 
          type: "string", 
          enum: ["retail", "healthcare", "finance", "realestate", "hospitality", "professional", "technology", "education", "nonprofit", "creative", "construction", "other"],
          description: "Business industry category" 
        },
        businessDescription: { type: "string", description: "What the business does" },
        targetAudience: { type: "string", description: "Who their ideal customers are" },
        averageCustomerValue: { type: "string", description: "Average customer value" },
        primaryGoal: { 
          type: "string", 
          enum: ["generate-leads", "sell-products", "brand-awareness", "provide-info", "showcase-portfolio", "booking-scheduling"],
          description: "Main goal for the website" 
        },
        desiredActions: { type: "string", description: "What actions visitors should take" },
        designStyle: { 
          type: "string", 
          enum: ["modern-minimal", "bold-colorful", "elegant-professional", "playful-friendly", "corporate-classic", "dark-edgy"],
          description: "Preferred design style" 
        },
        existingBranding: { 
          type: "string", 
          enum: ["yes-complete", "yes-partial", "no"],
          description: "Whether they have existing branding" 
        },
        currentWebsite: { type: "string", description: "Current website URL if any" },
        domainOwned: { 
          type: "string", 
          enum: ["yes", "no", "need-help"],
          description: "Whether they own a domain" 
        },
        domainName: { type: "string", description: "Their domain name if they have one" },
        timeline: { 
          type: "string", 
          enum: ["asap", "1-2-weeks", "2-4-weeks", "1-2-months", "2-3-months", "flexible"],
          description: "Desired project timeline" 
        },
        budget: { 
          type: "string", 
          enum: ["not-sure", "0-500", "500-1000", "1000-2500", "2500+"],
          description: "Budget range" 
        },
        features: { 
          type: "array", 
          items: { type: "string" },
          description: "Requested features like contact form, live chat, etc." 
        },
        integrations: { 
          type: "array", 
          items: { type: "string" },
          description: "Requested integrations like payment, CRM, etc." 
        },
        stepComplete: {
          type: "number",
          description: "Set this to the step number (1-6) if the user has provided all required info for that step and should advance to the next one"
        },
        formComplete: {
          type: "boolean",
          description: "Set to true if all essential info has been collected (name, email, businessName, primaryGoal, timeline, budget)"
        }
      },
      required: [],
      additionalProperties: false
    }
  }
};

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
    const { messages, currentFormData, collectedData, projectType, currentStep = 1 } = validatedBody;

    // Build context about what's already collected
    let contextPrompt = SYSTEM_PROMPT;
    
    // Combine collectedData and currentFormData
    const allKnownData: Record<string, any> = { ...collectedData, ...currentFormData };
    
    // Filter to meaningful values
    const meaningfulData = Object.entries(allKnownData)
      .filter(([_, v]) => {
        if (!v) return false;
        if (typeof v === 'string' && v.trim() === '') return false;
        if (Array.isArray(v) && v.length === 0) return false;
        return true;
      })
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, any>);
    
    if (Object.keys(meaningfulData).length > 0) {
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
      if (meaningfulData.domainOwned) dataLines.push(`- Has domain: ${meaningfulData.domainOwned}`);
      if (meaningfulData.requiredPages?.length) dataLines.push(`- Pages needed: ${meaningfulData.requiredPages.join(', ')}`);
      if (meaningfulData.features?.length) dataLines.push(`- Features: ${meaningfulData.features.join(', ')}`);
      if (meaningfulData.integrations?.length) dataLines.push(`- Integrations: ${meaningfulData.integrations.join(', ')}`);
      
      if (dataLines.length > 0) {
        contextPrompt += `\n\n**INFO WE ALREADY HAVE (use naturally, never ask again):**\n${dataLines.join('\n')}`;
      }
    }

    // Add current step context
    contextPrompt += `\n\n**CURRENT FORM STEP:** ${currentStep} of 6`;
    contextPrompt += `\n**STEP FIELDS TO COLLECT:** ${STEP_FIELDS[currentStep]?.join(', ') || 'Final review'}`;

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
        tools: [extractFormDataTool],
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

    // Create a transform stream to process the response and extract tool calls
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    // Process the stream
    (async () => {
      let buffer = "";
      let toolCallArguments = "";
      let isCollectingToolCall = false;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ") || line.trim() === "") continue;
            
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              // If we collected tool call arguments, send them as extracted data
              if (toolCallArguments) {
                try {
                  const extractedData = JSON.parse(toolCallArguments);
                  const extractedEvent = `data: ${JSON.stringify({ extracted_data: extractedData })}\n\n`;
                  await writer.write(new TextEncoder().encode(extractedEvent));
                } catch (e) {
                  console.error("Failed to parse tool call arguments:", e);
                }
              }
              await writer.write(new TextEncoder().encode("data: [DONE]\n\n"));
              continue;
            }
            
            try {
              const parsed = JSON.parse(jsonStr);
              const choice = parsed.choices?.[0];
              
              // Check for tool calls
              if (choice?.delta?.tool_calls) {
                isCollectingToolCall = true;
                for (const toolCall of choice.delta.tool_calls) {
                  if (toolCall.function?.arguments) {
                    toolCallArguments += toolCall.function.arguments;
                  }
                }
              }
              
              // Pass through content as normal
              if (choice?.delta?.content) {
                await writer.write(new TextEncoder().encode(line + "\n"));
              }
            } catch (e) {
              // Pass through unparseable lines
              await writer.write(new TextEncoder().encode(line + "\n"));
            }
          }
        }
      } catch (e) {
        console.error("Stream processing error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
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
