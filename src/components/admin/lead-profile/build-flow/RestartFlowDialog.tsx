import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface RestartFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  onConfirm: () => Promise<void>;
}

export function RestartFlowDialog({ open, onOpenChange, businessName, onConfirm }: RestartFlowDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setStep(1);
    setConfirmText('');
    onOpenChange(false);
  };

  const handleFinalConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const nameMatches = confirmText.trim().toLowerCase() === businessName.trim().toLowerCase();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 1 && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-destructive/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <DialogTitle>Restart Build Flow?</DialogTitle>
              </div>
              <DialogDescription className="pt-2">
                Are you sure you want to restart the entire build flow for <strong>{businessName}</strong>? This action will require a second confirmation.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button variant="destructive" onClick={() => setStep(2)}>
                Yes, continue
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-destructive/10 p-2">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <DialogTitle>Confirm Permanent Deletion</DialogTitle>
              </div>
              <DialogDescription className="pt-2 space-y-2">
                <p>
                  <strong>All build-flow progress will be permanently lost and cannot be recovered.</strong>
                </p>
                <p>
                  This includes all phases, steps, discovery answers, brand assets, credentials, and completion records associated with this build flow.
                </p>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="confirm-name">
                Type <strong className="text-destructive">{businessName}</strong> to confirm
              </Label>
              <Input
                id="confirm-name"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={businessName}
                autoComplete="off"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setStep(1); setConfirmText(''); }}>
                Back
              </Button>
              <Button
                variant="destructive"
                disabled={!nameMatches || loading}
                onClick={handleFinalConfirm}
              >
                {loading ? 'Deleting...' : 'Confirm Deletion'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
