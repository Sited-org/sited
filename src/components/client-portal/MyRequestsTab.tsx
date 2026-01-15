import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Plus,
  X
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
      }

      toast.success('Request submitted');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">In Progress</Badge>;
      case 'cancelled':
      case 'rejected':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const activeRequests = requests.filter(r => r.status === 'pending' || r.status === 'in_progress');
  const completedRequests = requests.filter(r => r.status === 'completed');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Requests</h2>
          <p className="text-sm text-muted-foreground">Submit and track your requests</p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        )}
      </div>

      {/* New Request Form */}
      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">New Request</p>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm">Title *</Label>
                <Input
                  id="title"
                  placeholder="What do you need?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm">Details</Label>
                <Textarea
                  id="description"
                  placeholder="Provide more details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm">Priority</Label>
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

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Active ({activeRequests.length})
          </p>
          {activeRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{request.title}</p>
                    {request.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{request.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                {request.admin_notes && (
                  <div className="mt-3 p-2 bg-muted/50 rounded text-sm border-l-2 border-primary">
                    <p className="text-xs text-muted-foreground mb-1">Response:</p>
                    <p>{request.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Requests */}
      {completedRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedRequests.length})
          </p>
          {completedRequests.slice(0, 5).map((request) => (
            <Card key={request.id} className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{request.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed {request.completed_at && format(new Date(request.completed_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {requests.length === 0 && !showForm && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <MessageSquarePlus className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No requests yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => setShowForm(true)}
            >
              Submit Your First Request
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
