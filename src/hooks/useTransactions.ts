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
  invoice_status: 'not_sent' | 'sent' | 'processing' | 'paid' | null;
  stripe_invoice_id: string | null;
  payment_method: 'stripe' | 'cash' | 'bank_transfer' | 'other' | null;
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
      const today = startOfDay(new Date());
      setTransactions((data || []) as Transaction[]);
      // Exclude voided transactions from totals (both VOID entries and transactions marked as voided)
      // Only count debits where transaction_date <= today (past or current charges)
      const nonVoidedTransactions = (data || []).filter(t => 
        !t.item.startsWith('VOID:') && !t.notes?.includes('[VOIDED:')
      );
      setTotalCredit(nonVoidedTransactions.reduce((sum, t) => sum + Number(t.credit), 0));
      // Only include debits that are due (transaction_date <= today)
      setTotalDebit(nonVoidedTransactions.reduce((sum, t) => {
        const transactionDate = startOfDay(new Date(t.transaction_date));
        const isDue = !isAfter(transactionDate, today);
        return sum + (isDue ? Number(t.debit) : 0);
      }, 0));
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
      ...transactions.map(t => {
        const transactionDate = startOfDay(new Date(t.transaction_date));
        const isFutureCharge = isAfter(transactionDate, today);
        return { 
          ...t, 
          balance: 0, 
          isFuture: isFutureCharge, // Mark as future if date is after today
          status: t.status as 'completed' | 'pending' | 'scheduled'
        };
      }),
      ...futureTransactions
    ].sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
    
    // Calculate running balance (only for due transactions - not future)
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

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'created_by'>) => {
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
        invoice_status: transaction.invoice_status || 'not_sent',
        stripe_invoice_id: transaction.stripe_invoice_id || null,
        payment_method: transaction.payment_method || 'stripe',
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
    
    // Check if transaction can be deleted
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      // Prevent deletion if invoice was sent or paid (unless it's a void entry)
      const isVoidEntry = transaction.item.startsWith('VOID:');
      if (!isVoidEntry && (transaction.invoice_status === 'sent' || transaction.invoice_status === 'paid' || transaction.invoice_status === 'processing')) {
        toast({ title: 'Cannot delete', description: 'Transactions with sent or paid invoices cannot be deleted. Use Void instead.', variant: 'destructive' });
        return { error: new Error('Cannot delete invoiced transaction') };
      }
      // Prevent deletion of credit/payment transactions (but allow void entries)
      if (Number(transaction.credit) > 0 && !isVoidEntry) {
        toast({ title: 'Cannot delete payment', description: 'Payment records cannot be deleted. Use Void instead.', variant: 'destructive' });
        return { error: new Error('Cannot delete payment transaction') };
      }
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

  const voidTransaction = async (transactionId: string, reason: string) => {
    if (transactionId.startsWith('future-')) {
      toast({ title: 'Cannot void future preview', variant: 'destructive' });
      return { error: new Error('Cannot void future preview') };
    }
    
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) {
      toast({ title: 'Transaction not found', variant: 'destructive' });
      return { error: new Error('Transaction not found') };
    }
    
    const { data: userData } = await supabase.auth.getUser();
    const voidAmount = Number(transaction.debit) > 0 ? Number(transaction.debit) : Number(transaction.credit);
    const isDebit = Number(transaction.debit) > 0;
    
    // Create a void transaction (reverses the original)
    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        lead_id: transaction.lead_id,
        item: `VOID: ${transaction.item}`,
        credit: isDebit ? voidAmount : 0, // If original was debit, void as credit
        debit: isDebit ? 0 : voidAmount, // If original was credit, void as debit
        notes: `Reason: ${reason}`,
        transaction_date: new Date().toISOString(),
        is_recurring: false,
        recurring_interval: null,
        recurring_end_date: null,
        status: 'completed',
        invoice_status: 'paid', // Mark as paid so it can't be invoiced
        parent_transaction_id: transactionId,
        created_by: userData.user?.id,
      });
    
    if (insertError) {
      toast({ title: 'Error voiding transaction', description: insertError.message, variant: 'destructive' });
      return { error: insertError };
    }
    
    // Update original transaction to mark it as voided
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        notes: `${transaction.notes ? transaction.notes + ' | ' : ''}[VOIDED: ${reason}]`,
        invoice_status: 'paid' // Prevent further invoicing
      })
      .eq('id', transactionId);
    
    if (updateError) {
      toast({ title: 'Error updating voided transaction', description: updateError.message, variant: 'destructive' });
      return { error: updateError };
    }
    
    toast({ title: 'Transaction voided successfully' });
    fetchTransactions();
    return { error: null };
  };

  const canDeleteTransaction = (transaction: Transaction | TransactionWithBalance): boolean => {
    // Void entries can always be deleted
    const isVoidEntry = transaction.item.startsWith('VOID:');
    if (isVoidEntry) {
      return true;
    }
    // Cannot delete if invoice was sent or paid
    if (transaction.invoice_status === 'sent' || transaction.invoice_status === 'paid' || transaction.invoice_status === 'processing') {
      return false;
    }
    // Cannot delete credit/payment transactions
    if (Number(transaction.credit) > 0) {
      return false;
    }
    // Cannot delete future previews
    if ('isFuture' in transaction && transaction.isFuture) {
      return false;
    }
    return true;
  };

  const canVoidTransaction = (transaction: Transaction | TransactionWithBalance): boolean => {
    // Cannot void future previews
    if ('isFuture' in transaction && transaction.isFuture) {
      return false;
    }
    // Can only void if invoice was sent/paid OR if it's a payment (credit)
    const isInvoiced = transaction.invoice_status === 'sent' || transaction.invoice_status === 'paid' || transaction.invoice_status === 'processing';
    const isPayment = Number(transaction.credit) > 0;
    // Check if already voided
    const isVoided = transaction.item.startsWith('VOID:') || (transaction.notes?.includes('[VOIDED:') ?? false);
    
    return (isInvoiced || isPayment) && !isVoided;
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
    voidTransaction,
    canDeleteTransaction,
    canVoidTransaction,
    updateTransactionStatus,
    cancelRecurring,
    refetch: fetchTransactions,
  };
}
