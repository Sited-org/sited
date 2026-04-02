import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Loader2, CheckCircle2, FileText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientFileUploadButtonProps {
  requestId: string;
  leadId: string;
  sessionToken: string;
  onUploaded?: () => void;
}

export function ClientFileUploadButton({ requestId, leadId, sessionToken, onUploaded }: ClientFileUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append('session_token', sessionToken);
        formData.append('lead_id', leadId);
        formData.append('request_id', requestId);
        formData.append('file', file);

        const { data, error } = await supabase.functions.invoke('upload-request-attachment', { body: formData });
        if (error) throw new Error(error.message || 'Upload failed');
        if (data?.error) throw new Error(data.error);

        setUploadedFiles(prev => [...prev, file.name]);
      }
      toast.success(`${validFiles.length} file${validFiles.length > 1 ? 's' : ''} uploaded`);
      onUploaded?.();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mt-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Uploading...</>
        ) : (
          <><Paperclip className="h-3 w-3 mr-1" />Attach Files</>
        )}
      </Button>
      {uploadedFiles.length > 0 && (
        <div className="mt-1 space-y-1">
          {uploadedFiles.map((name, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <span className="truncate">{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
