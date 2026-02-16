import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, FolderUp, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  uploaded_at: string;
}

interface UploadedFilesDialogProps {
  files: UploadedFile[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadedFilesDialog({ files }: UploadedFilesDialogProps) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (file: UploadedFile) => {
    setDownloading(file.file_path);
    try {
      const { data, error } = await supabase.storage
        .from('onboarding-files')
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: 'Download failed', description: err.message, variant: 'destructive' });
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    for (const file of files) {
      await handleDownload(file);
    }
  };

  const handleUploadToGDrive = (file: UploadedFile) => {
    // Open Google Drive upload page - user can upload manually
    // For full integration, a Google Drive API connector would be needed
    toast({ title: 'Google Drive', description: 'Download the file first, then upload to Google Drive.' });
    window.open('https://drive.google.com/drive/my-drive', '_blank');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Uploaded Files ({files.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Files
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No files uploaded</p>
          ) : (
            <>
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(file)}
                      disabled={downloading === file.file_path}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleUploadToGDrive(file)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={handleDownloadAll} className="gap-2 flex-1">
                  <Download className="h-4 w-4" />
                  Download All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://drive.google.com/drive/my-drive', '_blank')}
                  className="gap-2 flex-1"
                >
                  <FolderUp className="h-4 w-4" />
                  Open Google Drive
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
