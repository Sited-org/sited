import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useFormSessions } from '@/hooks/useFormSessions';
import { useAuth } from '@/hooks/useAuth';
import { StatsCard } from '@/components/admin/StatsCard';
import { LeadsChart } from '@/components/admin/LeadsChart';
import { ConversionFunnel } from '@/components/admin/ConversionFunnel';
import { SourceBreakdown } from '@/components/admin/SourceBreakdown';
import { LiveSessionCard } from '@/components/admin/LiveSessionCard';
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge';
import { Users, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { Link } from 'react-router-dom';
import DeveloperDashboard from '@/components/admin/dashboards/DeveloperDashboard';
import SalesDashboard from '@/components/admin/dashboards/SalesDashboard';

export default function AdminDashboard() {
  const { leads, loading } = useLeads();
  const { activeSessions } = useFormSessions();
  const { userRole, isDeveloper, isSales } = useAuth();

  // Show role-specific dashboard
  if (isDeveloper) {
    return <DeveloperDashboard />;
  }

  if (isSales) {
    return <SalesDashboard />;
  }

  const stats = useMemo(() => {
    const now = new Date();
    const last7Days = subDays(now, 7);
    const last30Days = subDays(now, 30);

    const recentLeads = leads.filter(l => new Date(l.created_at) > last7Days);
    const monthLeads = leads.filter(l => new Date(l.created_at) > last30Days);
    const soldLeads = leads.filter(l => l.status === 'sold');
    const activeLeads = leads.filter(l => ['new', 'contacted', 'booked_call'].includes(l.status));

    return {
      total: leads.length,
      thisWeek: recentLeads.length,
      thisMonth: monthLeads.length,
      converted: soldLeads.length,
      active: activeLeads.length,
      conversionRate: leads.length > 0 ? Math.round((soldLeads.length / leads.length) * 100) : 0,
    };
  }, [leads]);

  const recentProjects = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [leads]);

  if (loading) {
    return <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your leads and activity</p>
      </div>

      {/* Recent Projects Hero */}
      <div className="bg-card border border-border rounded-xl p-8">
        <h3 className="text-lg font-semibold mb-6">Recent Projects</h3>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Leads" value={stats.total} icon={Users} change={`${stats.thisWeek} this week`} changeType="neutral" />
        <StatsCard title="This Month" value={stats.thisMonth} icon={TrendingUp} change="+12% from last month" changeType="positive" />
        <StatsCard title="Converted" value={stats.converted} icon={DollarSign} change={`${stats.conversionRate}% rate`} changeType="positive" />
        <StatsCard title="Active Leads" value={stats.active} icon={Activity} change="In pipeline" changeType="neutral" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-xl p-8">
          <h3 className="text-lg font-semibold mb-6">Leads Over Time</h3>
          <LeadsChart leads={leads} days={30} />
        </div>
        <div className="bg-card border border-border rounded-xl p-8">
          <h3 className="text-lg font-semibold mb-6">Project Types</h3>
          <SourceBreakdown leads={leads} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-xl p-8">
          <h3 className="text-lg font-semibold mb-6">Conversion Funnel</h3>
          <ConversionFunnel leads={leads} />
        </div>
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Live Activity</h3>
            <span className="text-xs text-muted-foreground">{activeSessions.length} active</span>
          </div>
          {activeSessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active form sessions</p>
          ) : (
            <div className="space-y-4">{activeSessions.slice(0, 3).map(s => <LiveSessionCard key={s.id} session={s} />)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
