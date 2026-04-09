import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_live_51JrYQ7KEOhx2BLuXYJRHZBM73eHstHWeshWHlBjKoj5XdOoXCIHbSN9oGaPRNeUNUQaja8o2a4cCoyHdbPSZzfzA00BOHBEapc');

interface AdminPayNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  businessName: string;
  onPaymentComplete: () => void;
}

function PaymentForm({ onPaymentComplete, onClose }: { onPaymentComplete: () => void; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        setSucceeded(true);
        toast.success('Deposit payment processed successfully');
        setTimeout(() => {
          onPaymentComplete();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      toast.error('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <p className="text-lg font-semibold">Payment Successful</p>
        <p className="text-sm text-muted-foreground">The deposit has been processed.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || processing}>
          {processing ? (
            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing…</>
          ) : (
            <><CreditCard className="h-4 w-4 mr-1" /> Pay Now</>
          )}
        </Button>
      </div>
    </form>
  );
}

export function AdminPayNowDialog({ open, onOpenChange, leadId, businessName, onPaymentComplete }: AdminPayNowDialogProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(49);
  const [loading, setLoading] = useState(false);

  const initPayment = async () => {
    if (clientSecret) return; // Already initialized
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-charge-deposit', {
        body: { lead_id: leadId },
      });

      if (error || !data?.clientSecret) {
        toast.error('Failed to initialize payment');
        onOpenChange(false);
        return;
      }

      setClientSecret(data.clientSecret);
      setDepositAmount(data.depositAmount || 49);
    } catch (err) {
      console.error(err);
      toast.error('Failed to initialize payment');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  // Initialize when dialog opens
  if (open && !clientSecret && !loading) {
    initPayment();
  }

  // Reset when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setClientSecret(null);
      setLoading(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Process Deposit Payment
          </DialogTitle>
          <DialogDescription>
            Charge ${depositAmount} AUD deposit for {businessName}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#09090b',
                  borderRadius: '8px',
                },
              },
            }}
          >
            <PaymentForm
              onPaymentComplete={onPaymentComplete}
              onClose={() => handleOpenChange(false)}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
