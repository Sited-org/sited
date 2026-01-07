import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Loader2,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Download
} from 'lucide-react';
import { format, addWeeks, addMonths, addQuarters, addYears, isBefore, startOfDay } from 'date-fns';
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

interface Transaction {
  id: string;
  item: string;
  credit: number;
  debit: number;
  transaction_date: string;
  status: string;
  is_recurring: boolean;
  recurring_interval: string | null;
}

interface PaymentsTabProps {
  lead: {
    id: string;
    name: string;
    email: string;
  };
  email: string;
  transactions: Transaction[];
  savedPaymentMethod: SavedPaymentMethod | null;
  onPaymentMethodSaved: (pm: SavedPaymentMethod) => void;
}

function getNextDate(date: Date, interval: string): Date {
  switch (interval) {
    case 'weekly': return addWeeks(date, 1);
    case 'monthly': return addMonths(date, 1);
    case 'quarterly': return addQuarters(date, 1);
    case 'yearly': return addYears(date, 1);
    default: return addMonths(date, 1);
  }
}

function generateUpcomingCharges(transactions: Transaction[]): Transaction[] {
  const upcoming: Transaction[] = [];
  const today = startOfDay(new Date());
  const oneMonthFromNow = addMonths(today, 1);

  transactions.forEach(t => {
    if (t.is_recurring && t.recurring_interval && t.debit > 0) {
      let nextDate = getNextDate(new Date(t.transaction_date), t.recurring_interval);
      
      while (isBefore(nextDate, oneMonthFromNow)) {
        if (!isBefore(nextDate, today)) {
          upcoming.push({
            ...t,
            id: `upcoming-${t.id}-${upcoming.length}`,
            transaction_date: nextDate.toISOString(),
            status: 'upcoming',
          });
        }
        nextDate = getNextDate(nextDate, t.recurring_interval);
      }
    }
  });

  // Also add pending transactions
  transactions.forEach(t => {
    if (t.status === 'pending' && t.debit > 0) {
      upcoming.push(t);
    }
  });

  return upcoming.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
}

function CardForm({ lead, email, onCardSaved }: { lead: any; email: string; onCardSaved: (pm: SavedPaymentMethod) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSaveCard = async () => {
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setLoading(true);
    
    try {
      const { data: setupData, error: setupError } = await supabase.functions.invoke('client-create-setup-intent', {
        body: { lead_id: lead.id, email },
      });

      if (setupError || !setupData?.clientSecret) throw new Error('Failed to create setup intent');

      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(setupData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: lead.name || undefined, email: email || undefined },
        },
      });

      if (confirmError) throw new Error(confirmError.message);
      if (!setupIntent?.payment_method) throw new Error('No payment method returned');

      const { data: saveData, error: saveError } = await supabase.functions.invoke('client-save-payment-method', {
        body: { lead_id: lead.id, email, payment_method_id: setupIntent.payment_method },
      });

      if (saveError) throw new Error('Failed to save payment method');

      toast.success('Card saved successfully');
      onCardSaved({ type: 'card', card: saveData.card });
      cardElement.clear();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-background">
        <CardElement options={{ style: { base: { fontSize: '16px', color: '#424770' } } }} />
      </div>
      <Button onClick={handleSaveCard} disabled={loading || !stripe} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
        {loading ? 'Processing...' : 'Save Card'}
      </Button>
    </div>
  );
}

function BankForm({ lead, email, onBankSaved }: { lead: any; email: string; onBankSaved: (pm: SavedPaymentMethod) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [accountName, setAccountName] = useState(lead.name || '');

  const handleSave = async () => {
    if (!stripe || !elements || !accountName.trim()) return;

    const auBankElement = elements.getElement(AuBankAccountElement);
    if (!auBankElement) return;

    setLoading(true);
    
    try {
      const { data: setupData, error: setupError } = await supabase.functions.invoke('client-create-setup-intent', {
        body: { lead_id: lead.id, email, payment_method_type: 'au_becs_debit' },
      });

      if (setupError || !setupData?.clientSecret) throw new Error('Failed to create setup intent');

      const { setupIntent, error: confirmError } = await stripe.confirmAuBecsDebitSetup(setupData.clientSecret, {
        payment_method: {
          au_becs_debit: auBankElement,
          billing_details: { name: accountName, email },
        },
      });

      if (confirmError) throw new Error(confirmError.message);
      if (!setupIntent?.payment_method) throw new Error('No payment method returned');

      const { data: saveData, error: saveError } = await supabase.functions.invoke('client-save-payment-method', {
        body: { lead_id: lead.id, email, payment_method_id: setupIntent.payment_method },
      });

      if (saveError) throw new Error('Failed to save payment method');

      toast.success('Bank account saved successfully');
      onBankSaved({ type: 'au_becs_debit', au_becs_debit: saveData.au_becs_debit });
      auBankElement.clear();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save bank account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Account Holder Name</label>
        <input
          className="w-full p-3 border rounded-lg"
          placeholder="Name on account"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
        />
      </div>
      <div className="p-4 border rounded-lg bg-background">
        <AuBankAccountElement options={{ style: { base: { fontSize: '16px', color: '#424770' } } }} />
      </div>
      <Button onClick={handleSave} disabled={loading || !stripe || !accountName.trim()} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
        {loading ? 'Processing...' : 'Save Bank Account'}
      </Button>
    </div>
  );
}

export function PaymentsTab({ lead, email, transactions, savedPaymentMethod, onPaymentMethodSaved }: PaymentsTabProps) {
  const upcomingCharges = useMemo(() => generateUpcomingCharges(transactions), [transactions]);
  
  const totalDebit = transactions.reduce((sum, t) => sum + Number(t.debit), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + Number(t.credit), 0);
  const currentBalance = totalDebit - totalCredit;
  const nextPayment = upcomingCharges[0];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${currentBalance > 0 ? 'bg-orange-500/10' : 'bg-green-500/10'}`}>
                <DollarSign className={`h-6 w-6 ${currentBalance > 0 ? 'text-orange-600' : 'text-green-600'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance Due</p>
                <p className={`text-2xl font-bold ${currentBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  ${Math.abs(currentBalance).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Payment</p>
                <p className="text-lg font-bold">
                  {nextPayment ? format(new Date(nextPayment.transaction_date), 'MMM d') : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${savedPaymentMethod ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                <CreditCard className={`h-6 w-6 ${savedPaymentMethod ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="text-lg font-bold">{savedPaymentMethod ? 'Active' : 'Not Set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Charges */}
      {upcomingCharges.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Upcoming Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingCharges.slice(0, 5).map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div>
                    <p className="font-medium">{charge.item}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(charge.transaction_date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-600/30">
                    ${Number(charge.debit).toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Payment Method */}
      {savedPaymentMethod && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div className="flex-1">
                <p className="font-semibold text-green-700">Payment Method Active</p>
                {savedPaymentMethod.type === 'card' && savedPaymentMethod.card && (
                  <p className="text-sm text-muted-foreground">
                    {savedPaymentMethod.card.brand.toUpperCase()} •••• {savedPaymentMethod.card.last4} — Expires {savedPaymentMethod.card.exp_month}/{savedPaymentMethod.card.exp_year}
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
          <CardDescription>Securely save a card or bank account</CardDescription>
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
                  Bank
                </TabsTrigger>
              </TabsList>
              <TabsContent value="card">
                <CardForm lead={lead} email={email} onCardSaved={onPaymentMethodSaved} />
              </TabsContent>
              <TabsContent value="bank">
                <BankForm lead={lead} email={email} onBankSaved={onPaymentMethodSaved} />
              </TabsContent>
            </Tabs>
          </Elements>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 10).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(t.transaction_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{t.item}</TableCell>
                      <TableCell className={`text-right ${t.debit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {t.debit > 0 ? `-$${Number(t.debit).toFixed(2)}` : `+$${Number(t.credit).toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
