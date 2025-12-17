import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Membership {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type MembershipInsert = Omit<Membership, 'id' | 'created_at' | 'updated_at'>;
export type MembershipUpdate = Partial<MembershipInsert>;

export function useMemberships() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMemberships = useCallback(async () => {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({ title: 'Error fetching memberships', description: error.message, variant: 'destructive' });
    } else {
      setMemberships((data || []) as Membership[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  const addMembership = async (membership: MembershipInsert) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('memberships')
      .insert({
        name: membership.name,
        description: membership.description,
        price: membership.price,
        billing_interval: membership.billing_interval,
        is_active: membership.is_active,
        created_by: userData.user?.id,
      });

    if (error) {
      toast({ title: 'Error adding membership', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Membership created' });
    fetchMemberships();
    return { error: null };
  };

  const updateMembership = async (id: string, updates: MembershipUpdate) => {
    const { error } = await supabase
      .from('memberships')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating membership', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Membership updated' });
    fetchMemberships();
    return { error: null };
  };

  const deleteMembership = async (id: string) => {
    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error deleting membership', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Membership deleted' });
    fetchMemberships();
    return { error: null };
  };

  return {
    memberships,
    activeMemberships: memberships.filter(m => m.is_active),
    loading,
    addMembership,
    updateMembership,
    deleteMembership,
    refetch: fetchMemberships,
  };
}
