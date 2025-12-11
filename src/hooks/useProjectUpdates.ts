import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProjectUpdate {
  id: string;
  lead_id: string;
  content: string;
  created_at: string;
  created_by: string | null;
}

export function useProjectUpdates(leadId: string | undefined) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUpdates = useCallback(async () => {
    if (!leadId) {
      setUpdates([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('project_updates')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching updates', description: error.message, variant: 'destructive' });
    } else {
      setUpdates(data || []);
    }
    setLoading(false);
  }, [leadId, toast]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const addUpdate = async (content: string) => {
    if (!leadId) return { error: new Error('No lead ID') };
    
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('project_updates')
      .insert({ 
        lead_id: leadId, 
        content, 
        created_by: userData.user?.id 
      });

    if (error) {
      toast({ title: 'Error adding update', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Update added' });
    fetchUpdates();
    return { error: null };
  };

  const deleteUpdate = async (updateId: string) => {
    const { error } = await supabase
      .from('project_updates')
      .delete()
      .eq('id', updateId);

    if (error) {
      toast({ title: 'Error deleting update', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Update deleted' });
    fetchUpdates();
    return { error: null };
  };

  return {
    updates,
    loading,
    addUpdate,
    deleteUpdate,
    refetch: fetchUpdates,
  };
}
