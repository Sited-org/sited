import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/hooks/useAuth';
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge';
import { Link } from 'react-router-dom';
import { format, subDays, startOfMonth } from 'date-fns';
import { DollarSign, TrendingUp, Phone, Calendar, Target, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function SalesDashboard() {
  const { leads, loading } = useLeads();
  const { user } = useAuth();

  // Fetch sales metrics for the current user
  const { data: salesMetrics } = useQuery({
    queryKey: ['sales-metrics', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('sales_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const last30Days = subDays(now, 30);

    // Filter leads that were sold
    const soldLeads = leads.filter(l => l.status === 'sold');
    const monthSold = soldLeads.filter(l => new Date(l.deal_closed_at || l.created_at) > monthStart);
    
    // Calculate total revenue
    const totalRevenue = monthSold.reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0);
    
    // Meeting/call stats from metrics
    const monthMetrics = salesMetrics?.filter(m => new Date(m.created_at) > monthStart) || [];
    const meetingsBooked = monthMetrics.filter(m => m.metric_type === 'meeting_booked').length;
    const callsMade = monthMetrics.filter(m => m.metric_type === 'call_made').length;
    
    // Conversion calculations
    const totalLeads = leads.filter(l => new Date(l.created_at) > last30Days).length;
    const closeRate = totalLeads > 0 ? Math.round((soldLeads.length / totalLeads) * 100) : 0;

    return {
      monthRevenue: totalRevenue,
      dealsThisMonth: monthSold.length,
      meetingsBooked,
      callsMade,
      closeRate,
      totalDeals: soldLeads.length,
      avgDealSize: soldLeads.length > 0 ? totalRevenue / soldLeads.length : 0,
    };
  }, [leads, salesMetrics]);

  const recentLeads = useMemo(() => {
    return [...leads]
      .filter(l => ['new', 'contacted', 'booked_call'].includes(l.status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [leads]);

  if (loading) {
    return <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Dashboard</h1>
        <p className="text-muted-foreground">Your performance metrics and active leads</p>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Month Revenue</span>
          </div>
          <p className="text-xl font-bold">${stats.monthRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="h-4 w-4" />
            <span className="text-xs">Deals Closed</span>
          </div>
          <p className="text-xl font-bold">{stats.dealsThisMonth}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Meetings</span>
          </div>
          <p className="text-xl font-bold">{stats.meetingsBooked}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Phone className="h-4 w-4" />
            <span className="text-xs">Calls Made</span>
          </div>
          <p className="text-xl font-bold">{stats.callsMade}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Close Rate</span>
          </div>
          <p className="text-xl font-bold">{stats.closeRate}%</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs">Avg Deal</span>
          </div>
          <p className="text-xl font-bold">${Math.round(stats.avgDealSize).toLocaleString()}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/new-sale"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Target className="h-4 w-4" />
          New Face-to-Face Sale
        </Link>
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
                  <LeadStatusBadge status={lead.status} />
                </div>
                <h4 className="font-medium truncate">{lead.name || lead.email}</h4>
                <p className="text-sm text-muted-foreground truncate">{lead.business_name || 'No business'}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span className="capitalize">{lead.project_type}</span>
                  <span>{format(new Date(lead.created_at), 'MMM d')}</span>
                </div>
                {lead.deal_amount && Number(lead.deal_amount) > 0 && (
                  <p className="text-sm font-medium text-primary mt-2">
                    ${Number(lead.deal_amount).toLocaleString()}
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