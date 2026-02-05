import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { DollarSign, TrendingUp, Target, Users, Wallet, Clock } from 'lucide-react';

export default function SalesDashboard() {
  const { leads, loading } = useLeads();
  const metrics = useDashboardMetrics(leads);

  const recentLeads = useMemo(() => {
    return [...leads]
      .filter(l => ['new', 'contacted', 'booked_call'].includes(l.status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [leads]);

  if (loading) {
    return <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>;
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Dashboard</h1>
        <p className="text-muted-foreground">Performance metrics and active leads</p>
      </div>

      {/* Performance Stats - Real metrics only */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Month Revenue</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(metrics.monthRevenue)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="h-4 w-4" />
            <span className="text-xs">Deals Closed</span>
          </div>
          <p className="text-xl font-bold">{metrics.closedDeals}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs">Active Pipeline</span>
          </div>
          <p className="text-xl font-bold">{metrics.activeLeads}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Conversion Rate</span>
          </div>
          <p className="text-xl font-bold">{metrics.conversionRate}%</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Wallet className="h-4 w-4" />
            <span className="text-xs">Pipeline Value</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(metrics.pipelineValue)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Avg Deal</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(metrics.avgDealSize)}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/leads"
          className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
        >
          <Users className="h-4 w-4" />
          View All Leads
        </Link>
      </div>

      {/* Active Pipeline */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Active Pipeline</h3>
        {recentLeads.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active leads in pipeline</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                to={`/admin/leads/${lead.id}`}
                className="block p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-muted-foreground">#{lead.lead_number}</span>
                  <LeadStatusBadge status={lead.status} formData={lead.form_data} />
                </div>
                <h4 className="font-medium truncate">{lead.name || lead.email}</h4>
                <p className="text-sm text-muted-foreground truncate">{lead.business_name || 'No business'}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span className="capitalize">{lead.project_type}</span>
                  <span>{format(new Date(lead.created_at), 'MMM d')}</span>
                </div>
                {lead.deal_amount && Number(lead.deal_amount) > 0 && (
                  <p className="text-sm font-medium text-primary mt-2">
                    {formatCurrency(Number(lead.deal_amount))}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}