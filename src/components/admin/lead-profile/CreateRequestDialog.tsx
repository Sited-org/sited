import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Loader2,
  X,
  Paperclip,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SelectedFile {
  file: File;
  preview?: string;
}

interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName?: string;
  leadEmail?: string;
  onRequestCreated: () => void;
}

export function CreateRequestDialog({ 
  open, 
  onOpenChange, 
  leadId, 
  leadName, 
  leadEmail,
  onRequestCreated 
}: CreateRequestDialogProps) {
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
    const uploadPromises = selectedFiles.map(async ({ file }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${requestId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('request-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: recordError } = await supabase
        .from('request_attachments')
        .insert({
          request_id: requestId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          content_type: file.type,
          uploaded_by: 'admin'
        });

      if (recordError) throw recordError;
    });

    await Promise.all(uploadPromises);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setBody('');
    setPriority('normal');
    selectedFiles.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
    setSelectedFiles([]);
  };

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
        body: body.trim() || null,
        priority,
      }).select().single();

      if (error) throw error;

      // Upload files if any
      if (selectedFiles.length > 0) {
        await uploadFiles(newRequest.id);
      }

      // Send notification
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
            has_attachments: selectedFiles.length > 0,
            created_by_admin: true,
          },
        });
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
      }

      toast.success('Request created on behalf of client');
      resetForm();
      onOpenChange(false);
      onRequestCreated();
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast.error('Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Request on Behalf of Client</DialogTitle>
          <DialogDescription>
            Submit a request for {leadName || 'this client'}. They will be notified.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm">Title *</Label>
            <Input
              id="title"
              placeholder="What does the client need?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              placeholder="Explain what the client needs and why..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">Describe the request</p>
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
            <p className="text-xs text-muted-foreground">Text or code that should be added to their site - formatting (bold, italics, etc.) is preserved</p>
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

          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
