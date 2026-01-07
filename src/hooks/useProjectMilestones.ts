import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MilestoneCategory = 'design' | 'metrics';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

export interface ProjectMilestone {
  id: string;
  lead_id: string;
  category: MilestoneCategory;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  display_order: number;
  completed_at: string | null;
  created_at: string;
  created_by: string | null;
}

export function useProjectMilestones(leadId: string) {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('lead_id', leadId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMilestones((data as ProjectMilestone[]) || []);
    } catch (error: any) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) {
      fetchMilestones();
    }
  }, [fetchMilestones, leadId]);

  const designMilestones = milestones.filter(m => m.category === 'design');
  const metricsMilestones = milestones.filter(m => m.category === 'metrics');

  const completedDesign = designMilestones.filter(m => m.status === 'completed').length;
  const completedMetrics = metricsMilestones.filter(m => m.status === 'completed').length;

  const designProgress = designMilestones.length > 0 
    ? Math.round((completedDesign / designMilestones.length) * 100) 
    : 0;
  const metricsProgress = metricsMilestones.length > 0 
    ? Math.round((completedMetrics / metricsMilestones.length) * 100) 
    : 0;

  return {
    milestones,
    designMilestones,
    metricsMilestones,
    designProgress,
    metricsProgress,
    loading,
    refetch: fetchMilestones,
  };
}
