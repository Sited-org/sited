import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useClientRequests } from '@/hooks/useClientRequests';
import { Link } from 'react-router-dom';
import { ClipboardList, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'border-destructive/50 bg-destructive/5',
  high: 'border-orange-500/50 bg-orange-500/5',
  normal: '',
  low: '',
};

export default function DevRequests() {
  const { leads, loading: leadsLoading } = useLeads();
  const { requests, loading: requestsLoading } = useClientRequests();

  const assignedLeadIds = useMemo(() => new Set(leads.map(l => l.id)), [leads]);
  const leadMap = useMemo(() => {
    const map = new Map<string, any>();
    leads.forEach(l => map.set(l.id, l));
    return map;
  }, [leads]);

  const filteredRequests = useMemo(() => {
    return requests
      .filter(r => assignedLeadIds.has(r.lead_id))
      .sort((a, b) => {
        const statusOrder: Record<string, number> = { pending: 0, in_progress: 1, completed: 2, rejected: 3 };
        const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
        const statusDiff = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
        if (statusDiff !== 0) return statusDiff;
        return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
      });
  }, [requests, assignedLeadIds]);

  const loading = leadsLoading || requestsLoading;

  if (loading) {
    return <div className="text-muted-foreground">Loading requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
        <p className="text-sm text-muted-foreground">{filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} across your projects</p>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No requests</h3>
            <p className="text-sm text-muted-foreground">Client requests for your projects will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(req => {
            const lead = leadMap.get(req.lead_id);
            const extraStyle = PRIORITY_STYLES[req.priority] || '';
            return (
              <div key={req.id} className={`border border-border rounded-lg bg-card p-4 ${extraStyle}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{req.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Link
                        to={`/dev/project/${req.lead_id}`}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {lead?.business_name || lead?.name || lead?.email || 'Project'}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        · {format(new Date(req.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs capitalize">{req.priority}</Badge>
                    <Badge
                      variant={req.status === 'completed' ? 'default' : req.status === 'in_progress' ? 'default' : 'secondary'}
                      className="text-xs capitalize"
                    >
                      {req.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {req.description && (
                  <p className="text-sm text-muted-foreground mt-2">{req.description}</p>
                )}

                {req.admin_notes && (
                  <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes</p>
                    <p className="text-sm">{req.admin_notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
