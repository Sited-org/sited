import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPLOAD-CLIENT-ASSET] ${step}${detailsStr}`);
};

async function verifyHmacSignature(data: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const expectedSignatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(expectedSignatureBuffer)));
  if (signature.length !== expectedSignature.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

async function validateSessionToken(token: string, secret: string) {
  if (!token) return { valid: false, error: 'Missing token' };
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false, error: 'Invalid format' };
  const [payloadBase64, signature] = parts;
  if (!(await verifyHmacSignature(payloadBase64, signature, secret))) {
    return { valid: false, error: 'Invalid signature' };
  }
  const payload = JSON.parse(atob(payloadBase64));
  if (!payload.lid || !payload.exp) return { valid: false, error: 'Incomplete payload' };
  if (Date.now() > payload.exp) return { valid: false, error: 'Token expired' };
  return { valid: true, leadId: payload.lid };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const secret = Deno.env.get('CLIENT_SESSION_SECRET');
    if (!secret) throw new Error('CLIENT_SESSION_SECRET not configured');

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const contentType = req.headers.get('content-type') || '';

    // JSON body = save_brand_data action
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { session_token, lead_id, action, colours, fonts } = body;

      if (!session_token || !lead_id) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
        });
      }

      const validation = await validateSessionToken(session_token, secret);
      if (!validation.valid || validation.leadId !== lead_id) {
        return new Response(JSON.stringify({ error: validation.error || 'Access denied' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
        });
      }

      if (action === 'save_brand_data') {
        logStep("Saving brand data", { colours, fonts });

        // Find build flow
        const { data: buildFlow } = await supabaseClient
          .from("build_flows")
          .select("id")
          .eq("lead_id", lead_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!buildFlow) {
          return new Response(JSON.stringify({ error: 'No build flow found' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404,
          });
        }

        // Save colours
        if (colours && Array.isArray(colours)) {
          // Delete existing client-submitted colours first
          await supabaseClient.from('brand_colours').delete()
            .eq('lead_id', lead_id)
            .eq('build_flow_id', buildFlow.id);

          const colourRows = colours.map((c: { role: string; hex: string }, i: number) => ({
            lead_id: lead_id,
            build_flow_id: buildFlow.id,
            label: c.role.charAt(0).toUpperCase() + c.role.slice(1),
            hex_value: c.hex,
            order_index: i,
          }));

          if (colourRows.length > 0) {
            const { error: colErr } = await supabaseClient.from('brand_colours').insert(colourRows);
            if (colErr) logStep("Error saving colours", { error: colErr.message });
          }
        }

        // Save fonts
        if (fonts && Array.isArray(fonts)) {
          await supabaseClient.from('brand_fonts').delete()
            .eq('lead_id', lead_id)
            .eq('build_flow_id', buildFlow.id);

          const fontRows = fonts.filter((f: string) => f.trim()).map((f: string, i: number) => ({
            lead_id: lead_id,
            build_flow_id: buildFlow.id,
            label: i === 0 ? 'Primary' : i === 1 ? 'Secondary' : 'Accent',
            font_name: f,
            order_index: i,
          }));

          if (fontRows.length > 0) {
            const { error: fontErr } = await supabaseClient.from('brand_fonts').insert(fontRows);
            if (fontErr) logStep("Error saving fonts", { error: fontErr.message });
          }
        }

        logStep("Brand data saved successfully");
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    // FormData body = file upload
    const formData = await req.formData();
    const sessionToken = formData.get('session_token') as string;
    const leadId = formData.get('lead_id') as string;
    const slotKey = formData.get('slot_key') as string;
    const file = formData.get('file') as File;

    if (!sessionToken || !leadId || !slotKey || !file) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    const validation = await validateSessionToken(sessionToken, secret);
    if (!validation.valid || validation.leadId !== leadId) {
      return new Response(JSON.stringify({ error: validation.error || 'Access denied' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
      });
    }

    logStep("Session validated", { leadId, slotKey });

    const { data: buildFlow } = await supabaseClient
      .from("build_flows")
      .select("id")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!buildFlow) {
      return new Response(JSON.stringify({ error: 'No build flow found' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404,
      });
    }

    let { data: clientAssets } = await supabaseClient
      .from("client_assets")
      .select("id")
      .eq("lead_id", leadId)
      .eq("build_flow_id", buildFlow.id)
      .maybeSingle();

    if (!clientAssets) {
      const { data: newAssets, error: createErr } = await supabaseClient
        .from("client_assets")
        .insert({ lead_id: leadId, build_flow_id: buildFlow.id })
        .select("id")
        .single();
      if (createErr) throw createErr;
      clientAssets = newAssets;
    }

    const fileExt = file.name.split('.').pop();
    const path = `logos/${leadId}/${slotKey}-${Date.now()}.${fileExt}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadErr } = await supabaseClient.storage
      .from('build-assets')
      .upload(path, arrayBuffer, { contentType: file.type });

    if (uploadErr) {
      logStep("Upload failed", { error: uploadErr.message });
      throw uploadErr;
    }

    const { data: { publicUrl } } = supabaseClient.storage.from('build-assets').getPublicUrl(path);

    const validSlots = ['logo_512', 'logo_32', 'og_image'];
    if (!validSlots.includes(slotKey)) {
      return new Response(JSON.stringify({ error: 'Invalid slot key' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    await supabaseClient.from('client_assets')
      .update({ [slotKey]: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', clientAssets.id);

    logStep("Asset uploaded successfully", { slotKey, publicUrl });

    return new Response(
      JSON.stringify({ success: true, publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
