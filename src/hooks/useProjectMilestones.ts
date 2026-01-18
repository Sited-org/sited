import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type MilestoneCategory = 'frontend' | 'backend';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

// Frontend milestones (no backend)
export const FRONTEND_MILESTONES = [
  { title: 'Received Form', description: 'Project request received and reviewed' },
  { title: 'Building Initiated', description: 'Development has started' },
  { title: 'V1 Complete', description: 'First version ready for review' },
  { title: 'Review', description: 'Client reviewing and providing feedback' },
  { title: 'V2 Complete', description: 'Revisions complete' },
  { title: 'Delivery', description: 'Final files and handover' },
  { title: 'Launch', description: 'Website is live' },
];

// Backend milestone options
export const BACKEND_FEATURE_OPTIONS = [
  'User Authentication',
  'Database & Data Storage',
  'Payment Processing',
  'Email Automation',
  'API Integrations',
  'Admin Dashboard',
  'File Storage',
  'Analytics',
  'CRM Integration',
  'Booking System',
  'Custom Logic',
];

export const BACKEND_MILESTONES = [
  { title: 'Backend Needs Identified', description: 'Required backend features confirmed' },
  { title: 'Developer Access Granted', description: 'Access credentials shared with dev team' },
  { title: 'Backend Building Initiated', description: 'Backend development started' },
  { title: 'Integrations Complete', description: 'All required integrations connected' },
  { title: 'Backend Testing', description: 'Testing all backend functionality' },
  { title: 'Security Enhancement', description: 'Security review and hardening' },
  { title: 'Backend V1 Complete', description: 'Backend ready for final review' },
  { title: 'Delivery', description: 'Backend fully integrated' },
  { title: 'Launch', description: 'Full application is live' },
];

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
  const { toast } = useToast();

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

  const frontendMilestones = milestones.filter(m => m.category === 'frontend');
  const backendMilestones = milestones.filter(m => m.category === 'backend');

  const hasFrontendMilestones = frontendMilestones.length > 0;
  const hasBackendMilestones = backendMilestones.length > 0;

  const completedFrontend = frontendMilestones.filter(m => m.status === 'completed').length;
  const completedBackend = backendMilestones.filter(m => m.status === 'completed').length;

  const frontendProgress = frontendMilestones.length > 0 
    ? Math.round((completedFrontend / frontendMilestones.length) * 100) 
    : 0;
  const backendProgress = backendMilestones.length > 0 
    ? Math.round((completedBackend / backendMilestones.length) * 100) 
    : 0;

  // Initialize frontend milestones for a project
  const initializeFrontendMilestones = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const milestonesToInsert = FRONTEND_MILESTONES.map((m, index) => ({
        lead_id: leadId,
        category: 'frontend' as MilestoneCategory,
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
      toast({ title: 'Frontend milestones initialized' });
      fetchMilestones();
    } catch (error: any) {
      toast({ title: 'Error initializing milestones', description: error.message, variant: 'destructive' });
    }
  };

  // Initialize backend milestones for a project
  const initializeBackendMilestones = async (selectedFeatures: string[]) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Create custom description with selected features
      const featuresDescription = selectedFeatures.length > 0 
        ? `Features: ${selectedFeatures.join(', ')}`
        : 'Backend features to be determined';

      const backendMilestonesToInsert = BACKEND_MILESTONES.map((m, index) => ({
        lead_id: leadId,
        category: 'backend' as MilestoneCategory,
        title: m.title,
        description: index === 0 ? featuresDescription : m.description,
        status: 'pending' as MilestoneStatus,
        display_order: index,
        completed_at: null,
        created_by: userData.user?.id || null,
      }));

      const { error } = await supabase
        .from('project_milestones')
        .insert(backendMilestonesToInsert);

      if (error) throw error;
      toast({ title: 'Backend milestones initialized' });
      fetchMilestones();
    } catch (error: any) {
      toast({ title: 'Error initializing backend milestones', description: error.message, variant: 'destructive' });
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

  // Delete all milestones for a category
  const clearMilestones = async (category: MilestoneCategory) => {
    try {
      const { error } = await supabase
        .from('project_milestones')
        .delete()
        .eq('lead_id', leadId)
        .eq('category', category);

      if (error) throw error;
      toast({ title: `${category === 'frontend' ? 'Frontend' : 'Backend'} milestones cleared` });
      fetchMilestones();
    } catch (error: any) {
      toast({ title: 'Error clearing milestones', description: error.message, variant: 'destructive' });
    }
  };

  return {
    milestones,
    frontendMilestones,
    backendMilestones,
    hasFrontendMilestones,
    hasBackendMilestones,
    frontendProgress,
    backendProgress,
    loading,
    refetch: fetchMilestones,
    initializeFrontendMilestones,
    initializeBackendMilestones,
    updateMilestoneStatus,
    clearMilestones,
  };
}
