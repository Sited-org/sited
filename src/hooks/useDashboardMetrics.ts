import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfMonth, startOfWeek, differenceInDays } from 'date-fns';

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
  credit: number;
  debit: number;
  invoice_status: string | null;
  transaction_date: string;
  stripe_invoice_id: string | null;
  payment_method: string | null;
}

export function useDashboardMetrics(leads: Lead[]) {
  // Fetch all transactions for metrics
  const { data: allTransactions = [] } = useQuery({
    queryKey: ['all-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, credit, debit, invoice_status, transaction_date, lead_id, stripe_invoice_id, payment_method');
      if (error) throw error;
      return data as Transaction[];
    }
  });

  const metrics = useMemo<DashboardMetrics>(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const weekStart = startOfWeek(now);
    const lastMonthStart = startOfMonth(subDays(monthStart, 1));

    // Stripe-processed transactions (have stripe_invoice_id)
    const stripeTransactions = allTransactions.filter(t => t.stripe_invoice_id);
    
    // Manual payments (cash, bank_transfer, other - no stripe_invoice_id but have credit and specific payment_method)
    const manualPayments = allTransactions.filter(t => 
      !t.stripe_invoice_id && 
      Number(t.credit) > 0 && 
      t.payment_method && 
      ['cash', 'bank_transfer', 'other'].includes(t.payment_method)
    );
    
    // Revenue = PAID Stripe transactions + manual payments
    const paidStripeTransactions = stripeTransactions.filter(t => t.invoice_status === 'paid');
    const allPaidTransactions = [...paidStripeTransactions, ...manualPayments];
    
    const totalRevenue = allPaidTransactions.reduce((sum, t) => sum + Number(t.credit || 0), 0);
    const monthRevenue = allPaidTransactions
      .filter(t => new Date(t.transaction_date) >= monthStart)
      .reduce((sum, t) => sum + Number(t.credit || 0), 0);
    const weekRevenue = allPaidTransactions
      .filter(t => new Date(t.transaction_date) >= weekStart)
      .reduce((sum, t) => sum + Number(t.credit || 0), 0);
    
    // Last month revenue for growth calculation
    const lastMonthRevenue = allPaidTransactions
      .filter(t => {
        const date = new Date(t.transaction_date);
        return date >= lastMonthStart && date < monthStart;
      })
      .reduce((sum, t) => sum + Number(t.credit || 0), 0);
    const revenueGrowth = lastMonthRevenue > 0 
      ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) 
      : 0;

    // Outstanding = Stripe invoices that are 'sent' (not yet paid)
    const sentInvoices = stripeTransactions.filter(t => t.invoice_status === 'sent');
    const totalOutstanding = sentInvoices.reduce((sum, t) => sum + Number(t.debit || 0), 0);
    
    // Invoice counts for collection rate (Stripe only - manual payments don't have invoices)
    const paidInvoiceCount = paidStripeTransactions.length;
    const sentInvoiceCount = sentInvoices.length;
    const totalInvoicesSentOrPaid = paidInvoiceCount + sentInvoiceCount;
    
    // Collection rate = paid invoices / (paid + sent invoices)
    const collectionRate = totalInvoicesSentOrPaid > 0 
      ? Math.round((paidInvoiceCount / totalInvoicesSentOrPaid) * 100) 
      : 100;

    // Lead metrics
    const totalLeads = leads.length;
    const newLeadsThisWeek = leads.filter(l => new Date(l.created_at) >= weekStart).length;
    const activeLeads = leads.filter(l => 
      ['new', 'contacted', 'booked_call'].includes(l.status)
    ).length;
    const soldLeads = leads.filter(l => l.status === 'sold');
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
      .filter(l => ['new', 'contacted', 'booked_call'].includes(l.status))
      .reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0);

    return {
      totalRevenue,
      monthRevenue,
      weekRevenue,
      revenueGrowth,
      totalOutstanding,
      paidInvoices: paidInvoiceCount,
      pendingInvoices: sentInvoiceCount,
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
  }, [leads, allTransactions]);

  return metrics;
}
