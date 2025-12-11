import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  lead_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export function usePayments(leadId: string | undefined) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);
  const { toast } = useToast();

  const fetchPayments = useCallback(async () => {
    if (!leadId) {
      setPayments([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('lead_id', leadId)
      .order('payment_date', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching payments', description: error.message, variant: 'destructive' });
    } else {
      setPayments(data || []);
      setTotalPaid((data || []).reduce((sum, p) => sum + Number(p.amount), 0));
    }
    setLoading(false);
  }, [leadId, toast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const addPayment = async (payment: Omit<Payment, 'id' | 'created_at' | 'created_by'>) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('payments')
      .insert({ ...payment, created_by: userData.user?.id });

    if (error) {
      toast({ title: 'Error adding payment', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Payment recorded' });
    fetchPayments();
    return { error: null };
  };

  const deletePayment = async (paymentId: string) => {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      toast({ title: 'Error deleting payment', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Payment deleted' });
    fetchPayments();
    return { error: null };
  };

  return {
    payments,
    loading,
    totalPaid,
    addPayment,
    deletePayment,
    refetch: fetchPayments,
  };
}
