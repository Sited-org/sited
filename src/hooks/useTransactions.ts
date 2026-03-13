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
  status: 'completed' | 'pending' | 'scheduled' | 'void';
  invoice_status: 'not_sent' | 'sent' | 'processing' | 'paid' | 'void' | null;
  stripe_invoice_id: string | null;
  payment_method: 'stripe' | 'cash' | 'bank_transfer' | 'credit' | 'other' | null;
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

// Helper to determine if a transaction is a real payment (vs internal credit)
function isRealPayment(t: { credit: number; payment_method: string | null; item: string }): boolean {
  if (Number(t.credit) <= 0) return false;
  // Credit additions are internal credits, not real payments
  if (t.payment_method === 'credit') return false;
  if (t.item.toLowerCase().includes('credit added') || t.item.toLowerCase().includes('account credit')) return false;
  if (t.item.toLowerCase().includes('write-off') || t.item.toLowerCase().includes('credit removal')) return false;
  if (t.item.toLowerCase().includes('referral')) return false;
  // Real payments: Stripe paid, cash, bank_transfer, or manual "other" payments
  return (
    t.payment_method === 'stripe' || 
    t.payment_method === 'cash' || 
    t.payment_method === 'bank_transfer' ||
    (t.payment_method === 'other' && !t.item.toLowerCase().includes('credit'))
  );
}

export function useTransactions(leadId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCredit, setTotalCredit] = useState(0); // All credits (for balance calculation)
  const [totalPaid, setTotalPaid] = useState(0); // Only real money received
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

       // IMPORTANT:
       // `is_recurring=true` rows represent a membership schedule/definition (used to generate future previews
       // and to drive automated invoicing). They should NOT affect account balance directly, otherwise the
       // balance is double-counted (one "schedule" row + one real billed invoice row).
       const balanceAffectingTransactions = nonVoidedTransactions.filter(t => !t.is_recurring);
      // Total credit includes ALL credits (for balance calculation purposes)
      // This includes both real payments AND internal credits
      setTotalCredit(nonVoidedTransactions.reduce((sum, t) => sum + Number(t.credit), 0));
      // Total paid = only real money received (Stripe, cash, bank transfer) - NOT internal credits
      setTotalPaid(nonVoidedTransactions.reduce((sum, t) => {
        if (isRealPayment(t)) {
          return sum + Number(t.credit);
        }
        return sum;
      }, 0));
      // Only include debits that are due (transaction_date <= today)
      setTotalDebit(balanceAffectingTransactions.reduce((sum, t) => {
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
      const delta = Number(t.debit) - Number(t.credit);

      // Membership schedule/definition rows should NOT move the balance.
      // Future preview rows *should* show projected balance changes.
      const affectsCurrentBalance = !t.isFuture && !t.is_recurring;
      if (affectsCurrentBalance) {
        runningBalance += delta;
      }
      return { 
        ...t, 
        balance: t.isFuture ? runningBalance + delta : runningBalance 
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
    
    // Check if this is voiding a "sent" invoice that wasn't paid - allow re-invoicing
    const wasInvoiceSentButNotPaid = transaction.invoice_status === 'sent' || transaction.invoice_status === 'processing';
    
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
        status: 'void',
        invoice_status: 'void', // Mark void entry so it can't be invoiced
        parent_transaction_id: transactionId,
        created_by: userData.user?.id,
      });
    
    if (insertError) {
      toast({ title: 'Error voiding transaction', description: insertError.message, variant: 'destructive' });
      return { error: insertError };
    }
    
    // Update original transaction to mark it as voided
    // If invoice was sent but not paid, reset invoice_status to allow re-invoicing
    const updateData: Record<string, unknown> = {
      notes: `${transaction.notes ? transaction.notes + ' | ' : ''}[VOIDED: ${reason}]`,
    };
    
    if (wasInvoiceSentButNotPaid) {
      // Reset to allow re-invoicing after edits - clear the old invoice reference
      updateData.invoice_status = null;
      updateData.stripe_invoice_id = null;
      updateData.status = 'void'; // Mark as void so it shows correctly in history
    } else {
      // For paid invoices or never-sent charges, mark as void to prevent invoicing
      updateData.invoice_status = 'void';
      updateData.status = 'void';
    }
    
    const { error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId);
    
    if (updateError) {
      toast({ title: 'Error updating voided transaction', description: updateError.message, variant: 'destructive' });
      return { error: updateError };
    }
    
    const successMessage = wasInvoiceSentButNotPaid 
      ? 'Invoice voided - charge can now be re-invoiced' 
      : 'Transaction voided successfully';
    toast({ title: successMessage });
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
    // First, check if this transaction has a linked Stripe subscription
    const transaction = transactions.find(t => t.id === transactionId);
    const subscriptionMatch = transaction?.notes?.match(/Stripe Subscription:\s*(sub_\w+)/);
    
    if (subscriptionMatch) {
      // Cancel the Stripe subscription via edge function
      try {
        const { data, error: fnError } = await supabase.functions.invoke('cancel-subscription', {
          body: {
            subscription_id: subscriptionMatch[1],
            lead_id: transaction.lead_id,
            cancel_at_period_end: false,
          },
        });
        if (fnError) throw fnError;
        if (!data?.success) throw new Error(data?.error || 'Failed to cancel Stripe subscription');
        
        toast({ title: 'Subscription cancelled', description: 'Stripe subscription and local record updated' });
        fetchTransactions();
        return { error: null };
      } catch (err: any) {
        toast({ title: 'Error cancelling subscription', description: err.message, variant: 'destructive' });
        return { error: err };
      }
    }

    // No Stripe subscription — just update local record
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
    totalPaid, // Real money received (excludes internal credits)
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
