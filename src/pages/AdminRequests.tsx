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
  Paperclip,
  XCircle,
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';

type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type RequestPriority = 'low' | 'medium' | 'normal' | 'high' | 'urgent';

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

const statusConfig: Record<RequestStatus, { label: string; color: string; icon: typeof Clock; cardBg?: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: AlertCircle },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle, cardBg: 'bg-red-500/5' },
};

const priorityConfig: Record<RequestPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-500/10 text-slate-500' },
  medium: { label: 'Medium', color: 'bg-blue-500/10 text-blue-500' },
  normal: { label: 'Normal', color: 'bg-blue-500/10 text-blue-500' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-red-500/10 text-red-500' },
};

// Request Card Component
function RequestCard({ 
  request, 
  onOpen, 
  onFilterCompany,
  showETA = false, 
  showCompletion = false 
}: { 
  request: ClientRequest; 
  onOpen: (request: ClientRequest) => void;
  onFilterCompany: (leadId: string) => void;
  showETA?: boolean;
  showCompletion?: boolean;
}) {
  const priorityInfo = priorityConfig[request.priority as RequestPriority] || priorityConfig.normal;
  const statusInfo = statusConfig[request.status as RequestStatus] || statusConfig.pending;
  const companyInitial = (request.leads?.business_name || request.leads?.name || request.leads?.email || '?')[0].toUpperCase();
  
  return (
    <div
      className={`p-4 rounded-lg border hover:border-primary/30 transition-colors cursor-pointer ${statusInfo.cardBg || 'bg-card'}`}
      onClick={() => onOpen(request)}
    >
      {/* Top Row: Profile, Time, Title, Urgency */}
      <div className="flex items-start gap-3">
        {/* Company Profile Photo */}
        <div className="shrink-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {companyInitial}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title and Priority on same line */}
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium truncate">{request.title}</h4>
            <Badge variant="outline" className={priorityInfo.color}>
              {priorityInfo.label}
            </Badge>
          </div>
          
          {/* Company name and submission time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
            <span className="truncate font-medium">
              {request.leads?.business_name || request.leads?.name || request.leads?.email}
              {request.leads?.lead_number && ` (#${request.leads.lead_number})`}
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3" />
              {format(new Date(request.created_at), 'MMM d, h:mm a')}
            </span>
          </div>
        </div>
      </div>
      
      {/* Filter Button - beneath profile */}
      <div className="mt-3 ml-13 pl-13">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onFilterCompany(request.lead_id);
          }}
        >
          <Filter className="h-3 w-3 mr-1" />
          Filter this company
        </Button>
      </div>
      
      {/* Request Preview */}
      {request.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mt-3 ml-13 pl-13">{request.description}</p>
      )}
      
      {/* Additional Info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-3 ml-13 pl-13">
        {showETA && request.estimated_completion && (
          <span className="flex items-center gap-1 text-blue-600">
            <Calendar className="h-3 w-3" />
            ETA: {format(new Date(request.estimated_completion), 'MMM d')}
          </span>
        )}
        {showCompletion && request.completed_at && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Completed {format(new Date(request.completed_at), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
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

  const deleteRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete attachments from storage
      const { data: attachmentsData } = await supabase
        .from('request_attachments')
        .select('file_path')
        .eq('request_id', id);
      
      if (attachmentsData && attachmentsData.length > 0) {
        const filePaths = attachmentsData.map(a => a.file_path);
        await supabase.storage.from('request-attachments').remove(filePaths);
      }

      // Delete attachment records
      await supabase.from('request_attachments').delete().eq('request_id', id);

      // Delete the request
      const { error } = await supabase.from('client_requests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      toast({ title: 'Request deleted' });
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error deleting request', description: error.message, variant: 'destructive' });
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

  // Get unique clients for filter dropdown
  const uniqueClients = [...new Map(requests.map(r => [
    r.lead_id, 
    { 
      id: r.lead_id, 
      name: r.leads?.business_name || r.leads?.name || r.leads?.email || 'Unknown' 
    }
  ])).values()];

  const filteredRequests = requests
    .filter((request) => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesClient = clientFilter === 'all' || request.lead_id === clientFilter;
      const matchesSearch = 
        request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.leads?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.leads?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.leads?.business_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesClient && matchesSearch;
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
    cancelled: requests.filter((r) => r.status === 'cancelled').length,
    total: requests.length,
  };

  // Handler for "Filter this company" button - filters to non-completed requests from this company
  const handleFilterCompany = (leadId: string) => {
    setClientFilter(leadId);
    setStatusFilter('all'); // Show all non-completed statuses from this company
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
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <User className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {uniqueClients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {clientFilter !== 'all' && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setClientFilter('all')}
            className="shrink-0"
          >
            Clear client filter
          </Button>
        )}
      </div>

      {/* Categorized Requests */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No requests found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending Requests */}
          {(() => {
            const pending = filteredRequests.filter(r => r.status === 'pending');
            if (pending.length === 0) return null;
            return (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    Pending
                    <Badge variant="secondary" className="ml-auto">{pending.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pending.map((request) => (
                      <RequestCard key={request.id} request={request} onOpen={handleOpenRequest} onFilterCompany={handleFilterCompany} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* In Progress Requests */}
          {(() => {
            const inProgress = filteredRequests.filter(r => r.status === 'in_progress');
            if (inProgress.length === 0) return null;
            return (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    In Progress
                    <Badge variant="secondary" className="ml-auto">{inProgress.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {inProgress.map((request) => (
                      <RequestCard key={request.id} request={request} onOpen={handleOpenRequest} onFilterCompany={handleFilterCompany} showETA />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Completed Requests */}
          {(() => {
            const completed = filteredRequests.filter(r => r.status === 'completed');
            if (completed.length === 0) return null;
            return (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-1.5 bg-green-500/10 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    Completed
                    <Badge variant="secondary" className="ml-auto">{completed.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {completed.map((request) => (
                      <RequestCard key={request.id} request={request} onOpen={handleOpenRequest} onFilterCompany={handleFilterCompany} showCompletion />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Cancelled Requests */}
          {(() => {
            const cancelled = filteredRequests.filter(r => r.status === 'cancelled');
            if (cancelled.length === 0) return null;
            return (
              <Card className="bg-red-500/5 border-red-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                    <div className="p-1.5 bg-red-500/10 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-500" />
                    </div>
                    Cancelled
                    <Badge variant="secondary" className="ml-auto bg-red-500/10 text-red-600">{cancelled.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cancelled.map((request) => (
                      <RequestCard key={request.id} request={request} onOpen={handleOpenRequest} onFilterCompany={handleFilterCompany} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

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

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleSaveRequest} 
                      className="flex-1"
                      disabled={updateRequestMutation.isPending}
                    >
                      {updateRequestMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Request</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this request? This action cannot be undone and will also remove all attached files.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteRequestMutation.mutate(selectedRequest.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteRequestMutation.isPending ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}