import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useFormSessions } from '@/hooks/useFormSessions';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { StatsCard } from '@/components/admin/StatsCard';
import { LeadsChart } from '@/components/admin/LeadsChart';
import { ConversionFunnel } from '@/components/admin/ConversionFunnel';
import { SourceBreakdown } from '@/components/admin/SourceBreakdown';
import { LiveSessionCard } from '@/components/admin/LiveSessionCard';
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge';
import { 
  Users, TrendingUp, Activity, DollarSign, 
  Receipt, Clock, Target, Wallet,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import DeveloperDashboard from '@/components/admin/dashboards/DeveloperDashboard';
import SalesDashboard from '@/components/admin/dashboards/SalesDashboard';

export default function AdminDashboard() {
  const { leads, loading } = useLeads();
  const { activeSessions } = useFormSessions();
  const { isDeveloper, isSales } = useAuth();
  const metrics = useDashboardMetrics(leads);

  // Show role-specific dashboard
  if (isDeveloper) {
    return <DeveloperDashboard />;
  }

  if (isSales) {
    return <SalesDashboard />;
  }

  const recentProjects = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [leads]);

  if (loading) {
    return <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>;
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Business overview and key metrics</p>
      </div>

      {/* Revenue & Payments Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Revenue & Payments</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Lifetime earnings</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">This Month</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.monthRevenue)}</p>
            <div className="flex items-center gap-1 mt-1">
              {metrics.revenueGrowth >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${metrics.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metrics.revenueGrowth}% vs last month
              </span>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Outstanding</span>
              <Wallet className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.totalOutstanding)}</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.pendingInvoices} pending invoices</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Collection Rate</span>
              <Receipt className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{metrics.collectionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.paidInvoices} paid invoices</p>
          </div>
        </div>
      </div>

      {/* Leads & Pipeline Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Leads & Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard 
            title="Total Leads" 
            value={metrics.totalLeads} 
            icon={Users} 
            change={`+${metrics.newLeadsThisWeek} this week`} 
            changeType="positive" 
          />
          <StatsCard 
            title="Active Pipeline" 
            value={metrics.activeLeads} 
            icon={Activity} 
            change={formatCurrency(metrics.pipelineValue) + ' value'} 
            changeType="neutral" 
          />
          <StatsCard 
            title="Conversion Rate" 
            value={`${metrics.conversionRate}%`} 
            icon={Target} 
            change={`${metrics.closedDeals} deals closed`} 
            changeType="positive" 
          />
          <StatsCard 
            title="Avg Close Time" 
            value={`${metrics.avgLeadToClose}d`} 
            icon={Clock} 
            change={formatCurrency(metrics.avgDealSize) + ' avg deal'} 
            changeType="neutral" 
          />
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Recent Projects</h3>
          <Link to="/admin/leads" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {recentProjects.length === 0 ? (
          <p className="text-muted-foreground text-sm">No projects yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((lead) => (
              <Link
                key={lead.id}
                to={`/admin/leads/${lead.id}`}
                className="block p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-muted-foreground">#{lead.lead_number}</span>
                  <LeadStatusBadge status={lead.status} />
                </div>
                <h4 className="font-medium truncate">{lead.name || lead.email}</h4>
                <p className="text-sm text-muted-foreground truncate">{lead.business_name || 'No business name'}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span className="capitalize">{lead.project_type}</span>
                  <span>{format(new Date(lead.created_at), 'MMM d')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Leads Over Time</h3>
          <LeadsChart leads={leads} days={30} />
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Project Types</h3>
          <SourceBreakdown leads={leads} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
          <ConversionFunnel leads={leads} />
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Live Activity</h3>
            <span className="text-xs text-muted-foreground">{activeSessions.length} active</span>
          </div>
          {activeSessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active form sessions</p>
          ) : (
            <div className="space-y-3">{activeSessions.slice(0, 3).map(s => <LiveSessionCard key={s.id} session={s} />)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
