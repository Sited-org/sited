import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRACK-FORM-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function invoked');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Create service role client (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    const { 
      session_id, 
      form_type, 
      current_step,
      total_steps,
      user_agent,
      ip_address,
      partial_data,
      action // 'create', 'update', or 'complete'
    } = body;

    logStep('Processing request', { session_id, form_type, action, current_step });

    // Validate required fields
    if (!session_id || !form_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: session_id, form_type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (action === 'create') {
      // Create new form session
      logStep('Creating new form session');
      
      const { error: insertError } = await supabase
        .from('form_sessions')
        .insert({
          session_id: session_id,
          form_type,
          current_step: current_step || 1,
          total_steps: total_steps || 6,
          user_agent: user_agent || null,
          ip_address: ip_address || null,
          partial_data: partial_data || {},
          last_activity_at: new Date().toISOString(),
        });

      if (insertError) {
        // If duplicate key error, just update instead
        if (insertError.code === '23505') {
          logStep('Session exists, updating instead');
          
          const { error: updateError } = await supabase
            .from('form_sessions')
            .update({
              current_step: current_step || 1,
              partial_data: partial_data || {},
              last_activity_at: new Date().toISOString(),
            })
            .eq('session_id', session_id);

          if (updateError) {
            logStep('Update error after duplicate', { error: updateError.message });
          }
        } else {
          logStep('Insert error', { error: insertError.message });
          return new Response(
            JSON.stringify({ error: 'Failed to create session' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true, session_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      // Update existing form session
      logStep('Updating form session', { session_id, current_step });
      
      const updateData: Record<string, unknown> = {
        last_activity_at: new Date().toISOString(),
      };

      if (current_step !== undefined) {
        updateData.current_step = current_step;
      }

      if (partial_data !== undefined) {
        updateData.partial_data = partial_data;
      }

      const { error: updateError } = await supabase
        .from('form_sessions')
        .update(updateData)
        .eq('session_id', session_id);

      if (updateError) {
        logStep('Update error', { error: updateError.message });
        return new Response(
          JSON.stringify({ error: 'Failed to update session' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, session_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'complete') {
      // Mark session as completed (delete it)
      logStep('Completing form session', { session_id });
      
      const { error: deleteError } = await supabase
        .from('form_sessions')
        .delete()
        .eq('session_id', session_id);

      if (deleteError) {
        logStep('Delete error', { error: deleteError.message });
        // Don't fail the request if delete fails
      }

      return new Response(
        JSON.stringify({ success: true, session_id, completed: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: create, update, or complete' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('Unexpected error', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
