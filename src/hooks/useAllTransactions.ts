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
  const pendingInvoicesList = useMemo(() => {
    const today = startOfDay(new Date());
    return transactions.filter(t => {
      if (t.item.startsWith('VOID:') || t.notes?.includes('[VOIDED:') || t.status === 'void') return false;
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

  // Zero out an account (admin only)
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

    toast({ title: 'Account zeroed successfully' });
    fetchTransactions();
    return { error: null };
  };

  // Void all outstanding invoices for an account
  const voidAllOutstanding = async (leadId: string, reason: string) => {
    const { data: userData } = await supabase.auth.getUser();
    
    // Get all outstanding invoices for this lead
    const outstanding = transactions.filter(t => 
      t.lead_id === leadId &&
      Number(t.debit) > 0 &&
      (t.invoice_status === 'sent' || t.invoice_status === 'processing') &&
      !t.item.startsWith('VOID:') &&
      !t.notes?.includes('[VOIDED:')
    );

    if (outstanding.length === 0) {
      toast({ title: 'No outstanding invoices to void' });
      return { error: null };
    }

    // Void each invoice
    for (const tx of outstanding) {
      // Create void entry
      await supabase.from('transactions').insert({
        lead_id: tx.lead_id,
        item: `VOID: ${tx.item}`,
        credit: Number(tx.debit),
        debit: 0,
        notes: `Admin bulk void: ${reason}`,
        transaction_date: new Date().toISOString(),
        is_recurring: false,
        status: 'void',
        invoice_status: 'void',
        parent_transaction_id: tx.id,
        created_by: userData.user?.id,
      });

      // Mark original as voided
      await supabase.from('transactions').update({
        notes: `${tx.notes ? tx.notes + ' | ' : ''}[VOIDED: ${reason}]`,
        invoice_status: 'void',
        status: 'void',
      }).eq('id', tx.id);
    }

    toast({ title: `${outstanding.length} invoice(s) voided` });
    fetchTransactions();
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
    voidAllOutstanding,
    refetch: fetchTransactions,
  };
}
