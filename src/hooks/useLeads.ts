import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type LeadStatus = 'new' | 'contacted' | 'booked_call' | 'sold' | 'lost';

export interface Lead {
  id: string;
  lead_number: number | null;
  name: string | null;
  email: string;
  phone: string | null;
  business_name: string | null;
  project_type: string;
  form_data: Record<string, unknown>;
  status: LeadStatus;
  notes: string | null;
  last_contacted_at: string | null;
  assigned_to: string | null;
  created_at: string;
  deal_amount: number | null;
  deal_closed_at: string | null;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({
        title: "Error fetching leads",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setLeads(data as Lead[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchLeads();

    // Set up realtime subscription
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeads]);

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', leadId);
    
    if (error) {
      toast({
        title: "Error updating lead",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    toast({
      title: "Lead updated",
      description: `Status changed to ${status.replace('_', ' ')}`
    });
    return true;
  };

  const updateLeadNotes = async (leadId: string, notes: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ notes })
      .eq('id', leadId);
    
    if (error) {
      toast({
        title: "Error updating notes",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const deleteLead = async (leadId: string) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);
    
    if (error) {
      toast({
        title: "Error deleting lead",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    toast({
      title: "Lead deleted",
      description: "The lead has been removed"
    });
    return true;
  };

  const markAsContacted = async (leadId: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ 
        status: 'contacted' as LeadStatus,
        last_contacted_at: new Date().toISOString()
      })
      .eq('id', leadId);
    
    if (error) {
      toast({
        title: "Error updating lead",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    toast({
      title: "Lead marked as contacted"
    });
    return true;
  };

  return {
    leads,
    loading,
    fetchLeads,
    updateLeadStatus,
    updateLeadNotes,
    deleteLead,
    markAsContacted
  };
}
