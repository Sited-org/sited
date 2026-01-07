import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface ClientRequest {
  id: string;
  lead_id: string;
  title: string;
  description: string | null;
  priority: RequestPriority;
  status: RequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  assigned_to: string | null;
  lead?: {
    name: string | null;
    email: string;
    business_name: string | null;
  };
}

export function useClientRequests(leadId?: string) {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('client_requests')
        .select(`
          *,
          lead:leads(name, email, business_name)
        `)
        .order('created_at', { ascending: false });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests((data as unknown as ClientRequest[]) || []);
    } catch (error: any) {
      console.error('Error fetching client requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('client_requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_requests' },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests]);

  const createRequest = async (data: {
    lead_id: string;
    title: string;
    description?: string;
    priority?: RequestPriority;
  }) => {
    const { error } = await supabase.from('client_requests').insert(data);
    if (error) {
      toast.error('Failed to create request');
      throw error;
    }
    toast.success('Request submitted successfully');
  };

  const updateRequest = async (
    id: string,
    data: Partial<Pick<ClientRequest, 'status' | 'admin_notes' | 'assigned_to' | 'priority'>>
  ) => {
    const updateData: any = { ...data };
    if (data.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('client_requests')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update request');
      throw error;
    }
    toast.success('Request updated');
  };

  const deleteRequest = async (id: string) => {
    const { error } = await supabase.from('client_requests').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete request');
      throw error;
    }
    toast.success('Request deleted');
  };

  return {
    requests,
    loading,
    createRequest,
    updateRequest,
    deleteRequest,
    refetch: fetchRequests,
  };
}
