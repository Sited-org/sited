import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquarePlus, 
  Clock, 
  CheckCircle2, 
  Loader2,
  XCircle,
  Plus,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
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

interface MyRequestsTabProps {
  leadId: string;
  leadName?: string;
  leadEmail?: string;
  requests: ClientRequest[];
  onRequestCreated: () => void;
}

export function MyRequestsTab({ leadId, leadName, leadEmail, requests, onRequestCreated }: MyRequestsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('normal');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a request title');
      return;
    }

    setSubmitting(true);
    try {
      const { data: newRequest, error } = await supabase.from('client_requests').insert({
        lead_id: leadId,
        title: title.trim(),
        description: description.trim() || null,
        priority,
      }).select().single();

      if (error) throw error;

      // Send notification to admins
      try {
        await supabase.functions.invoke('notify-client-request', {
          body: {
            request_id: newRequest.id,
            lead_id: leadId,
            title: title.trim(),
            description: description.trim() || null,
            priority,
            client_name: leadName,
            client_email: leadEmail,
          },
        });
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
        // Don't fail the request submission if notification fails
      }

      toast.success('Request submitted successfully');
      setTitle('');
      setDescription('');
      setPriority('normal');
      setShowForm(false);
      onRequestCreated();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

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
          <p className="text-xs text-muted-foreground mb-1">Response from team:</p>
          <p className="text-sm">{request.admin_notes}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">My Requests</h2>
          <p className="text-muted-foreground">Submit and track your project requests</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        )}
      </div>

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

      {/* New Request Form */}
      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5" />
              Submit New Request
            </CardTitle>
            <CardDescription>
              Describe what you'd like us to work on
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Request Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Update homepage banner image"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide more details about your request..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Requested / Pending */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 bg-yellow-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            Requested
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-auto">{pendingRequests.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Awaiting review by our team</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* In Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <Loader2 className="h-5 w-5 text-blue-600" />
            </div>
            In Progress
            {inProgressRequests.length > 0 && (
              <Badge variant="secondary" className="ml-auto">{inProgressRequests.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Currently being worked on</CardDescription>
        </CardHeader>
        <CardContent>
          {inProgressRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No requests in progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgressRequests.map((request) => (
                <RequestCard key={request.id} request={request} showETA />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            Completed
            {completedRequests.length > 0 && (
              <Badge variant="secondary" className="ml-auto">{completedRequests.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Successfully delivered requests</CardDescription>
        </CardHeader>
        <CardContent>
          {completedRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No completed requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedRequests.map((request) => (
                <RequestCard key={request.id} request={request} showCompletion />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancelled (if any) */}
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
