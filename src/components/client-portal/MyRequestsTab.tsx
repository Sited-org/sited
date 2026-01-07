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
  AlertCircle,
  XCircle,
  Plus
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
}

interface MyRequestsTabProps {
  leadId: string;
  requests: ClientRequest[];
  onRequestCreated: () => void;
}

export function MyRequestsTab({ leadId, requests, onRequestCreated }: MyRequestsTabProps) {
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
      const { error } = await supabase.from('client_requests').insert({
        lead_id: leadId,
        title: title.trim(),
        description: description.trim() || null,
        priority,
      });

      if (error) throw error;

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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock };
      case 'in_progress':
        return { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Loader2 };
      case 'completed':
        return { label: 'Completed', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle };
      default:
        return { label: status, color: 'bg-muted', icon: Clock };
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

  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'in_progress');
  const completedRequests = requests.filter(r => r.status === 'completed' || r.status === 'rejected');

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

      {/* Active Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Requests
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingRequests.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquarePlus className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No active requests</p>
              <p className="text-sm">Submit a request to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const statusInfo = getStatusInfo(request.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <div key={request.id} className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{request.title}</h4>
                          <Badge className={getPriorityColor(request.priority)} variant="outline">
                            {request.priority}
                          </Badge>
                        </div>
                        {request.description && (
                          <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Submitted {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className={`h-3 w-3 mr-1 ${request.status === 'in_progress' ? 'animate-spin' : ''}`} />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    {request.admin_notes && (
                      <div className="mt-3 p-3 bg-background rounded border-l-2 border-primary">
                        <p className="text-xs text-muted-foreground mb-1">Response from team:</p>
                        <p className="text-sm">{request.admin_notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Requests */}
      {completedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Completed Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedRequests.map((request) => {
                const statusInfo = getStatusInfo(request.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <div key={request.id} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{request.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {request.completed_at 
                            ? `Completed ${format(new Date(request.completed_at), 'MMM d, yyyy')}`
                            : format(new Date(request.created_at), 'MMM d, yyyy')
                          }
                        </p>
                      </div>
                      <Badge className={statusInfo.color} variant="outline">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
