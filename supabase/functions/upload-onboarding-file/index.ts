import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const formData = await req.formData();
    const leadId = formData.get("lead_id") as string;
    const file = formData.get("file") as File;

    if (!leadId || !file) {
      return new Response(
        JSON.stringify({ error: "Missing lead_id or file" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File too large (max 10MB)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileName = `${leadId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('onboarding-files')
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload file" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Update the lead's form_data with uploaded file info
    const { data: lead } = await supabaseClient
      .from('leads')
      .select('form_data')
      .eq('id', leadId)
      .single();

    const currentFormData = (lead?.form_data as Record<string, unknown>) || {};
    const existingFiles = (currentFormData.uploaded_files as Array<Record<string, unknown>>) || [];
    
    existingFiles.push({
      file_name: file.name,
      file_path: fileName,
      file_size: file.size,
      content_type: file.type,
      uploaded_at: new Date().toISOString(),
    });

    await supabaseClient
      .from('leads')
      .update({ form_data: { ...currentFormData, uploaded_files: existingFiles } })
      .eq('id', leadId);

    return new Response(
      JSON.stringify({ success: true, file_path: fileName, file_name: file.name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("ERROR:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
