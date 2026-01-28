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
  Image as ImageIcon
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
  sessionToken?: string;
}

interface SelectedFile {
  file: File;
  preview?: string;
}

export function MyRequestsTab({ leadId, leadName, leadEmail, requests, onRequestCreated, sessionToken }: MyRequestsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<string>('normal');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
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
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadFiles = async (requestId: string) => {
    if (!sessionToken) {
      throw new Error('Session token required for file upload');
    }

    const uploadPromises = selectedFiles.map(async ({ file }) => {
      const formData = new FormData();
      formData.append('session_token', sessionToken);
      formData.append('lead_id', leadId);
      formData.append('request_id', requestId);
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('upload-request-attachment', {
        body: formData,
      });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload ${file.name}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a request title');
      return;
    }

    if (!sessionToken) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      // Use the secure edge function to submit the request
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
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to submit request');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const newRequest = data?.request;
      
      if (!newRequest?.id) {
        throw new Error('Failed to create request');
      }

      // Upload files if any - using the service role bucket access
      if (selectedFiles.length > 0) {
        try {
          await uploadFiles(newRequest.id);
        } catch (uploadError) {
          console.error('File upload error (non-fatal):', uploadError);
          toast.warning('Request submitted but some files failed to upload');
        }
      }

      toast.success('Request submitted');
      setTitle('');
      setDescription('');
      setBody('');
      setPriority('normal');
      setSelectedFiles([]);
      setShowForm(false);
      onRequestCreated();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error(error.message || 'Failed to submit request');
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
                  onClick={() => {
                    setShowForm(false);
                    setSelectedFiles([]);
                  }}
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
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe exactly what we are changing, on which area of your website"
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= 100) {
                      setDescription(e.target.value);
                    }
                  }}
                  maxLength={100}
                  disabled={submitting}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">{description.length}/100 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body" className="text-sm">Content to Upload</Label>
                <RichTextEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Paste text, code, or content that needs to be added (formatting is preserved)..."
                  disabled={submitting}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">Text or code that should be added to your site - formatting (bold, italics, etc.) is preserved</p>
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

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-sm">Attachments</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={submitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  className="w-full"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Add Files
                </Button>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {selectedFiles.map((item, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                      >
                        {item.preview ? (
                          <img 
                            src={item.preview} 
                            alt={item.file.name}
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{item.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(item.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={submitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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