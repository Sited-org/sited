import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, startOfWeek, differenceInDays, startOfDay, isAfter } from 'date-fns';

interface DashboardMetrics {
  // Revenue
  totalRevenue: number;
  monthRevenue: number;
  weekRevenue: number;
  revenueGrowth: number;
  
  // Receivables
  totalOutstanding: number;
  paidInvoices: number;
  pendingInvoices: number;
  collectionRate: number;
  
  // Leads
  totalLeads: number;
  newLeadsThisWeek: number;
  activeLeads: number;
  conversionRate: number;
  avgLeadToClose: number;
  
  // Deals
  avgDealSize: number;
  pipelineValue: number;
  closedDeals: number;
}

interface Lead {
  id: string;
  status: string;
  created_at: string;
  deal_amount: number | null;
  deal_closed_at: string | null;
}

interface Transaction {
  id: string;
  lead_id: string;
  credit: number;
  debit: number;
  invoice_status: string | null;
  transaction_date: string;
  stripe_invoice_id: string | null;
  payment_method: string | null;
  status: string | null;
  item: string;
  notes: string | null;
}

// Helper to check if a transaction is a real payment (not internal credit)
const isRealPayment = (t: Transaction): boolean => {
  if (Number(t.credit) <= 0) return false;
  if (t.payment_method === 'credit') return false;
  if (t.item.toLowerCase().includes('credit added') || t.item.toLowerCase().includes('account credit')) return false;
  if (t.item.toLowerCase().includes('write-off') || t.item.toLowerCase().includes('credit removal')) return false;
  if (t.item.toLowerCase().includes('referral')) return false;
  return (
    t.invoice_status === 'paid' || 
    t.payment_method === 'cash' || 
    t.payment_method === 'bank_transfer' ||
    (t.payment_method === 'other' && !t.item.toLowerCase().includes('credit'))
  );
};

// Helper to check if transaction is voided
const isVoided = (t: Transaction): boolean => {
  return (
    t.item.startsWith('VOID:') ||
    t.notes?.includes('[VOIDED:') ||
    t.status === 'void' ||
    t.invoice_status === 'void'
  );
};

export function useDashboardMetrics(leads: Lead[], selectedMonth?: Date) {
  const { data: allTransactions = [] } = useQuery({
    queryKey: ['all-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, lead_id, credit, debit, invoice_status, transaction_date, stripe_invoice_id, payment_method, status, item, notes');
      if (error) throw error;
      return data as Transaction[];
    }
  });

  const metrics = useMemo<DashboardMetrics>(() => {
    const now = new Date();
    const targetMonth = selectedMonth || now;
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    const weekStart = startOfWeek(now);
    const lastMonthStart = startOfMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1));
    const lastMonthEnd = endOfMonth(lastMonthStart);
    const today = startOfDay(now);

    // Filter out voided transactions
    const activeTransactions = allTransactions.filter(t => !isVoided(t));
    
    // Real payments only (Stripe paid + manual payments)
    const realPayments = activeTransactions.filter(t => isRealPayment(t));
    
    // Total revenue = all time real payments
    const totalRevenue = realPayments.reduce((sum, t) => sum + Number(t.credit || 0), 0);
    
    // Month revenue = real payments in selected month
    const monthRevenue = realPayments
      .filter(t => {
        const date = new Date(t.transaction_date);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, t) => sum + Number(t.credit || 0), 0);
    
    // Week revenue = real payments this week
    const weekRevenue = realPayments
      .filter(t => new Date(t.transaction_date) >= weekStart)
      .reduce((sum, t) => sum + Number(t.credit || 0), 0);
    
    // Last month revenue for growth calculation
    const lastMonthRevenue = realPayments
      .filter(t => {
        const date = new Date(t.transaction_date);
        return date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, t) => sum + Number(t.credit || 0), 0);
    
    const revenueGrowth = lastMonthRevenue > 0 
      ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) 
      : 0;

    // Calculate account balances (same logic as useAllTransactions)
    const accountBalances: Record<string, { debit: number; credit: number }> = {};
    activeTransactions.forEach(t => {
      const transactionDate = startOfDay(new Date(t.transaction_date));
      const isDue = !isAfter(transactionDate, today);
      
      if (isDue) {
        if (!accountBalances[t.lead_id]) {
          accountBalances[t.lead_id] = { debit: 0, credit: 0 };
        }
        accountBalances[t.lead_id].debit += Number(t.debit);
        accountBalances[t.lead_id].credit += Number(t.credit);
      }
    });

    // Total Outstanding = sum of all POSITIVE account balances (same as Financial page)
    const totalOutstanding = Object.values(accountBalances).reduce((sum, account) => {
      const balance = account.debit - account.credit;
      return sum + Math.max(0, balance);
    }, 0);

    // Pending invoices = sent invoices that are due and NOT voided
    const pendingInvoicesList = activeTransactions.filter(t => {
      if (Number(t.debit) <= 0) return false;
      const transactionDate = startOfDay(new Date(t.transaction_date));
      const isDue = !isAfter(transactionDate, today);
      return isDue && (t.invoice_status === 'sent' || t.invoice_status === 'processing');
    });
    
    // Invoices sent (not voided) - for collection rate calculation
    const invoicesSent = activeTransactions.filter(t => 
      Number(t.debit) > 0 && 
      t.stripe_invoice_id && 
      (t.invoice_status === 'sent' || t.invoice_status === 'processing' || t.invoice_status === 'paid')
    );
    
    const paidInvoiceCount = invoicesSent.filter(t => t.invoice_status === 'paid').length;
    const totalInvoicesSent = invoicesSent.length;
    
    // Collection rate = paid invoices / total invoices sent (excluding voided)
    const collectionRate = totalInvoicesSent > 0 
      ? Math.round((paidInvoiceCount / totalInvoicesSent) * 100) 
      : 100;

    // Lead metrics
    const totalLeads = leads.length;
    const newLeadsThisWeek = leads.filter(l => new Date(l.created_at) >= weekStart).length;
    const activeLeads = leads.filter(l => 
      ['warm_lead', 'new_lead', 'new_client', 'new', 'contacted', 'booked_call'].includes(l.status)
    ).length;
    const soldLeads = leads.filter(l => ['mbr_sold_dev', 'current_mbr', 'ot_sold_dev', 'current_ot', 'sold'].includes(l.status));
    const lostLeads = leads.filter(l => l.status === 'lost');
    const closedLeads = soldLeads.length + lostLeads.length;
    const conversionRate = closedLeads > 0 ? Math.round((soldLeads.length / closedLeads) * 100) : 0;

    // Average lead to close time (days)
    const leadsWithCloseTime = soldLeads.filter(l => l.deal_closed_at);
    const avgLeadToClose = leadsWithCloseTime.length > 0
      ? Math.round(
          leadsWithCloseTime.reduce((sum, l) => {
            const created = new Date(l.created_at);
            const closed = new Date(l.deal_closed_at!);
            return sum + differenceInDays(closed, created);
          }, 0) / leadsWithCloseTime.length
        )
      : 0;

    // Deal metrics
    const totalDealValue = soldLeads.reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0);
    const avgDealSize = soldLeads.length > 0 ? Math.round(totalDealValue / soldLeads.length) : 0;
    const pipelineValue = leads
      .filter(l => ['warm_lead', 'new_lead', 'new_client', 'new', 'contacted', 'booked_call'].includes(l.status))
      .reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0);

    return {
      totalRevenue,
      monthRevenue,
      weekRevenue,
      revenueGrowth,
      totalOutstanding,
      paidInvoices: paidInvoiceCount,
      pendingInvoices: pendingInvoicesList.length,
      collectionRate,
      totalLeads,
      newLeadsThisWeek,
      activeLeads,
      conversionRate,
      avgLeadToClose,
      avgDealSize,
      pipelineValue,
      closedDeals: soldLeads.length,
    };
  }, [leads, allTransactions, selectedMonth]);

  return metrics;
}
