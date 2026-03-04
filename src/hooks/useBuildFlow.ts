import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BuildFlow {
  id: string;
  lead_id: string;
  project_type: string;
  status: string;
  staging_url: string | null;
  is_live: boolean;
  live_at: string | null;
  client_view_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface BuildPhase {
  id: string;
  build_flow_id: string;
  phase_number: number;
  phase_key: string;
  title: string;
  description: string | null;
  is_locked: boolean;
  is_completed: boolean;
  is_strictly_linear: boolean;
  is_skipped: boolean;
  unlocks_after_phase_key: string | null;
  order_index: number;
  steps: BuildStep[];
}

export interface BuildStep {
  id: string;
  phase_id: string;
  step_number: number;
  step_key: string;
  title: string;
  description: string | null;
  guidance: string | null;
  is_completed: boolean;
  is_locked: boolean;
  is_required: boolean;
  is_skipped: boolean;
  completed_at: string | null;
  completed_by: string | null;
  order_index: number;
  completion?: StepCompletion;
}

export interface StepCompletion {
  id: string;
  step_id: string;
  build_flow_id: string;
  completed_by: string;
  screenshot_url: string | null;
  description: string;
  completed_at: string;
  is_visible_to_client: boolean;
}

export interface ClientAssets {
  id: string;
  lead_id: string;
  build_flow_id: string;
  logo_512: string | null;
  logo_192: string | null;
  logo_32: string | null;
  logo_16: string | null;
  logo_apple_touch: string | null;
  og_image: string | null;
  google_drive_link: string | null;
}

export interface BrandColour {
  id: string;
  lead_id: string;
  build_flow_id: string;
  label: string;
  hex_value: string;
  order_index: number;
}

export interface BrandFont {
  id: string;
  lead_id: string;
  build_flow_id: string;
  label: string;
  font_name: string;
  order_index: number;
}

export interface CredentialEntry {
  id: string;
  build_flow_id: string;
  lead_id: string;
  service_name: string;
  key_type: string;
  key_value: string;
  date_collected: string;
  collected_by: string;
  notes: string | null;
  is_test_key: boolean;
  is_live_key: boolean;
}

export function useBuildFlow(leadId: string | undefined) {
  const { toast } = useToast();
  const [buildFlow, setBuildFlow] = useState<BuildFlow | null>(null);
  const [phases, setPhases] = useState<BuildPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientAssets, setClientAssets] = useState<ClientAssets | null>(null);
  const [brandColours, setBrandColours] = useState<BrandColour[]>([]);
  const [brandFonts, setBrandFonts] = useState<BrandFont[]>([]);
  const [credentials, setCredentials] = useState<CredentialEntry[]>([]);

  const fetchBuildFlow = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);

    // Fetch build flow
    const { data: flowData } = await supabase
      .from('build_flows')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!flowData) {
      setBuildFlow(null);
      setLoading(false);
      return;
    }

    setBuildFlow(flowData as BuildFlow);

    // Fetch phases with steps
    const { data: phasesData } = await supabase
      .from('build_phases')
      .select('*')
      .eq('build_flow_id', flowData.id)
      .order('order_index');

    const { data: stepsData } = await supabase
      .from('build_steps')
      .select('*')
      .in('phase_id', (phasesData || []).map((p: any) => p.id))
      .order('order_index');

    const { data: completionsData } = await supabase
      .from('step_completions')
      .select('*')
      .eq('build_flow_id', flowData.id);

    const completionsMap = new Map<string, StepCompletion>();
    (completionsData || []).forEach((c: any) => completionsMap.set(c.step_id, c as StepCompletion));

    const phasesWithSteps = (phasesData || []).map((phase: any) => ({
      ...phase,
      steps: (stepsData || [])
        .filter((s: any) => s.phase_id === phase.id)
        .map((s: any) => ({
          ...s,
          completion: completionsMap.get(s.id) || undefined,
        })) as BuildStep[],
    })) as BuildPhase[];

    setPhases(phasesWithSteps);

    // Fetch client assets
    const { data: assetsData } = await supabase
      .from('client_assets')
      .select('*')
      .eq('build_flow_id', flowData.id)
      .maybeSingle();
    setClientAssets(assetsData as ClientAssets | null);

    // Fetch brand colours
    const { data: coloursData } = await supabase
      .from('brand_colours')
      .select('*')
      .eq('build_flow_id', flowData.id)
      .order('order_index');
    setBrandColours((coloursData || []) as BrandColour[]);

    // Fetch brand fonts
    const { data: fontsData } = await supabase
      .from('brand_fonts')
      .select('*')
      .eq('build_flow_id', flowData.id)
      .order('order_index');
    setBrandFonts((fontsData || []) as BrandFont[]);

    // Fetch credentials
    const { data: credsData } = await supabase
      .from('credential_vault')
      .select('*')
      .eq('build_flow_id', flowData.id)
      .order('date_collected');
    setCredentials((credsData || []) as CredentialEntry[]);

    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    fetchBuildFlow();
  }, [fetchBuildFlow]);

  const markStepComplete = async (
    step: BuildStep,
    description: string,
    screenshotUrl?: string | null,
    userId?: string
  ) => {
    if (!buildFlow || !userId) return;

    // Insert step completion
    const { error: compErr } = await supabase
      .from('step_completions')
      .insert({
        step_id: step.id,
        build_flow_id: buildFlow.id,
        completed_by: userId,
        screenshot_url: screenshotUrl || null,
        description,
      });

    if (compErr) {
      toast({ title: 'Error marking step complete', description: compErr.message, variant: 'destructive' });
      return;
    }

    // Update step
    await supabase
      .from('build_steps')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        completed_by: userId,
      })
      .eq('id', step.id);

    // Check if phase is now complete
    const phaseSteps = phases
      .find(p => p.id === step.phase_id)
      ?.steps || [];
    const allComplete = phaseSteps.every(
      s => s.id === step.id || s.is_completed || s.is_skipped || !s.is_required
    );

    if (allComplete) {
      await supabase
        .from('build_phases')
        .update({ is_completed: true })
        .eq('id', step.phase_id);

      // Unlock next phase
      const currentPhase = phases.find(p => p.id === step.phase_id);
      if (currentPhase) {
        const nextPhases = phases.filter(
          p => p.unlocks_after_phase_key === currentPhase.phase_key && p.is_locked
        );
        for (const np of nextPhases) {
          await supabase
            .from('build_phases')
            .update({ is_locked: false })
            .eq('id', np.id);
        }
      }

      // For strictly linear phases, unlock next step
      if (currentPhase?.is_strictly_linear) {
        const nextStep = phaseSteps.find(
          s => s.step_number === step.step_number + 1 && s.is_locked
        );
        if (nextStep) {
          await supabase
            .from('build_steps')
            .update({ is_locked: false })
            .eq('id', nextStep.id);
        }
      }
    } else if (phases.find(p => p.id === step.phase_id)?.is_strictly_linear) {
      // Unlock next step in linear phase
      const nextStep = phaseSteps.find(
        s => s.step_number === step.step_number + 1 && s.is_locked
      );
      if (nextStep) {
        await supabase
          .from('build_steps')
          .update({ is_locked: false })
          .eq('id', nextStep.id);
      }
    }

    toast({ title: 'Step marked as complete' });
    await fetchBuildFlow();
  };

  const skipStep = async (stepId: string) => {
    await supabase
      .from('build_steps')
      .update({ is_skipped: true })
      .eq('id', stepId);
    toast({ title: 'Step skipped' });
    await fetchBuildFlow();
  };

  const toggleClientView = async () => {
    if (!buildFlow) return;
    const newVal = !buildFlow.client_view_enabled;
    await supabase
      .from('build_flows')
      .update({ client_view_enabled: newVal })
      .eq('id', buildFlow.id);
    setBuildFlow({ ...buildFlow, client_view_enabled: newVal });
    toast({ title: newVal ? 'Client view enabled' : 'Client view disabled' });
  };

  const createBuildFlow = async (
    projectType: string,
    selectedFeatures: string[],
    selectedPages: string[],
    selectedIntegrations: string[],
    businessName: string,
    discoveryData?: any,
  ) => {
    // Get current user for auto-completing P1S1
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.functions.invoke('generate-build-flow', {
      body: {
        lead_id: leadId,
        project_type: projectType,
        selected_features: selectedFeatures,
        selected_pages: selectedPages,
        selected_integrations: selectedIntegrations,
        business_name: businessName,
        discovery_data: discoveryData || null,
        user_id: user?.id || null,
      },
    });

    if (error) {
      toast({ title: 'Error creating build flow', description: error.message, variant: 'destructive' });
      return null;
    }

    toast({ title: 'Build flow created' });
    await fetchBuildFlow();
    return data;
  };

  return {
    buildFlow,
    phases,
    loading,
    clientAssets,
    brandColours,
    brandFonts,
    credentials,
    markStepComplete,
    skipStep,
    toggleClientView,
    createBuildFlow,
    refetch: fetchBuildFlow,
    setClientAssets,
    setBrandColours,
    setBrandFonts,
    setCredentials,
  };
}
