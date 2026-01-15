import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  ExternalLink,
  Search,
  Filter,
  Calendar,
  Download,
  FileText,
  Image,
  Paperclip
} from 'lucide-react';
import { Label } from '@/components/ui/label';

type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

interface RequestAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  content_type: string | null;
  created_at: string;
}

interface ClientRequest {
  id: string;
  lead_id: string;
  title: string;
  description: string | null;
  body: string | null;
  status: string;
  priority: string;
  admin_notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  estimated_completion: string | null;
  leads?: {
    name: string | null;
    email: string;
    business_name: string | null;
    lead_number: number | null;
  };
}

const statusConfig: Record<RequestStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: AlertCircle },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground border-border', icon: Clock },
};

const priorityConfig: Record<RequestPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-500/10 text-slate-500' },
  medium: { label: 'Medium', color: 'bg-blue-500/10 text-blue-500' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-red-500/10 text-red-500' },
};

export default function AdminRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState<RequestStatus>('pending');
  const [estimatedCompletion, setEstimatedCompletion] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_requests')
        .select(`
          *,
          leads (
            name,
            email,
            business_name,
            lead_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClientRequest[];
    },
  });

  // Handle opening request from URL param
  useEffect(() => {
    const openRequestId = searchParams.get('open');
    if (openRequestId && requests.length > 0) {
      const request = requests.find(r => r.id === openRequestId);
      if (request) {
        handleOpenRequest(request);
        // Clear the param after opening
        setSearchParams({});
      }
    }
  }, [searchParams, requests]);

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes, estimated_completion }: { 
      id: string; 
      status: string; 
      admin_notes: string;
      estimated_completion: string | null;
    }) => {
      const updates: any = { 
        status, 
        admin_notes,
        estimated_completion: estimated_completion || null,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('client_requests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      toast({ title: 'Request updated' });
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error updating request', description: error.message, variant: 'destructive' });
    },
  });

  // Sort order: pending -> in_progress -> completed -> cancelled
  const statusOrder: Record<string, number> = {
    pending: 0,
    in_progress: 1,
    completed: 2,
    cancelled: 3,
  };

  // Priority order: urgent -> high -> medium -> low
  const priorityOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const filteredRequests = requests
    .filter((request) => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesSearch = 
        request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.leads?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.leads?.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      // First sort by status
      const statusDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      
      // Then sort by priority (high to low)
      return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
    });

  const stats = {
    pending: requests.filter((r) => r.status === 'pending').length,
    in_progress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    total: requests.length,
  };

  const handleOpenRequest = async (request: ClientRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setNewStatus(request.status as RequestStatus);
    setEstimatedCompletion(request.estimated_completion ? request.estimated_completion.split('T')[0] : '');

    // Fetch attachments
    const { data } = await supabase
      .from('request_attachments')
      .select('*')
      .eq('request_id', request.id)
      .order('created_at', { ascending: false });
    
    setAttachments((data as RequestAttachment[]) || []);
  };

  const handleSaveRequest = () => {
    if (selectedRequest) {
      updateRequestMutation.mutate({
        id: selectedRequest.id,
        status: newStatus,
        admin_notes: adminNotes,
        estimated_completion: estimatedCompletion ? new Date(estimatedCompletion).toISOString() : null,
      });
    }
  };

  const handleDownloadAttachment = async (attachment: RequestAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('request-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: 'Download failed', description: error.message, variant: 'destructive' });
    }
  };

  const getFileIcon = (contentType: string | null) => {
    if (contentType?.startsWith('image/')) return Image;
    return FileText;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Client Requests</h1>
        <p className="text-muted-foreground mt-1">Manage and respond to client task requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.in_progress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No requests found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => {
                const statusInfo = statusConfig[request.status as RequestStatus] || statusConfig.pending;
                const priorityInfo = priorityConfig[request.priority as RequestPriority] || priorityConfig.medium;
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={request.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleOpenRequest(request)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{request.title}</h3>
                          <Badge variant="outline" className={priorityInfo.color}>
                            {priorityInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">
                            {request.leads?.name || request.leads?.email}
                            {request.leads?.lead_number && ` (#${request.leads.lead_number})`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(request.created_at), 'MMM d')}
                        </span>
                      </div>
                    </div>
                    {request.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {request.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Detail Sheet */}
      <Sheet open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <SheetContent className="sm:max-w-xl w-full overflow-hidden flex flex-col">
          {selectedRequest && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedRequest.title}</SheetTitle>
                <SheetDescription>
                  Request from {selectedRequest.leads?.name || selectedRequest.leads?.email}
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-6 mt-6 pb-6">
                  {/* Client Info */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedRequest.leads?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{selectedRequest.leads?.email}</p>
                        {selectedRequest.leads?.business_name && (
                          <p className="text-sm text-muted-foreground">{selectedRequest.leads?.business_name}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/leads/${selectedRequest.lead_id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Lead
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedRequest.description && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                      <p className="text-sm">{selectedRequest.description}</p>
                    </div>
                  )}

                  {/* Body Content - for detailed content like tracking scripts */}
                  {selectedRequest.body && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Content</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all overflow-x-auto">
                          {selectedRequest.body}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Attachments ({attachments.length})
                      </h4>
                      <div className="space-y-2">
                        {attachments.map((attachment) => {
                          const FileIcon = getFileIcon(attachment.content_type);
                          return (
                            <div 
                              key={attachment.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(attachment.file_size)}
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownloadAttachment(attachment)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Priority</h4>
                      <Badge 
                        variant="outline" 
                        className={priorityConfig[selectedRequest.priority as RequestPriority]?.color}
                      >
                        {priorityConfig[selectedRequest.priority as RequestPriority]?.label || selectedRequest.priority}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Submitted</h4>
                      <p className="text-sm">{format(new Date(selectedRequest.created_at), 'PPp')}</p>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Select value={newStatus} onValueChange={(v) => setNewStatus(v as RequestStatus)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ETA - Show when in progress */}
                  {newStatus === 'in_progress' && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Estimated Completion Date
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={estimatedCompletion}
                          onChange={(e) => setEstimatedCompletion(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        This will be visible to the client
                      </p>
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Admin Notes</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes visible to the client..."
                      className="mt-2"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      These notes will be visible to the client
                    </p>
                  </div>

                  {/* Save Button */}
                  <Button 
                    onClick={handleSaveRequest} 
                    className="w-full"
                    disabled={updateRequestMutation.isPending}
                  >
                    {updateRequestMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}