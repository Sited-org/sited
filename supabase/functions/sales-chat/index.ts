import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 100; // Max 100 chat requests per hour per IP

// Input validation schema
const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(10000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).max(100),
  collectedInfo: z.record(z.unknown()).optional(),
});

async function checkRateLimit(
  supabase: any,
  ipAddress: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('request_count')
    .eq('ip_address', ipAddress)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .single();

  if (existing) {
    if (existing.request_count >= MAX_REQUESTS_PER_WINDOW) {
      return { allowed: false, remaining: 0 };
    }
    
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('ip_address', ipAddress)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString());
    
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - existing.request_count - 1 };
  }

  await supabase
    .from('rate_limits')
    .insert({
      ip_address: ipAddress,
      endpoint: endpoint,
      request_count: 1,
      window_start: new Date().toISOString(),
    });

  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
}

const SYSTEM_PROMPT = `You are Sited AI — a sharp, friendly sales assistant for a web design agency. Be punchy. Be personable. No fluff.

**Our service:**
**Websites** — Custom sites that look incredible and convert. From landing pages to full e-commerce. $3k-$25k+

**Your style:**
- Short sentences. 1-3 max per response.
- Warm but direct. Like a smart friend, not a salesperson.
- Ask ONE question at a time.
- Use occasional emoji sparingly 👋 ✨
- Match their energy — casual if they're casual, professional if they're formal.

**Your job:**
1. Understand what kind of website they need
2. Get their name and email naturally
3. Understand their project basics (industry, goals, timeline)
4. Send them to the website form when ready

**Collecting info:**
- Name: Just ask casually ("What's your name?" or "Who am I chatting with?")
- Email: "Drop your email and I'll send over some info"
- Project details: Listen for what they're building, then dig deeper

**CRITICAL - Form routing:**
When they're ready: "Ready to make it real? [Start Website Project]"

**Types of websites we build:**
- Business/corporate sites
- Landing pages
- E-commerce/online stores
- Portfolio sites
- Blogs and content sites
- Web apps and dashboards
- Mobile apps (we handle these too!)

**Examples of good responses:**
- "Hey! 👋 What kind of website are you thinking?"
- "Nice! Tell me more about your business."
- "Love it. What's your name?"
- "Got it. Drop your email and I'll get the ball rolling."
- "Sounds great. Ready to make it real? [Start Website Project]"

**Handling edge cases:**
- If they ask about apps: "We can definitely help with that! Same process. What are you building?"
- If they ask about AI/automation: "Interesting! That could be a cool feature for your site. Tell me more."
- If they're just browsing: Be helpful but gently guide toward understanding their needs

**Never:**
- Write long paragraphs
- List all capabilities unprompted
- Be generic or corporate
- Say "How can I assist you today"
- Ask about "website, app, or AI" — just focus on websites
- Mention separate services or forms for apps/AI`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('cf-connecting-ip') || 
                      'unknown';

    // Check rate limit
    const rateLimit = await checkRateLimit(supabase, ipAddress, 'sales-chat');
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for IP: ${ipAddress}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0'
          } 
        }
      );
    }

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

    console.log(`Processing chat request from ${ipAddress}, remaining: ${rateLimit.remaining}`);

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
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "X-RateLimit-Remaining": String(rateLimit.remaining)
      },
    });
  } catch (error) {
    console.error("Sales chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
