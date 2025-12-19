import { useMemo } from 'react';
import { useLeads, Lead } from '@/hooks/useLeads';
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Code, FileText, MessageSquare, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function DeveloperDashboard() {
  const { leads, loading } = useLeads();

  // Fetch customer notes
  const { data: customerNotes } = useQuery({
    queryKey: ['customer-notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_notes')
        .select('*, leads(name, business_name)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  // Fetch recent project updates
  const { data: projectUpdates } = useQuery({
    queryKey: ['recent-project-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_updates')
        .select('*, leads(name, business_name)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  const activeProjects = useMemo(() => {
    return leads.filter(l => ['booked_call', 'sold'].includes(l.status));
  }, [leads]);

  if (loading) {
    return <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Developer Dashboard</h1>
        <p className="text-muted-foreground">Active projects and customer feedback</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Code className="h-4 w-4" />
            <span className="text-xs">Active Projects</span>
          </div>
          <p className="text-2xl font-bold">{activeProjects.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">Customer Notes</span>
          </div>
          <p className="text-2xl font-bold">{customerNotes?.length || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs">Updates Posted</span>
          </div>
          <p className="text-2xl font-bold">{projectUpdates?.length || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs">This Week</span>
          </div>
          <p className="text-2xl font-bold">{projectUpdates?.filter(u => 
            new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length || 0}</p>
        </div>
      </div>

      {/* Active Projects */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Active Projects</h3>
        {activeProjects.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active projects</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.slice(0, 6).map((lead) => (
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
                <p className="text-xs text-muted-foreground mt-2 capitalize">{lead.project_type}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Notes */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Notes</h3>
          {!customerNotes || customerNotes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No customer notes yet</p>
          ) : (
            <div className="space-y-3">
              {customerNotes.slice(0, 5).map((note: any) => (
                <div key={note.id} className="p-3 bg-background border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{note.leads?.business_name || note.leads?.name || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(note.created_at), 'MMM d')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Project Updates</h3>
          {!projectUpdates || projectUpdates.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent updates</p>
          ) : (
            <div className="space-y-3">
              {projectUpdates.slice(0, 5).map((update: any) => (
                <div key={update.id} className="p-3 bg-background border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{update.leads?.business_name || update.leads?.name || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(update.created_at), 'MMM d')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{update.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}