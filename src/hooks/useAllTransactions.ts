import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfDay, isAfter } from 'date-fns';

export interface GlobalTransaction {
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
  // Joined lead data
  lead?: {
    id: string;
    business_name: string | null;
    name: string | null;
    email: string;
  };
}

export interface AccountSummary {
  lead_id: string;
  business_name: string | null;
  name: string | null;
  email: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  outstandingInvoices: number;
  pendingCharges: number;
}

export function useAllTransactions() {
  const [transactions, setTransactions] = useState<GlobalTransaction[]>([]);
  const [leads, setLeads] = useState<Record<string, { business_name: string | null; name: string | null; email: string }>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    
    // Fetch all transactions
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (txError) {
      toast({ title: 'Error fetching transactions', description: txError.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Fetch all leads for mapping
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('id, business_name, name, email');

    if (leadsError) {
      toast({ title: 'Error fetching leads', description: leadsError.message, variant: 'destructive' });
    }

    const leadsMap: Record<string, { business_name: string | null; name: string | null; email: string }> = {};
    (leadsData || []).forEach(lead => {
      leadsMap[lead.id] = {
        business_name: lead.business_name,
        name: lead.name,
        email: lead.email,
      };
    });

    setLeads(leadsMap);
    setTransactions((txData || []).map(tx => ({
      ...tx,
      lead: leadsMap[tx.lead_id] ? { id: tx.lead_id, ...leadsMap[tx.lead_id] } : undefined,
    })) as GlobalTransaction[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Helper to check if a transaction is a real payment (not internal credit)
  const isRealPayment = (t: GlobalTransaction): boolean => {
    if (Number(t.credit) <= 0) return false;
    // Credit additions are internal credits, not real payments
    if (t.payment_method === 'credit') return false;
    if (t.item.toLowerCase().includes('credit added') || t.item.toLowerCase().includes('account credit')) return false;
    if (t.item.toLowerCase().includes('write-off') || t.item.toLowerCase().includes('credit removal')) return false;
    // Real payments: Stripe paid, cash, bank_transfer, or manual "other" payments
    return (
      t.invoice_status === 'paid' || 
      t.payment_method === 'cash' || 
      t.payment_method === 'bank_transfer' ||
      (t.payment_method === 'other' && !t.item.toLowerCase().includes('credit'))
    );
  };

  // Helper to check if transaction is internal credit (should be hidden from financial page)
  const isInternalCredit = (t: GlobalTransaction): boolean => {
    if (Number(t.credit) <= 0) return false;
    return (
      t.payment_method === 'credit' ||
      t.item.toLowerCase().includes('credit added') ||
      t.item.toLowerCase().includes('account credit') ||
      t.item.toLowerCase().includes('write-off') ||
      t.item.toLowerCase().includes('credit removal')
    );
  };

  // Filter transactions for display (hide internal credits)
  const displayTransactions = useMemo(() => {
    return transactions.filter(t => !isInternalCredit(t));
  }, [transactions]);

  // Get pending invoices (sent but not paid, and due)
  // CRITICAL: Also check invoice_status !== 'void' to catch voided invoices
  const pendingInvoicesList = useMemo(() => {
    const today = startOfDay(new Date());
    return transactions.filter(t => {
      // Exclude void entries and voided transactions
      if (t.item.startsWith('VOID:')) return false;
      if (t.notes?.includes('[VOIDED:')) return false;
      if (t.status === 'void') return false;
      if (t.invoice_status === 'void') return false; // Explicitly check invoice_status is not void
      if (Number(t.debit) <= 0) return false;
      const transactionDate = startOfDay(new Date(t.transaction_date));
      const isDue = !isAfter(transactionDate, today);
      return isDue && (t.invoice_status === 'sent' || t.invoice_status === 'processing');
    });
  }, [transactions]);

  // Calculate per-account summaries (moved before metrics since metrics depends on it)
  const accountSummaries = useMemo((): AccountSummary[] => {
    const today = startOfDay(new Date());
    const summaries: Record<string, AccountSummary> = {};

    transactions.forEach(t => {
      if (!summaries[t.lead_id]) {
        const lead = leads[t.lead_id];
        summaries[t.lead_id] = {
          lead_id: t.lead_id,
          business_name: lead?.business_name || null,
          name: lead?.name || null,
          email: lead?.email || 'Unknown',
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
          outstandingInvoices: 0,
          pendingCharges: 0,
        };
      }

      // Skip void transactions
      if (t.item.startsWith('VOID:') || t.notes?.includes('[VOIDED:') || t.status === 'void') {
        return;
      }

      const transactionDate = startOfDay(new Date(t.transaction_date));
      const isDue = !isAfter(transactionDate, today);

      // Only count due transactions towards balance
      if (isDue) {
        summaries[t.lead_id].totalDebit += Number(t.debit);
        summaries[t.lead_id].totalCredit += Number(t.credit);
      }

      if (isDue && Number(t.debit) > 0 && (t.invoice_status === 'sent' || t.invoice_status === 'processing')) {
        summaries[t.lead_id].outstandingInvoices += 1;
      }

      if (isDue && Number(t.debit) > 0 && (!t.invoice_status || t.invoice_status === 'not_sent')) {
        summaries[t.lead_id].pendingCharges += 1;
      }
    });

    // Calculate balances
    Object.values(summaries).forEach(s => {
      s.balance = s.totalDebit - s.totalCredit;
    });

    return Object.values(summaries).sort((a, b) => b.balance - a.balance);
  }, [transactions, leads]);

  // Calculate global metrics
  const metrics = useMemo(() => {
    // Filter out void transactions
    const activeTransactions = transactions.filter(t => 
      !t.item.startsWith('VOID:') && 
      !t.notes?.includes('[VOIDED:') &&
      t.status !== 'void'
    );

    let totalRevenue = 0;

    activeTransactions.forEach(t => {
      // Total revenue = ONLY real payments (Stripe paid + manual payments like cash/bank)
      // Excludes internal credits
      if (isRealPayment(t)) {
        totalRevenue += Number(t.credit);
      }
    });

    // Total Outstanding = sum of all positive account balances
    // Account balances already exclude future charges
    const totalOutstanding = accountSummaries.reduce((sum, account) => {
      return sum + Math.max(0, account.balance);
    }, 0);

    // Pending invoices count
    const pendingInvoices = pendingInvoicesList.length;

    return {
      totalRevenue,
      totalOutstanding,
      pendingInvoices,
      totalTransactions: displayTransactions.length,
    };
  }, [transactions, displayTransactions, accountSummaries, pendingInvoicesList]);

  // Zero out an account (admin only) - also marks all pending invoices as void
  const zeroAccount = async (leadId: string, reason: string) => {
    const { data: userData } = await supabase.auth.getUser();
    
    // Get account summary
    const account = accountSummaries.find(a => a.lead_id === leadId);
    if (!account) {
      toast({ title: 'Account not found', variant: 'destructive' });
      return { error: new Error('Account not found') };
    }

    const balance = account.balance;
    
    if (balance === 0) {
      toast({ title: 'Account already at zero' });
      return { error: null };
    }

    // First, mark all pending/sent invoices for this account as void
    // This prevents "pending invoices" from showing after account is zeroed
    const pendingInvoicesForAccount = transactions.filter(t => 
      t.lead_id === leadId &&
      Number(t.debit) > 0 &&
      (t.invoice_status === 'sent' || t.invoice_status === 'processing') &&
      !t.item.startsWith('VOID:') &&
      !t.notes?.includes('[VOIDED:') &&
      t.status !== 'void'
    );

    // Update all pending invoices to void status
    for (const tx of pendingInvoicesForAccount) {
      await supabase.from('transactions').update({
        invoice_status: 'void',
        status: 'void',
        notes: `${tx.notes ? tx.notes + ' | ' : ''}[VOIDED: Account zeroed - ${reason}]`,
      }).eq('id', tx.id);
    }

    // Create a write-off transaction
    const { error } = await supabase
      .from('transactions')
      .insert({
        lead_id: leadId,
        item: balance > 0 ? 'Account Write-off (Balance Cleared)' : 'Credit Removal (Balance Cleared)',
        credit: balance > 0 ? balance : 0, // If owing, add credit to zero it
        debit: balance < 0 ? Math.abs(balance) : 0, // If credit, add debit to zero it
        notes: `Admin action: ${reason}`,
        transaction_date: new Date().toISOString(),
        is_recurring: false,
        status: 'completed',
        invoice_status: 'paid', // Mark as resolved
        payment_method: 'other',
        created_by: userData.user?.id,
      });

    if (error) {
      toast({ title: 'Error zeroing account', description: error.message, variant: 'destructive' });
      return { error };
    }

    const voidedCount = pendingInvoicesForAccount.length;
    const message = voidedCount > 0 
      ? `Account zeroed & ${voidedCount} pending invoice(s) voided`
      : 'Account zeroed successfully';
    toast({ title: message });
    fetchTransactions();
    return { error: null };
  };

  // Void a single transaction (matches useTransactions logic exactly)
  const voidTransaction = async (transactionId: string, reason: string) => {
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

  // Void all outstanding invoices for an account (uses same logic as single void)
  const voidAllOutstanding = async (leadId: string, reason: string) => {
    // Get all outstanding invoices for this lead
    const outstanding = transactions.filter(t => 
      t.lead_id === leadId &&
      Number(t.debit) > 0 &&
      (t.invoice_status === 'sent' || t.invoice_status === 'processing') &&
      !t.item.startsWith('VOID:') &&
      !t.notes?.includes('[VOIDED:') &&
      t.status !== 'void'
    );

    if (outstanding.length === 0) {
      toast({ title: 'No outstanding invoices to void' });
      return { error: null };
    }

    // Void each invoice using the same single void logic
    let successCount = 0;
    for (const tx of outstanding) {
      const result = await voidTransaction(tx.id, `Bulk void: ${reason}`);
      if (!result.error) {
        successCount++;
      }
    }

    if (successCount > 0) {
      toast({ title: `${successCount} invoice(s) voided - charges can be re-invoiced` });
    }
    return { error: null };
  };

  return {
    transactions: displayTransactions,
    allTransactions: transactions,
    pendingInvoices: pendingInvoicesList,
    loading,
    metrics,
    accountSummaries,
    zeroAccount,
    voidTransaction,
    voidAllOutstanding,
    refetch: fetchTransactions,
  };
}
