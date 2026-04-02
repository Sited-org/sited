import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const LOGO_SLOTS = [
  { key: 'logo_512', label: 'Logo 512×512', desc: 'Main App Icon', dims: '512×512' },
  { key: 'logo_192', label: 'Logo 192×192', desc: 'PWA Icon', dims: '192×192' },
  { key: 'logo_apple_touch', label: 'Apple Touch Icon', desc: 'iOS Home Screen', dims: '180×180' },
  { key: 'og_image', label: 'Social Share Image', desc: 'OG Image', dims: '1200×630' },
] as const;

interface ClientAssetUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  sessionToken: string;
  onUploaded?: () => void;
}

export function ClientAssetUploadDialog({ open, onOpenChange, leadId, sessionToken, onUploaded }: ClientAssetUploadDialogProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<Record<string, string>>({});

  const handleUpload = async (slotKey: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large (max 10MB)');
      return;
    }

    setUploading(slotKey);
    try {
      const formData = new FormData();
      formData.append('session_token', sessionToken);
      formData.append('lead_id', leadId);
      formData.append('slot_key', slotKey);
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('upload-client-asset', { body: formData });
      
      if (error) throw new Error(error.message || 'Upload failed');
      if (data?.error) throw new Error(data.error);

      setUploaded(prev => ({ ...prev, [slotKey]: data.publicUrl }));
      toast.success(`${LOGO_SLOTS.find(s => s.key === slotKey)?.label || 'Asset'} uploaded`);
      onUploaded?.();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Brand Assets</DialogTitle>
          <DialogDescription>
            Upload your logo and brand images. These will be used in your website.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {LOGO_SLOTS.map(slot => {
            const isUploaded = !!uploaded[slot.key];
            const isUploading = uploading === slot.key;

            return (
              <div key={slot.key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{slot.label}</p>
                    <p className="text-xs text-muted-foreground">{slot.desc} • {slot.dims}</p>
                  </div>
                  {isUploaded && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                </div>

                {isUploaded ? (
                  <div className="relative">
                    <img src={uploaded[slot.key]} alt={slot.label} className="w-full h-20 object-contain bg-muted rounded" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded cursor-pointer">
                      <span className="text-white text-xs font-medium">Replace</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleUpload(slot.key, e.target.files[0])}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Click to upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={e => e.target.files?.[0] && handleUpload(slot.key, e.target.files[0])}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
