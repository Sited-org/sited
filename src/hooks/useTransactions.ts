import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addWeeks, addMonths, addQuarters, addYears, isBefore, isAfter, startOfDay } from 'date-fns';

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
  is_recurring: boolean;
  recurring_interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null;
  recurring_end_date: string | null;
  parent_transaction_id: string | null;
  status: 'completed' | 'pending' | 'scheduled';
}

export interface TransactionWithBalance extends Transaction {
  balance: number;
  isFuture?: boolean;
}

type RecurringInterval = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

function getNextDate(date: Date, interval: RecurringInterval): Date {
  switch (interval) {
    case 'weekly': return addWeeks(date, 1);
    case 'monthly': return addMonths(date, 1);
    case 'quarterly': return addQuarters(date, 1);
    case 'yearly': return addYears(date, 1);
  }
}

function generateFutureTransactions(
  transaction: Transaction
): TransactionWithBalance[] {
  if (!transaction.is_recurring || !transaction.recurring_interval) return [];
  
  const futures: TransactionWithBalance[] = [];
  const today = startOfDay(new Date());
  const oneMonthFromNow = addMonths(today, 1);
  let nextDate = getNextDate(new Date(transaction.transaction_date), transaction.recurring_interval);
  const endDate = transaction.recurring_end_date ? new Date(transaction.recurring_end_date) : null;
  
  // Only show future transactions up to 1 month ahead
  while (isBefore(nextDate, oneMonthFromNow) || nextDate.getTime() === oneMonthFromNow.getTime()) {
    if (endDate && isAfter(nextDate, endDate)) break;
    
    futures.push({
      ...transaction,
      id: `future-${transaction.id}-${futures.length}`,
      transaction_date: nextDate.toISOString(),
      status: isBefore(nextDate, today) ? 'pending' : 'scheduled',
      parent_transaction_id: transaction.id,
      balance: 0,
      isFuture: true,
    });
    
    nextDate = getNextDate(nextDate, transaction.recurring_interval);
  }
  
  return futures;
}

export function useTransactions(leadId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      setTransactions((data || []) as Transaction[]);
      setTotalCredit((data || []).reduce((sum, t) => sum + Number(t.credit), 0));
      setTotalDebit((data || []).reduce((sum, t) => sum + Number(t.debit), 0));
    }
    setLoading(false);
  }, [leadId, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Process transactions with future recurring previews and balances
  const processedTransactions = useMemo(() => {
    const today = startOfDay(new Date());
    
    // Generate future transactions for recurring items
    const futureTransactions: TransactionWithBalance[] = [];
    transactions.forEach(t => {
      if (t.is_recurring && t.recurring_interval) {
        futureTransactions.push(...generateFutureTransactions(t));
      }
    });
    
    // Combine and sort all transactions
    const allTransactions: TransactionWithBalance[] = [
      ...transactions.map(t => ({ 
        ...t, 
        balance: 0, 
        isFuture: false,
        status: t.status as 'completed' | 'pending' | 'scheduled'
      })),
      ...futureTransactions
    ].sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
    
    // Calculate running balance (only for completed/real transactions)
    let runningBalance = 0;
    const withBalance = allTransactions.map((t) => {
      if (!t.isFuture) {
        runningBalance += Number(t.debit) - Number(t.credit);
      }
      return { 
        ...t, 
        balance: t.isFuture ? runningBalance + Number(t.debit) - Number(t.credit) : runningBalance 
      };
    });
    
    // Reverse for display (newest first)
    return withBalance.reverse();
  }, [transactions]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'created_by' | 'balance'>) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('transactions')
      .insert({ 
        lead_id: transaction.lead_id,
        item: transaction.item,
        credit: transaction.credit,
        debit: transaction.debit,
        notes: transaction.notes,
        transaction_date: transaction.transaction_date,
        is_recurring: transaction.is_recurring,
        recurring_interval: transaction.recurring_interval,
        recurring_end_date: transaction.recurring_end_date,
        status: transaction.status,
        created_by: userData.user?.id 
      });

    if (error) {
      toast({ title: 'Error adding transaction', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Transaction recorded' });
    fetchTransactions();
    return { error: null };
  };

  const deleteTransaction = async (transactionId: string) => {
    // Don't try to delete future preview transactions
    if (transactionId.startsWith('future-')) {
      toast({ title: 'Cannot delete future preview', description: 'Delete the original recurring transaction instead', variant: 'destructive' });
      return { error: new Error('Cannot delete future preview') };
    }
    
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

  const updateTransactionStatus = async (transactionId: string, status: 'completed' | 'pending' | 'scheduled') => {
    const { error } = await supabase
      .from('transactions')
      .update({ status })
      .eq('id', transactionId);

    if (error) {
      toast({ title: 'Error updating transaction', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Transaction updated' });
    fetchTransactions();
    return { error: null };
  };

  const cancelRecurring = async (transactionId: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ is_recurring: false, recurring_interval: null, recurring_end_date: null })
      .eq('id', transactionId);

    if (error) {
      toast({ title: 'Error cancelling recurring', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Recurring payment cancelled' });
    fetchTransactions();
    return { error: null };
  };

  return {
    transactions: processedTransactions,
    rawTransactions: transactions,
    loading,
    totalCredit,
    totalDebit,
    currentBalance: totalDebit - totalCredit,
    addTransaction,
    deleteTransaction,
    updateTransactionStatus,
    cancelRecurring,
    refetch: fetchTransactions,
  };
}
