import { useState } from 'react';
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

const stripePromise = loadStripe('pk_live_51JrYQ7KEOhx2BLuXYJRHZBM73eHstHWeshWHlBjKoj5XdOoXCIHbSN9oGaPRNeUNUQaja8o2a4cCoyHdbPSZzfzA00BOHBEapc');

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

interface ClientPaymentMethodTabProps {
  lead: {
    id: string;
    name: string;
    email: string;
  };
  email: string;
  savedPaymentMethod: SavedPaymentMethod | null;
  onPaymentMethodSaved: (pm: SavedPaymentMethod) => void;
}

function CardForm({ lead, email, onCardSaved }: { lead: any; email: string; onCardSaved: (pm: SavedPaymentMethod) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSaveCard = async () => {
    if (!stripe || !elements) {
      toast.error('Payment system not loaded');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error('Card element not found');
      return;
    }

    setLoading(true);
    
    try {
      const { data: setupData, error: setupError } = await supabase.functions.invoke('client-create-setup-intent', {
        body: { lead_id: lead.id, email },
      });

      if (setupError || !setupData?.clientSecret) {
        throw new Error(setupError?.message || 'Failed to create setup intent');
      }

      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(setupData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: lead.name || undefined,
            email: email || undefined,
          },
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (!setupIntent?.payment_method) {
        throw new Error('No payment method returned');
      }

      const { data: saveData, error: saveError } = await supabase.functions.invoke('client-save-payment-method', {
        body: { 
          lead_id: lead.id, 
          email,
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
        disabled={loading || !stripe}
        className="w-full"
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

function BankAccountForm({ lead, email, onBankSaved }: { lead: any; email: string; onBankSaved: (pm: SavedPaymentMethod) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [accountName, setAccountName] = useState(lead.name || '');

  const handleSaveBankAccount = async () => {
    if (!stripe || !elements) {
      toast.error('Payment system not loaded');
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
      const { data: setupData, error: setupError } = await supabase.functions.invoke('client-create-setup-intent', {
        body: { lead_id: lead.id, email, payment_method_type: 'au_becs_debit' },
      });

      if (setupError || !setupData?.clientSecret) {
        throw new Error(setupError?.message || 'Failed to create setup intent');
      }

      const { setupIntent, error: confirmError } = await stripe.confirmAuBecsDebitSetup(setupData.clientSecret, {
        payment_method: {
          au_becs_debit: auBankAccountElement,
          billing_details: {
            name: accountName,
            email: email || undefined,
          },
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (!setupIntent?.payment_method) {
        throw new Error('No payment method returned');
      }

      const { data: saveData, error: saveError } = await supabase.functions.invoke('client-save-payment-method', {
        body: { 
          lead_id: lead.id, 
          email,
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
        disabled={loading || !stripe || !accountName.trim()}
        className="w-full"
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

export function ClientPaymentMethodTab({ lead, email, savedPaymentMethod, onPaymentMethodSaved }: ClientPaymentMethodTabProps) {
  const getCardBrandIcon = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Securely store a card or bank account on file for payments.
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

      {/* Current Payment Method */}
      {savedPaymentMethod && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-700">Current Payment Method</p>
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
      )}

      {/* Payment Method Form */}
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
                  email={email}
                  onCardSaved={onPaymentMethodSaved} 
                />
              </TabsContent>
              <TabsContent value="bank">
                <BankAccountForm 
                  lead={lead} 
                  email={email}
                  onBankSaved={onPaymentMethodSaved} 
                />
              </TabsContent>
            </Tabs>
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}
