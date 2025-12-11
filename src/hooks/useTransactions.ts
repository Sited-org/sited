import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  lead_id: string;
  item: string;
  credit: number;
  debit: number;
  notes: string | null;
  transaction_date: string;
  created_at: string;
  created_by: string | null;
}

export interface TransactionWithBalance extends Transaction {
  balance: number;
}

export function useTransactions(leadId: string | undefined) {
  const [transactions, setTransactions] = useState<TransactionWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    if (!leadId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('lead_id', leadId)
      .order('transaction_date', { ascending: true });

    if (error) {
      toast({ title: 'Error fetching transactions', description: error.message, variant: 'destructive' });
    } else {
      // Calculate running balance
      let runningBalance = 0;
      const withBalance = (data || []).map((t) => {
        runningBalance += Number(t.debit) - Number(t.credit);
        return { ...t, balance: runningBalance };
      });
      
      // Reverse for display (newest first) but keep balance calculation
      setTransactions(withBalance.reverse());
      setTotalCredit((data || []).reduce((sum, t) => sum + Number(t.credit), 0));
      setTotalDebit((data || []).reduce((sum, t) => sum + Number(t.debit), 0));
    }
    setLoading(false);
  }, [leadId, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'created_by' | 'balance'>) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('transactions')
      .insert({ ...transaction, created_by: userData.user?.id });

    if (error) {
      toast({ title: 'Error adding transaction', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Transaction recorded' });
    fetchTransactions();
    return { error: null };
  };

  const deleteTransaction = async (transactionId: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) {
      toast({ title: 'Error deleting transaction', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Transaction deleted' });
    fetchTransactions();
    return { error: null };
  };

  return {
    transactions,
    loading,
    totalCredit,
    totalDebit,
    currentBalance: totalDebit - totalCredit,
    addTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}
