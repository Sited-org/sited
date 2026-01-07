import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle2, 
  Loader2,
  XCircle,
  Calendar,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface ClientRequest {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  completed_at: string | null;
  estimated_completion: string | null;
}

interface RequestsTabProps {
  leadId: string;
}

export function RequestsTab({ leadId }: RequestsTabProps) {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRequests(data);
      }
      setLoading(false);
    }

    fetchRequests();
  }, [leadId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'normal':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'low':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-muted';
    }
  };

  // Categorize requests
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const inProgressRequests = requests.filter(r => r.status === 'in_progress');
  const completedRequests = requests.filter(r => r.status === 'completed');
  const cancelledRequests = requests.filter(r => r.status === 'cancelled' || r.status === 'rejected');

  const RequestCard = ({ request, showETA = false, showCompletion = false }: { 
    request: ClientRequest; 
    showETA?: boolean;
    showCompletion?: boolean;
  }) => (
    <div className="p-4 bg-card rounded-lg border hover:border-primary/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-medium truncate">{request.title}</h4>
            <Badge className={getPriorityColor(request.priority)} variant="outline">
              {request.priority}
            </Badge>
          </div>
          {request.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{request.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Submitted {format(new Date(request.created_at), 'MMM d, yyyy')}
            </span>
            {showETA && request.estimated_completion && (
              <span className="flex items-center gap-1 text-blue-600">
                <Clock className="h-3 w-3" />
                ETA: {format(new Date(request.estimated_completion), 'MMM d, yyyy')}
              </span>
            )}
            {showCompletion && request.completed_at && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Completed {format(new Date(request.completed_at), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>
      {request.admin_notes && (
        <div className="mt-3 p-3 bg-muted/50 rounded border-l-2 border-primary">
          <p className="text-xs text-muted-foreground mb-1">Admin notes:</p>
          <p className="text-sm">{request.admin_notes}</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Progress Indicator */}
      <div className="flex items-center justify-center gap-2 py-4 overflow-x-auto">
        <div className="flex items-center gap-1 px-3 py-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <Clock className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-600">{pendingRequests.length}</span>
          <span className="text-xs text-yellow-600/70 hidden sm:inline">Requested</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-1 px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Loader2 className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">{inProgressRequests.length}</span>
          <span className="text-xs text-blue-600/70 hidden sm:inline">In Progress</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-1 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-600">{completedRequests.length}</span>
          <span className="text-xs text-green-600/70 hidden sm:inline">Completed</span>
        </div>
      </div>

      {requests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No requests from this client yet</p>
          </CardContent>
        </Card>
      )}

      {/* Requested / Pending */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              Requested
              <Badge variant="secondary" className="ml-auto">{pendingRequests.length}</Badge>
            </CardTitle>
            <CardDescription>Awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress */}
      {inProgressRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <Loader2 className="h-5 w-5 text-blue-600" />
              </div>
              In Progress
              <Badge variant="secondary" className="ml-auto">{inProgressRequests.length}</Badge>
            </CardTitle>
            <CardDescription>Currently being worked on</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inProgressRequests.map((request) => (
                <RequestCard key={request.id} request={request} showETA />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed */}
      {completedRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              Completed
              <Badge variant="secondary" className="ml-auto">{completedRequests.length}</Badge>
            </CardTitle>
            <CardDescription>Successfully delivered</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedRequests.map((request) => (
                <RequestCard key={request.id} request={request} showCompletion />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled */}
      {cancelledRequests.length > 0 && (
        <Card className="opacity-75">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
              <div className="p-1.5 bg-muted rounded-lg">
                <XCircle className="h-5 w-5" />
              </div>
              Cancelled
              <Badge variant="secondary" className="ml-auto">{cancelledRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cancelledRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
