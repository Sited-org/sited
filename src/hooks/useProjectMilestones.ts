import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

// Project milestones
export const PROJECT_MILESTONES = [
  { title: 'Received Form', description: 'Project request received and reviewed' },
  { title: 'Building Initiated', description: 'Development has started' },
  { title: 'V1 Complete', description: 'First version ready for review' },
  { title: 'Review', description: 'Client reviewing and providing feedback' },
  { title: 'V2 Complete', description: 'Revisions complete' },
  { title: 'Delivery', description: 'Final files and handover' },
  { title: 'Launch', description: 'Website is live' },
];

export interface ProjectMilestone {
  id: string;
  lead_id: string;
  category: string;
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
  const { toast } = useToast();

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('lead_id', leadId)
        .eq('category', 'frontend') // Only fetch frontend milestones
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

  const hasMilestones = milestones.length > 0;
  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progress = milestones.length > 0 
    ? Math.round((completedCount / milestones.length) * 100) 
    : 0;

  // Initialize milestones for a project
  const initializeMilestones = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const milestonesToInsert = PROJECT_MILESTONES.map((m, index) => ({
        lead_id: leadId,
        category: 'frontend',
        title: m.title,
        description: m.description,
        status: index === 0 ? 'completed' : 'pending' as MilestoneStatus,
        display_order: index,
        completed_at: index === 0 ? new Date().toISOString() : null,
        created_by: userData.user?.id || null,
      }));

      const { error } = await supabase
        .from('project_milestones')
        .insert(milestonesToInsert);

      if (error) throw error;
      toast({ title: 'Milestones initialized' });
      fetchMilestones();
    } catch (error: any) {
      toast({ title: 'Error initializing milestones', description: error.message, variant: 'destructive' });
    }
  };

  // Update milestone status
  const updateMilestoneStatus = async (milestoneId: string, status: MilestoneStatus) => {
    try {
      const updateData: Partial<ProjectMilestone> = {
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('project_milestones')
        .update(updateData)
        .eq('id', milestoneId);

      if (error) throw error;
      fetchMilestones();
    } catch (error: any) {
      toast({ title: 'Error updating milestone', description: error.message, variant: 'destructive' });
    }
  };

  // Delete all milestones
  const clearMilestones = async () => {
    try {
      const { error } = await supabase
        .from('project_milestones')
        .delete()
        .eq('lead_id', leadId)
        .eq('category', 'frontend');

      if (error) throw error;
      toast({ title: 'Milestones cleared' });
      fetchMilestones();
    } catch (error: any) {
      toast({ title: 'Error clearing milestones', description: error.message, variant: 'destructive' });
    }
  };

  return {
    milestones,
    hasMilestones,
    completedCount,
    progress,
    loading,
    refetch: fetchMilestones,
    initializeMilestones,
    updateMilestoneStatus,
    clearMilestones,
  };
}
