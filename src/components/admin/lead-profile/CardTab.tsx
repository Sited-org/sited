import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Lock, AlertCircle, CheckCircle2, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements, AuBankAccountElement } from '@stripe/react-stripe-js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe('pk_live_51RO94BRjPvkTqNf8k3rZvWQf99n3VLKVXRoHdS4aMchEbvJPCQBrMI3KYGGLkWJW5hDeMJgQuwBCwDJMIbfwsGPi00M44WsKlm');

interface SavedPaymentMethod {
  type: 'card' | 'au_becs_debit';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  au_becs_debit?: {
    bsb_number: string;
    last4: string;
  };
}

interface CardTabProps {
  lead: any;
  canEdit: boolean;
}

function CardForm({ lead, canEdit, onCardSaved }: { lead: any; canEdit: boolean; onCardSaved: (pm: SavedPaymentMethod) => void }) {
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
      const { data: setupData, error: setupError } = await supabase.functions.invoke('create-setup-intent', {
        body: { lead_id: lead.id },
      });

      if (setupError || !setupData?.clientSecret) {
        throw new Error(setupError?.message || 'Failed to create setup intent');
      }

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
      onCardSaved({ type: 'card', card: saveData.card });
      cardElement.clear();
    } catch (error: any) {
      console.error('Error saving card:', error);
      toast.error(error.message || 'Failed to save card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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
    </div>
  );
}

function BankAccountForm({ lead, canEdit, onBankSaved }: { lead: any; canEdit: boolean; onBankSaved: (pm: SavedPaymentMethod) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [accountName, setAccountName] = useState(lead.name || '');

  const handleSaveBankAccount = async () => {
    if (!stripe || !elements) {
      toast.error('Stripe not loaded');
      return;
    }

    const auBankAccountElement = elements.getElement(AuBankAccountElement);
    if (!auBankAccountElement) {
      toast.error('Bank account element not found');
      return;
    }

    if (!accountName.trim()) {
      toast.error('Account holder name is required');
      return;
    }

    setLoading(true);
    
    try {
      const { data: setupData, error: setupError } = await supabase.functions.invoke('create-setup-intent', {
        body: { lead_id: lead.id, payment_method_type: 'au_becs_debit' },
      });

      if (setupError || !setupData?.clientSecret) {
        throw new Error(setupError?.message || 'Failed to create setup intent');
      }

      const { setupIntent, error: confirmError } = await stripe.confirmAuBecsDebitSetup(setupData.clientSecret, {
        payment_method: {
          au_becs_debit: auBankAccountElement,
          billing_details: {
            name: accountName,
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

      const { data: saveData, error: saveError } = await supabase.functions.invoke('save-payment-method', {
        body: { 
          lead_id: lead.id, 
          payment_method_id: setupIntent.payment_method,
        },
      });

      if (saveError) {
        throw new Error(saveError.message || 'Failed to save payment method');
      }

      toast.success('Bank account saved successfully');
      onBankSaved({ type: 'au_becs_debit', au_becs_debit: saveData.au_becs_debit });
      auBankAccountElement.clear();
    } catch (error: any) {
      console.error('Error saving bank account:', error);
      toast.error(error.message || 'Failed to save bank account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="accountName">Account Holder Name</Label>
        <Input
          id="accountName"
          placeholder="Name on account"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>BSB & Account Number</Label>
        <div className="p-4 border rounded-lg bg-background">
          <AuBankAccountElement 
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
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
        <div className="text-xs text-blue-700 space-y-1">
          <p className="font-medium">Direct Debit Request Service Agreement</p>
          <p>By providing your bank account details, you agree to this Direct Debit Request and the Direct Debit Request Service Agreement.</p>
        </div>
      </div>

      <Button 
        onClick={handleSaveBankAccount} 
        disabled={loading || !stripe || !canEdit || !accountName.trim()}
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
            Save Bank Account
          </>
        )}
      </Button>
    </div>
  );
}

export function CardTab({ lead, canEdit }: CardTabProps) {
  const [savedPaymentMethod, setSavedPaymentMethod] = useState<SavedPaymentMethod | null>(null);
  const [loadingPaymentMethod, setLoadingPaymentMethod] = useState(true);

  useEffect(() => {
    fetchSavedPaymentMethod();
  }, [lead.id]);

  const fetchSavedPaymentMethod = async () => {
    setLoadingPaymentMethod(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-saved-card', {
        body: { lead_id: lead.id },
      });

      if (error) throw error;
      
      if (data?.hasCard) {
        if (data.card) {
          setSavedPaymentMethod({ type: 'card', card: data.card });
        } else if (data.au_becs_debit) {
          setSavedPaymentMethod({ type: 'au_becs_debit', au_becs_debit: data.au_becs_debit });
        }
      } else {
        setSavedPaymentMethod(null);
      }
    } catch (error) {
      console.error('Error fetching saved payment method:', error);
      setSavedPaymentMethod(null);
    } finally {
      setLoadingPaymentMethod(false);
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
            Payment Method
          </CardTitle>
          <CardDescription>
            Securely store a card or bank account on file for future charges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>Payment details are encrypted and securely stored via Stripe. We only save a reference - actual numbers are never stored on our servers.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Status */}
      {loadingPaymentMethod ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Loading payment details...</span>
            </div>
          </CardContent>
        </Card>
      ) : savedPaymentMethod ? (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-700">Payment Method on File</p>
                {savedPaymentMethod.type === 'card' && savedPaymentMethod.card && (
                  <p className="text-sm text-muted-foreground">
                    {getCardBrandIcon(savedPaymentMethod.card.brand)} •••• {savedPaymentMethod.card.last4} — Expires {savedPaymentMethod.card.exp_month}/{savedPaymentMethod.card.exp_year}
                  </p>
                )}
                {savedPaymentMethod.type === 'au_becs_debit' && savedPaymentMethod.au_becs_debit && (
                  <p className="text-sm text-muted-foreground">
                    Bank Account (BSB: {savedPaymentMethod.au_becs_debit.bsb_number}) •••• {savedPaymentMethod.au_becs_debit.last4}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Payment Method Form with Tabs */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {savedPaymentMethod ? 'Update Payment Method' : 'Add Payment Method'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise}>
              <Tabs defaultValue="card" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="card" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card
                  </TabsTrigger>
                  <TabsTrigger value="bank" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Bank Account
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="card">
                  <CardForm 
                    lead={lead} 
                    canEdit={canEdit} 
                    onCardSaved={(pm) => setSavedPaymentMethod(pm)} 
                  />
                </TabsContent>
                <TabsContent value="bank">
                  <BankAccountForm 
                    lead={lead} 
                    canEdit={canEdit} 
                    onBankSaved={(pm) => setSavedPaymentMethod(pm)} 
                  />
                </TabsContent>
              </Tabs>
            </Elements>
          </CardContent>
        </Card>
      )}

      {!canEdit && !savedPaymentMethod && !loadingPaymentMethod && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              No payment method on file. Contact an admin to add payment details.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
