import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquarePlus, 
  Clock, 
  CheckCircle2, 
  Loader2,
  Plus,
  X,
  Paperclip,
  FileText,
  Send,
  Trash2,
  FileEdit,
  Bell,
  Upload,
  Reply,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ClientAssetUploadDialog } from './ClientAssetUploadDialog';
import { ClientFileUploadButton } from './ClientFileUploadButton';

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
  request_source?: string | null;
  requires_client_action?: boolean;
  action_type?: string | null;
  client_response?: string | null;
}

interface MyRequestsTabProps {
  leadId: string;
  leadName?: string;
  leadEmail?: string;
  requests: ClientRequest[];
  onRequestCreated: () => void;
  sessionToken?: string;
}

interface SelectedFile {
  file: File;
  preview?: string;
}

export function MyRequestsTab({ leadId, leadName, leadEmail, requests, onRequestCreated, sessionToken }: MyRequestsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<string>('normal');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [sendingDraftId, setSendingDraftId] = useState<string | null>(null);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [assetUploadOpen, setAssetUploadOpen] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });
    const newFiles: SelectedFile[] = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const file = prev[index];
      if (file.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadFiles = async (requestId: string) => {
    if (!sessionToken) throw new Error('Session token required for file upload');
    const uploadPromises = selectedFiles.map(async ({ file }) => {
      const formData = new FormData();
      formData.append('session_token', sessionToken);
      formData.append('lead_id', leadId);
      formData.append('request_id', requestId);
      formData.append('file', file);
      const { data, error } = await supabase.functions.invoke('upload-request-attachment', { body: formData });
      if (error) throw new Error(`Failed to upload ${file.name}`);
      if (data?.error) throw new Error(data.error);
      return data;
    });
    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a request title');
      return;
    }
    if (!sessionToken) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    asDraft ? setSavingDraft(true) : setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-client-request', {
        body: {
          session_token: sessionToken,
          lead_id: leadId,
          title: title.trim(),
          description: description.trim() || null,
          body: body.trim() || null,
          priority,
          client_name: leadName,
          client_email: leadEmail,
          status: asDraft ? 'draft' : 'pending',
        },
      });
      if (error) throw new Error(error.message || 'Failed to submit request');
      if (data?.error) throw new Error(data.error);
      const newRequest = data?.request;
      if (!newRequest?.id) throw new Error('Failed to create request');

      if (selectedFiles.length > 0 && !asDraft) {
        try {
          await uploadFiles(newRequest.id);
        } catch {
          toast.warning('Request submitted but some files failed to upload');
        }
      }

      toast.success(asDraft ? 'Draft saved' : 'Request submitted');
      setTitle('');
      setDescription('');
      setBody('');
      setPriority('normal');
      setSelectedFiles([]);
      setShowForm(false);
      onRequestCreated();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
      setSavingDraft(false);
    }
  };

  const handleSendDraft = async (requestId: string) => {
    setSendingDraftId(requestId);
    try {
      const { error } = await supabase.functions.invoke('submit-client-request', {
        body: {
          session_token: sessionToken,
          lead_id: leadId,
          request_id: requestId,
          action: 'send_draft',
          client_name: leadName,
          client_email: leadEmail,
        },
      });
      if (error) throw error;
      toast.success('Request sent to the Sited team');
      onRequestCreated();
    } catch {
      toast.error('Failed to send request');
    } finally {
      setSendingDraftId(null);
    }
  };

  const handleDeleteDraft = async (requestId: string) => {
    setDeletingDraftId(requestId);
    try {
      const { error } = await supabase.functions.invoke('submit-client-request', {
        body: {
          session_token: sessionToken,
          lead_id: leadId,
          request_id: requestId,
          action: 'delete_draft',
        },
      });
      if (error) throw error;
      toast.success('Draft removed');
      onRequestCreated();
    } catch {
      toast.error('Failed to delete draft');
    } finally {
      setDeletingDraftId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">In Progress</Badge>;
      case 'draft':
        return <Badge variant="outline" className="border-amber-400 text-amber-600">Draft</Badge>;
      case 'cancelled':
      case 'rejected':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  // Split requests by source
  const clientRequests = requests.filter(r => !r.request_source || r.request_source === 'manual');
  const teamRequests = requests.filter(r => r.request_source === 'admin');

  const draftRequests = clientRequests.filter(r => r.status === 'draft');
  const activeClientRequests = clientRequests.filter(r => r.status === 'pending' || r.status === 'in_progress');
  const completedClientRequests = clientRequests.filter(r => r.status === 'completed');
  const cancelledClientRequests = clientRequests.filter(r => r.status === 'cancelled' || r.status === 'rejected');

  const activeTeamRequests = teamRequests.filter(r => r.status === 'pending' || r.status === 'in_progress');
  const completedTeamRequests = teamRequests.filter(r => r.status === 'completed');

  const renderRequestCard = (request: ClientRequest, showActions = false) => (
    <Card key={request.id} className={request.status === 'completed' ? 'opacity-75' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{request.title}</p>
            {request.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{request.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {request.status === 'completed' && request.completed_at
                ? `Completed ${format(new Date(request.completed_at), 'MMM d, yyyy')}`
                : format(new Date(request.created_at), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {request.requires_client_action && request.status !== 'completed' && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Action</Badge>
            )}
            {getStatusBadge(request.status)}
          </div>
        </div>
        {request.admin_notes && (
          <div className="mt-3 p-2 bg-muted/50 rounded text-sm border-l-2 border-primary">
            <p className="text-xs text-muted-foreground mb-1">Response:</p>
            <p>{request.admin_notes}</p>
          </div>
        )}
        {showActions && request.status !== 'completed' && (
          <>
            {(request.action_type === 'asset_upload' || request.action_type === 'asset_collection') && request.requires_client_action && (
              <Button size="sm" className="mt-3 w-full" onClick={() => setAssetUploadOpen(true)}>
                <Upload className="h-3 w-3 mr-1" />
                Upload Brand Assets
              </Button>
            )}
            {sessionToken && request.action_type !== 'asset_upload' && request.action_type !== 'asset_collection' && (
              <ClientFileUploadButton
                requestId={request.id}
                leadId={leadId}
                sessionToken={sessionToken}
                onUploaded={onRequestCreated}
              />
            )}
            {/* Inline reply for team requests */}
            {sessionToken && request.request_source === 'admin' && (
              <div className="mt-2">
                {replyingToId === request.id ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Write your response..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      disabled={sendingReply}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={sendingReply || !replyText.trim()}
                        onClick={async () => {
                          setSendingReply(true);
                          try {
                            const { data, error } = await supabase.functions.invoke('submit-client-request', {
                              body: {
                                session_token: sessionToken,
                                lead_id: leadId,
                                action: 'reply_to_request',
                                request_id: request.id,
                                client_response: replyText.trim(),
                                client_name: leadName,
                              },
                            });
                            if (error) throw error;
                            if (data?.error) throw new Error(data.error);
                            toast.success('Response sent');
                            setReplyingToId(null);
                            setReplyText('');
                            onRequestCreated();
                          } catch (err: any) {
                            toast.error(err.message || 'Failed to send response');
                          } finally {
                            setSendingReply(false);
                          }
                        }}
                      >
                        {sendingReply ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                        Send
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setReplyingToId(null); setReplyText(''); }} disabled={sendingReply}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setReplyingToId(request.id)}>
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

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
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">New Request</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setSelectedFiles([]); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm">Title *</Label>
                <Input id="title" placeholder="What do you need?" value={title} onChange={(e) => setTitle(e.target.value)} disabled={submitting || savingDraft} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Textarea id="description" placeholder="Describe exactly what we are changing, on which area of your website" value={description} onChange={(e) => { if (e.target.value.length <= 100) setDescription(e.target.value); }} maxLength={100} disabled={submitting || savingDraft} rows={2} />
                <p className="text-xs text-muted-foreground">{description.length}/100 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body" className="text-sm">Content to Upload</Label>
                <RichTextEditor value={body} onChange={setBody} placeholder="Paste text, code, or content that needs to be added (formatting is preserved)..." disabled={submitting || savingDraft} rows={4} />
                <p className="text-xs text-muted-foreground">Text or code that should be added to your site - formatting (bold, italics, etc.) is preserved</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm">Priority</Label>
                <Select value={priority} onValueChange={setPriority} disabled={submitting || savingDraft}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-sm">Attachments</Label>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileSelect} className="hidden" disabled={submitting || savingDraft} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={submitting || savingDraft} className="w-full">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Add Files
                </Button>
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {selectedFiles.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        {item.preview ? (
                          <img src={item.preview} alt={item.file.name} className="h-10 w-10 object-cover rounded" />
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{item.file.name}</p>
                          <p className="text-xs text-muted-foreground">{(item.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)} disabled={submitting || savingDraft}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={submitting || savingDraft} className="flex-1" onClick={(e) => handleSubmit(e as any, true)}>
                  {savingDraft ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><FileEdit className="h-4 w-4 mr-2" />Save as Draft</>}
                </Button>
                <Button type="submit" disabled={submitting || savingDraft} className="flex-1">
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : <><Send className="h-4 w-4 mr-2" />Send Request</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ===== FROM YOUR TEAM ===== */}
      {teamRequests.length > 0 && (
        <>
          <div className="pt-2">
            <p className="text-sm font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Bell className="h-4 w-4" />
              From Your Team
            </p>
          </div>

          {activeTeamRequests.length > 0 && (
            <div className="space-y-2">
              {activeTeamRequests.map(r => renderRequestCard(r, true))}
            </div>
          )}

          {completedTeamRequests.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Completed team requests</p>
              {completedTeamRequests.slice(0, 3).map(r => renderRequestCard(r))}
            </div>
          )}
        </>
      )}

      {/* ===== MY REQUESTS ===== */}
      {(clientRequests.length > 0 || teamRequests.length > 0) && (
        <div className="pt-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            My Requests
          </p>
        </div>
      )}

      {/* Draft Requests */}
      {draftRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-amber-600 flex items-center gap-2">
            <FileEdit className="h-4 w-4" />
            Drafts ({draftRequests.length})
          </p>
          {draftRequests.map((request) => (
            <Card key={request.id} className="border-amber-200 dark:border-amber-800">
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
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={sendingDraftId === request.id || deletingDraftId === request.id}
                    onClick={() => handleSendDraft(request.id)}
                  >
                    {sendingDraftId === request.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                    Send
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    disabled={sendingDraftId === request.id || deletingDraftId === request.id}
                    onClick={() => handleDeleteDraft(request.id)}
                  >
                    {deletingDraftId === request.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Active Client Requests */}
      {activeClientRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Active ({activeClientRequests.length})
          </p>
          {activeClientRequests.map(r => renderRequestCard(r))}
        </div>
      )}

      {/* Completed Client Requests */}
      {completedClientRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedClientRequests.length})
          </p>
          {completedClientRequests.slice(0, 5).map(r => renderRequestCard(r))}
        </div>
      )}

      {/* Cancelled Client Requests */}
      {cancelledClientRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <X className="h-4 w-4" />
            Cancelled ({cancelledClientRequests.length})
          </p>
          {cancelledClientRequests.map((request) => (
            <Card key={request.id} className="opacity-60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-through">{request.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {requests.length === 0 && !showForm && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <MessageSquarePlus className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No requests yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>
              Submit Your First Request
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Asset Upload Dialog */}
      {sessionToken && (
        <ClientAssetUploadDialog
          open={assetUploadOpen}
          onOpenChange={setAssetUploadOpen}
          leadId={leadId}
          sessionToken={sessionToken}
          onUploaded={onRequestCreated}
        />
      )}
    </div>
  );
}
