import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Image, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { BuildStep } from '@/hooks/useBuildFlow';

interface StepCompleteModalProps {
  step: BuildStep;
  buildFlowId: string;
  onClose: () => void;
  onComplete: (description: string, screenshotUrl?: string | null) => Promise<void>;
}

// Steps that require a file upload (screenshot/document) to complete
const UPLOAD_REQUIRED_STEPS = [
  'sitemap_drafted',
  'sitemap_approved',
  'contract_signed',
  'fe_signoff',
];

export function StepCompleteModal({ step, buildFlowId, onClose, onComplete }: StepCompleteModalProps) {
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requiresUpload = UPLOAD_REQUIRED_STEPS.includes(step.step_key);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const path = `${buildFlowId}/${step.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from('build-assets')
      .upload(path, file);

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('build-assets')
        .getPublicUrl(path);
      setScreenshotUrl(publicUrl);
    }
    setUploading(false);
  };

  const canSubmit = description.length >= 20 && (!requiresUpload || !!screenshotUrl);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await onComplete(description, screenshotUrl);
    setSubmitting(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Mark Complete: {step.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Screenshot Upload */}
          <div>
            <Label>
              {requiresUpload ? 'Attachment (required)' : 'Screenshot (optional)'}
            </Label>
            {requiresUpload && !screenshotUrl && (
              <div className="flex items-center gap-2 mt-1 mb-2 text-amber-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-xs">A file must be uploaded to complete this step.</span>
              </div>
            )}
            {screenshotUrl ? (
              <div className="mt-2 relative">
                <img src={screenshotUrl} alt="Screenshot" className="rounded-lg max-h-48 object-cover w-full" />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => setScreenshotUrl(null)}
                >
                  Replace
                </Button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Image className="h-8 w-8" />
                      <span className="text-sm">Click or drag to upload</span>
                    </>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Description */}
          <div>
            <Label>Description (required — min 20 characters)</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what was completed…"
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/20 characters minimum
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {submitting ? 'Saving...' : 'Confirm Complete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
