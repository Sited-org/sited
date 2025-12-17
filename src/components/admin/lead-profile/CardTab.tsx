import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe('pk_live_51RO94BRjPvkTqNf8k3rZvWQf99n3VLKVXRoHdS4aMchEbvJPCQBrMI3KYGGLkWJW5hDeMJgQuwBCwDJMIbfwsGPi00M44WsKlm');

interface SavedCard {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface CardTabProps {
  lead: any;
  canEdit: boolean;
}

function CardForm({ lead, canEdit, onCardSaved }: { lead: any; canEdit: boolean; onCardSaved: (card: SavedCard) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSaveCard = async () => {
    if (!stripe || !elements) {
      toast.error('Stripe not loaded');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error('Card element not found');
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Create SetupIntent
      const { data: setupData, error: setupError } = await supabase.functions.invoke('create-setup-intent', {
        body: { lead_id: lead.id },
      });

      if (setupError || !setupData?.clientSecret) {
        throw new Error(setupError?.message || 'Failed to create setup intent');
      }

      // Step 2: Confirm SetupIntent with card details
      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(setupData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: lead.name || undefined,
            email: lead.email || undefined,
          },
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (!setupIntent?.payment_method) {
        throw new Error('No payment method returned');
      }

      // Step 3: Save payment method ID to lead
      const { data: saveData, error: saveError } = await supabase.functions.invoke('save-payment-method', {
        body: { 
          lead_id: lead.id, 
          payment_method_id: setupIntent.payment_method,
        },
      });

      if (saveError) {
        throw new Error(saveError.message || 'Failed to save payment method');
      }

      toast.success('Card saved successfully');
      onCardSaved(saveData.card);
      cardElement.clear();
    } catch (error: any) {
      console.error('Error saving card:', error);
      toast.error(error.message || 'Failed to save card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Payment Card</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-lg bg-background">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
          <p className="text-xs text-amber-700">
            Card details are securely processed by Stripe. We never see or store your full card number.
          </p>
        </div>

        <Button 
          onClick={handleSaveCard} 
          disabled={loading || !stripe || !canEdit}
          className="w-full bg-foreground text-background hover:bg-foreground/90"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Save Card
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export function CardTab({ lead, canEdit }: CardTabProps) {
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);

  useEffect(() => {
    fetchSavedCard();
  }, [lead.id]);

  const fetchSavedCard = async () => {
    setLoadingCard(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-saved-card', {
        body: { lead_id: lead.id },
      });

      if (error) throw error;
      
      if (data?.hasCard && data?.card) {
        setSavedCard(data.card);
      } else {
        setSavedCard(null);
      }
    } catch (error) {
      console.error('Error fetching saved card:', error);
      setSavedCard(null);
    } finally {
      setLoadingCard(false);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Card
          </CardTitle>
          <CardDescription>
            Securely store a card on file for future charges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>Card details are encrypted and securely stored via Stripe. We only save a reference to the card - actual card numbers are never stored on our servers.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Status */}
      {loadingCard ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Loading card details...</span>
            </div>
          </CardContent>
        </Card>
      ) : savedCard ? (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-700">Card on File</p>
                <p className="text-sm text-muted-foreground">
                  {getCardBrandIcon(savedCard.brand)} •••• {savedCard.last4} — Expires {savedCard.exp_month}/{savedCard.exp_year}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Card Form with Stripe Elements */}
      {canEdit && (
        <Elements stripe={stripePromise}>
          <CardForm 
            lead={lead} 
            canEdit={canEdit} 
            onCardSaved={(card) => setSavedCard(card)} 
          />
        </Elements>
      )}

      {!canEdit && !savedCard && !loadingCard && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              No card on file. Contact an admin to add payment details.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
