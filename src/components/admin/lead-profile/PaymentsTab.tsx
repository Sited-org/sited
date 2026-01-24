import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, DollarSign, TrendingUp, TrendingDown, Send, FileText, RefreshCw, Calendar, XCircle, CreditCard, Wallet, Package, Ban, Banknote } from 'lucide-react';
import { useTransactions, TransactionWithBalance } from '@/hooks/useTransactions';
import { useMemberships } from '@/hooks/useMemberships';
import { useProducts } from '@/hooks/useProducts';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ActiveSubscriptions } from './ActiveSubscriptions';

interface PaymentsTabProps {
  lead: any;
  dealAmount: string;
  setDealAmount: (v: string) => void;
  canEdit: boolean;
}

export function PaymentsTab({ lead, dealAmount, setDealAmount, canEdit }: PaymentsTabProps) {
  const { 
    transactions, 
    rawTransactions,
    loading, 
    totalCredit, 
    totalDebit, 
    currentBalance, 
    addTransaction, 
    deleteTransaction,
    voidTransaction,
    canDeleteTransaction,
    canVoidTransaction,
    cancelRecurring 
  } = useTransactions(lead.id);

  const { activeMemberships } = useMemberships();
  const { activeProducts } = useProducts();
  
  // Product/Membership selection state
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedMembership, setSelectedMembership] = useState<string>('');
  const [membershipStartDate, setMembershipStartDate] = useState<string>('');
  const [transactionNotes, setTransactionNotes] = useState('');

  // Invoice state
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);

  // Payment state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPaymentItems, setSelectedPaymentItems] = useState<string[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Void state
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidTransactionId, setVoidTransactionId] = useState<string>('');
  const [voidReason, setVoidReason] = useState('');
  const [processingVoid, setProcessingVoid] = useState(false);

  // Manual payment state
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false);
  const [manualPaymentAmount, setManualPaymentAmount] = useState('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState<string>('cash');
  const [manualPaymentDescription, setManualPaymentDescription] = useState('');
  const [manualPaymentDate, setManualPaymentDate] = useState('');
  const [selectedManualPaymentItems, setSelectedManualPaymentItems] = useState<string[]>([]);
  const [recordingManualPayment, setRecordingManualPayment] = useState(false);

  // Add credit state
  const [addCreditOpen, setAddCreditOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');
  const [addingCredit, setAddingCredit] = useState(false);

  // Membership subscription state
  const [creatingSubscription, setCreatingSubscription] = useState(false);

  const handleAddProduct = async () => {
    const product = activeProducts.find(p => p.id === selectedProduct);
    if (!product) return;

    await addTransaction({
      lead_id: lead.id,
      item: product.name,
      credit: 0,
      debit: product.price,
      notes: transactionNotes || product.description || null,
      transaction_date: new Date().toISOString(),
      is_recurring: false,
      recurring_interval: null,
      recurring_end_date: null,
      parent_transaction_id: null,
      status: 'completed',
      invoice_status: 'not_sent',
      stripe_invoice_id: null,
      payment_method: null,
    });

    setSelectedProduct('');
    setTransactionNotes('');
  };

  const handleAddMembership = async () => {
    const membership = activeMemberships.find(m => m.id === selectedMembership);
    if (!membership) return;

    // Use start date if provided, otherwise use today
    const startDate = membershipStartDate 
      ? new Date(membershipStartDate).toISOString() 
      : new Date().toISOString();

    // If card is on file, create a Stripe subscription for automatic billing
    if (lead.stripe_payment_method_id) {
      setCreatingSubscription(true);
      try {
        const { data, error } = await supabase.functions.invoke('create-membership-subscription', {
          body: {
            lead_id: lead.id,
            membership_name: membership.name,
            membership_price: membership.price,
            billing_interval: membership.billing_interval,
            start_date: startDate,
            notes: transactionNotes || membership.description || null,
          },
        });

        if (error) throw error;

        if (!data?.success) {
          throw new Error(data?.error || 'Failed to create subscription');
        }

        toast.success(`Stripe subscription created for ${membership.name}. Customer will be billed automatically each ${membership.billing_interval}.`);
        
        setSelectedMembership('');
        setMembershipStartDate('');
        setTransactionNotes('');
        
        // Refresh to show the new transaction
        window.location.reload();
      } catch (error: any) {
        console.error('Error creating subscription:', error);
        toast.error(error.message || 'Failed to create subscription');
      } finally {
        setCreatingSubscription(false);
      }
    } else {
      // No card on file - create a local recurring transaction that will accumulate
      setCreatingSubscription(true);
      try {
        await addTransaction({
          lead_id: lead.id,
          item: membership.name,
          credit: 0,
          debit: membership.price,
          notes: transactionNotes || membership.description || null,
          transaction_date: startDate,
          is_recurring: true,
          recurring_interval: membership.billing_interval,
          recurring_end_date: null,
          parent_transaction_id: null,
          status: 'completed',
          invoice_status: 'not_sent',
          stripe_invoice_id: null,
          payment_method: null,
        });

        toast.success(`Recurring membership "${membership.name}" added. Charges will accumulate ${membership.billing_interval} until paid.`);
        
        setSelectedMembership('');
        setMembershipStartDate('');
        setTransactionNotes('');
      } catch (error: any) {
        console.error('Error adding membership:', error);
        toast.error(error.message || 'Failed to add membership');
      } finally {
        setCreatingSubscription(false);
      }
    }
  };

  const toggleTransactionSelection = (id: string) => {
    setSelectedTransactions(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const selectAllTransactions = () => {
    const invoiceableDebits = getInvoiceableTransactions();
    if (selectedTransactions.length === invoiceableDebits.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(invoiceableDebits.map(t => t.id));
    }
  };

  // Get transactions that can be invoiced: unpaid charges that are not voided/void entries
  // Note: Transactions with [VOIDED: in notes but null invoice_status were reset for re-invoicing
  const getInvoiceableTransactions = () => {
    return transactions.filter(t => {
      // Must be a debit (charge)
      if (Number(t.debit) <= 0) return false;
      // Cannot be a future preview
      if (t.isFuture) return false;
      // Cannot be already paid, sent, processing, or void
      if (t.invoice_status === 'paid' || t.invoice_status === 'sent' || t.invoice_status === 'processing' || t.invoice_status === 'void') return false;
      // Cannot be a VOID: entry itself
      if (t.item.startsWith('VOID:')) return false;
      // If status is void, exclude completely
      if (t.status === 'void') return false;
      // If voided with [VOIDED: in notes, only allow if invoice_status was reset (null) for re-invoicing
      if (t.notes?.includes('[VOIDED:')) {
        // Allow re-invoicing if status was explicitly reset to null
        return t.invoice_status === null || t.invoice_status === undefined;
      }
      return true;
    });
  };

  const getSelectedItems = () => {
    return transactions
      .filter(t => selectedTransactions.includes(t.id))
      .filter(t => Number(t.debit) > 0 && !t.isFuture && t.invoice_status !== 'paid')
      .map(t => ({
        id: t.id,
        item: t.item,
        amount: Number(t.debit),
        date: format(new Date(t.transaction_date), 'PP'),
        notes: t.notes || undefined,
      }));
  };

  const handleSendInvoice = async () => {
    if (!lead.email) {
      toast.error('Client email address is required');
      return;
    }

    const items = getSelectedItems();
    if (items.length === 0) {
      toast.error('Please select at least one unpaid charge to include in the invoice');
      return;
    }

    // Filter out items that are not real transaction IDs
    const transactionIds = selectedTransactions.filter(id => !id.startsWith('future-'));

    setSendingInvoice(true);
    try {
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      const { data, error } = await supabase.functions.invoke('send-invoice', {
        body: {
          leadId: lead.id,
          clientEmail: lead.email,
          clientName: lead.name || 'Valued Client',
          businessName: lead.business_name,
          items,
          totalAmount,
          dueDate: invoiceDueDate || undefined,
          notes: invoiceNotes || undefined,
          transactionIds,
        },
      });

      if (error) throw error;

      toast.success(`Stripe Invoice sent to ${lead.email}`);
      setInvoiceOpen(false);
      setSelectedTransactions([]);
      setInvoiceNotes('');
      setInvoiceDueDate('');
      
      // Refresh transactions to show updated status
      window.location.reload();
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      toast.error(error.message || 'Failed to send invoice');
    } finally {
      setSendingInvoice(false);
    }
  };
  // Payment functions - only show truly unpaid items
  const getUnpaidDebits = () => {
    return transactions.filter(t => 
      Number(t.debit) > 0 && 
      !t.isFuture && 
      t.invoice_status !== 'paid' &&
      !t.item.startsWith('VOID:') && 
      !t.notes?.includes('[VOIDED:')
    );
  };

  const togglePaymentItemSelection = (id: string) => {
    setSelectedPaymentItems(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const selectAllPaymentItems = () => {
    const unpaidDebits = getUnpaidDebits();
    if (selectedPaymentItems.length === unpaidDebits.length) {
      setSelectedPaymentItems([]);
    } else {
      setSelectedPaymentItems(unpaidDebits.map(t => t.id));
    }
  };

  const getSelectedPaymentTotal = () => {
    return transactions
      .filter(t => selectedPaymentItems.includes(t.id))
      .reduce((sum, t) => sum + Number(t.debit), 0);
  };

  // Calculate available account credit that can be applied to new charges.
  // This is NOT the same as an overall negative balance.
  // We treat any paid credits as a pool that gets consumed by paid debits.
  const getAvailableCredit = () => {
    const eligible = transactions.filter(t =>
      !t.isFuture &&
      !t.item.startsWith('VOID:') &&
      !t.notes?.includes('[VOIDED:')
    );

    const creditPool = eligible.reduce((sum, t) => sum + Number(t.credit || 0), 0);
    const paidDebits = eligible
      .filter(t => t.invoice_status === 'paid')
      .reduce((sum, t) => sum + Number(t.debit || 0), 0);

    return Math.max(0, creditPool - paidDebits);
  };

  // Calculate credit to be applied and net charge amount
  const getCreditApplication = () => {
    const paymentTotal = getSelectedPaymentTotal();
    const availableCredit = getAvailableCredit();
    const creditToApply = Math.min(availableCredit, paymentTotal);
    const netChargeAmount = paymentTotal - creditToApply;
    return { paymentTotal, availableCredit, creditToApply, netChargeAmount };
  };

  const handleProcessPayment = async () => {
    if (selectedPaymentItems.length === 0) {
      toast.error('Please select at least one item to pay');
      return;
    }

    const { netChargeAmount } = getCreditApplication();

    // Only check for payment method if there's an amount to charge
    if (netChargeAmount > 0 && !lead.stripe_payment_method_id) {
      toast.error('No payment method on file. Please add a card or bank account in the Card tab first.');
      return;
    }

    setProcessingPayment(true);
    try {
      const paymentTotal = getSelectedPaymentTotal();
      const selectedItems = transactions.filter(t => selectedPaymentItems.includes(t.id));
      const description = selectedItems.map(t => t.item).join(', ');
      
      // Get real transaction IDs (not future previews)
      const realTransactionIds = selectedPaymentItems.filter(id => !id.startsWith('future-'));

      const { data, error } = await supabase.functions.invoke('charge-saved-card', {
        body: {
          lead_id: lead.id,
          amount: paymentTotal,
          description: description,
          item_description: description,
          transaction_ids: realTransactionIds,
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Payment was not successful');
      }
      
      // Show appropriate success message based on credit application
      const successMessage = data.creditApplied > 0 
        ? `$${data.creditApplied.toLocaleString()} credit applied${data.amountCharged > 0 ? `, $${data.amountCharged.toLocaleString()} charged` : ''}`
        : `Payment of $${paymentTotal.toLocaleString()} processed successfully`;
      
      toast.success(successMessage);
      setPaymentOpen(false);
      setSelectedPaymentItems([]);
      
      // Refresh transactions to show the new credit entry
      window.location.reload();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleOpenVoid = (transactionId: string) => {
    setVoidTransactionId(transactionId);
    setVoidReason('');
    setVoidOpen(true);
  };

  const handleVoid = async () => {
    if (!voidReason.trim()) {
      toast.error('Please provide a reason for voiding this transaction');
      return;
    }
    
    setProcessingVoid(true);
    try {
      const { error } = await voidTransaction(voidTransactionId, voidReason.trim());
      if (error) throw error;
      
      setVoidOpen(false);
      setVoidTransactionId('');
      setVoidReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to void transaction');
    } finally {
      setProcessingVoid(false);
    }
  };

  // Manual payment helpers
  const toggleManualPaymentItemSelection = (id: string) => {
    setSelectedManualPaymentItems(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const selectAllManualPaymentItems = () => {
    const unpaidDebits = getUnpaidDebits();
    if (selectedManualPaymentItems.length === unpaidDebits.length) {
      setSelectedManualPaymentItems([]);
    } else {
      setSelectedManualPaymentItems(unpaidDebits.map(t => t.id));
    }
  };

  const getSelectedManualPaymentTotal = () => {
    return transactions
      .filter(t => selectedManualPaymentItems.includes(t.id))
      .reduce((sum, t) => sum + Number(t.debit || 0), 0);
  };

  const handleRecordManualPayment = async () => {
    const paymentAmount = manualPaymentAmount 
      ? parseFloat(manualPaymentAmount) 
      : getSelectedManualPaymentTotal();

    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount or select items');
      return;
    }

    setRecordingManualPayment(true);
    try {
      const paymentMethodLabel = manualPaymentMethod === 'cash' 
        ? 'Cash' 
        : manualPaymentMethod === 'bank_transfer' 
          ? 'Bank Transfer' 
          : 'Other';
      
      const description = manualPaymentDescription || `${paymentMethodLabel} Payment`;
      const paymentDate = manualPaymentDate 
        ? new Date(manualPaymentDate).toISOString() 
        : new Date().toISOString();

      // Create the credit transaction for the manual payment
      await addTransaction({
        lead_id: lead.id,
        item: description,
        credit: paymentAmount,
        debit: 0,
        notes: `Manual ${paymentMethodLabel.toLowerCase()} payment recorded`,
        transaction_date: paymentDate,
        is_recurring: false,
        recurring_interval: null,
        recurring_end_date: null,
        parent_transaction_id: null,
        status: 'completed',
        invoice_status: 'paid',
        stripe_invoice_id: null,
        payment_method: manualPaymentMethod as 'cash' | 'bank_transfer' | 'other',
      });

      // Mark selected items as paid if any were selected
      if (selectedManualPaymentItems.length > 0) {
        for (const itemId of selectedManualPaymentItems) {
          const transaction = rawTransactions.find(t => t.id === itemId);
          if (transaction && transaction.invoice_status !== 'paid') {
            await supabase
              .from('transactions')
              .update({ 
                invoice_status: 'paid',
                notes: `${transaction.notes || ''} [Paid via ${paymentMethodLabel.toLowerCase()}]`.trim()
              })
              .eq('id', itemId);
          }
        }
      }

      toast.success(`Manual payment of $${paymentAmount.toLocaleString()} recorded successfully`);
      setManualPaymentOpen(false);
      setManualPaymentAmount('');
      setManualPaymentMethod('cash');
      setManualPaymentDescription('');
      setManualPaymentDate('');
      setSelectedManualPaymentItems([]);
      
      // Refresh transactions
      window.location.reload();
    } catch (error: any) {
      console.error('Error recording manual payment:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setRecordingManualPayment(false);
    }
  };

  const handleAddCredit = async () => {
    const amount = parseFloat(creditAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid credit amount');
      return;
    }

    setAddingCredit(true);
    try {
      const description = creditDescription || 'Account Credit';

      await addTransaction({
        lead_id: lead.id,
        item: description,
        credit: amount,
        debit: 0,
        notes: 'Credit added to account',
        transaction_date: new Date().toISOString(),
        is_recurring: false,
        recurring_interval: null,
        recurring_end_date: null,
        parent_transaction_id: null,
        status: 'completed',
        invoice_status: 'paid',
        stripe_invoice_id: null,
        payment_method: 'credit' as any,
      });

      toast.success(`$${amount.toLocaleString()} credit added to account`);
      setAddCreditOpen(false);
      setCreditAmount('');
      setCreditDescription('');
      
      // Refresh transactions
      window.location.reload();
    } catch (error: any) {
      console.error('Error adding credit:', error);
      toast.error(error.message || 'Failed to add credit');
    } finally {
      setAddingCredit(false);
    }
  };

  const getVoidedBadge = (transaction: TransactionWithBalance) => {
    if (transaction.item.startsWith('VOID:')) {
      return <Badge variant="destructive" className="text-xs">Void Entry</Badge>;
    }
    if (transaction.notes?.includes('[VOIDED:')) {
      return <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">Voided</Badge>;
    }
    return null;
  };

  const getInvoiceStatusBadge = (transaction: TransactionWithBalance) => {
    if (transaction.isFuture) {
      return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Scheduled</Badge>;
    }

    // Check if transaction is voided (either by status or invoice_status)
    if (transaction.status === 'void' || transaction.invoice_status === 'void') {
      return <Badge variant="outline" className="text-destructive border-destructive/30">Void</Badge>;
    }
    
    // For debit transactions (charges), show invoice status
    if (Number(transaction.debit) > 0) {
      switch (transaction.invoice_status) {
        case 'not_sent':
          return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Not Sent</Badge>;
        case 'sent':
          return <Badge variant="outline" className="text-blue-600 border-blue-600/30">Sent</Badge>;
        case 'processing':
          return <Badge variant="outline" className="text-amber-600 border-amber-600/30">Processing</Badge>;
        case 'paid':
          return <Badge variant="default" className="bg-green-600">Paid</Badge>;
        default:
          return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Not Sent</Badge>;
      }
    }
    
    // For credit transactions (payments), show completed
    if (Number(transaction.credit) > 0) {
      return <Badge variant="default" className="bg-green-600">Completed</Badge>;
    }
    
    return null;
  };

  const getRecurringBadge = (transaction: TransactionWithBalance) => {
    if (transaction.is_recurring && !transaction.isFuture) {
      return (
        <Badge variant="secondary" className="text-xs gap-1">
          <RefreshCw className="h-3 w-3" />
          {transaction.recurring_interval}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Deal Value
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input 
                type="number"
                value={dealAmount}
                onChange={(e) => setDealAmount(e.target.value)}
                disabled={!canEdit}
                className="text-2xl font-bold h-auto py-1 border-0 bg-transparent p-0 focus-visible:ring-0"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Total Charged
            </div>
            <p className="text-2xl font-bold">${totalDebit.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingDown className="h-4 w-4" />
              Total Paid
            </div>
            <p className="text-2xl font-bold text-green-600">${totalCredit.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Balance Due
            </div>
            <p className={`text-2xl font-bold ${currentBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              ${currentBalance.toLocaleString()}
            </p>
            {canEdit && currentBalance > 0 && (
              <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full mt-3 bg-foreground text-background hover:bg-foreground/90">
                    <Wallet className="h-4 w-4 mr-2" />
                    Make Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Process Payment</DialogTitle>
                    <DialogDescription>
                      Select items to pay using the saved payment method on file.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    {/* Select Items */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Select Items to Pay</Label>
                        <Button variant="ghost" size="sm" onClick={selectAllPaymentItems}>
                          {selectedPaymentItems.length === getUnpaidDebits().length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      
                      {getUnpaidDebits().length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No unpaid items</p>
                      ) : (
                        <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                          {getUnpaidDebits().map((t) => (
                            <div 
                              key={t.id} 
                              className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                              onClick={() => togglePaymentItemSelection(t.id)}
                            >
                              <Checkbox 
                                checked={selectedPaymentItems.includes(t.id)}
                                onCheckedChange={() => togglePaymentItemSelection(t.id)}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{t.item}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(t.transaction_date), 'PP')}
                                </p>
                              </div>
                              <p className="font-semibold">${Number(t.debit).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payment Summary with Credit Application */}
                    {(() => {
                      const { paymentTotal, availableCredit, creditToApply, netChargeAmount } = getCreditApplication();
                      return (
                        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Selected Items:</span>
                            <span>{selectedPaymentItems.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Charges:</span>
                            <span>${paymentTotal.toLocaleString()}</span>
                          </div>
                          
                          {availableCredit > 0 && paymentTotal > 0 && (
                            <>
                              <div className="flex justify-between text-sm text-primary">
                                <span>Credit Available:</span>
                                <span>-${availableCredit.toLocaleString()}</span>
                              </div>
                              {creditToApply > 0 && (
                                <div className="flex justify-between text-sm font-medium text-primary bg-primary/10 -mx-2 px-2 py-1 rounded">
                                  <span>Credit to Apply:</span>
                                  <span>-${creditToApply.toLocaleString()}</span>
                                </div>
                              )}
                            </>
                          )}
                          
                          <div className="flex justify-between font-semibold text-lg border-t pt-2">
                            <span>{netChargeAmount > 0 ? 'Amount to Charge:' : 'Covered by Credit:'}</span>
                            <span className={netChargeAmount === 0 ? 'text-primary' : ''}>
                              ${netChargeAmount.toLocaleString()}
                            </span>
                          </div>
                          
                          {creditToApply > 0 && netChargeAmount === 0 && (
                            <p className="text-xs text-primary text-center mt-1">
                              ✓ Full amount will be covered by account credit
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Payment Method Info */}
                    {getCreditApplication().netChargeAmount > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Payment Method</p>
                          <p className="text-xs text-muted-foreground">Card or bank account on file (see Card tab)</p>
                        </div>
                      </div>
                    )}
                    
                    {getCreditApplication().netChargeAmount === 0 && getCreditApplication().creditToApply > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/30">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary">Credit Only</p>
                          <p className="text-xs text-muted-foreground">No card charge required - using account credit</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPaymentOpen(false)}>
                      Cancel
                    </Button>
                    {(() => {
                      const { creditToApply, netChargeAmount } = getCreditApplication();
                      const buttonText = netChargeAmount === 0 && creditToApply > 0
                        ? `Apply $${creditToApply.toLocaleString()} Credit`
                        : creditToApply > 0
                          ? `Apply Credit & Charge $${netChargeAmount.toLocaleString()}`
                          : `Charge $${netChargeAmount.toLocaleString()}`;
                      
                      return (
                        <Button 
                          onClick={handleProcessPayment} 
                          disabled={processingPayment || selectedPaymentItems.length === 0}
                          className="bg-foreground text-background hover:bg-foreground/90"
                        >
                          {processingPayment ? 'Processing...' : buttonText}
                        </Button>
                      );
                    })()}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            
            {/* Record Manual Payment Button - only show when there's outstanding balance */}
            {currentBalance > 0 && (
              <Dialog open={manualPaymentOpen} onOpenChange={setManualPaymentOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full mt-2">
                    <Banknote className="h-4 w-4 mr-2" />
                    Manual
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Record Manual Payment</DialogTitle>
                  <DialogDescription>
                    Record a payment received outside of Stripe (cash, bank transfer, etc.)
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={manualPaymentMethod} onValueChange={setManualPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4" />
                            Cash
                          </div>
                        </SelectItem>
                        <SelectItem value="bank_transfer">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Bank Transfer / Direct Deposit
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Other
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Items to Mark as Paid (optional) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Apply to Outstanding Items (optional)</Label>
                      <Button variant="ghost" size="sm" onClick={selectAllManualPaymentItems}>
                        {selectedManualPaymentItems.length === getUnpaidDebits().length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    
                    {getUnpaidDebits().length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2 text-center">No unpaid items</p>
                    ) : (
                      <div className="border rounded-lg divide-y max-h-[150px] overflow-y-auto">
                        {getUnpaidDebits().map((t) => (
                          <div 
                            key={t.id} 
                            className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleManualPaymentItemSelection(t.id)}
                          >
                            <Checkbox 
                              checked={selectedManualPaymentItems.includes(t.id)}
                              onCheckedChange={() => toggleManualPaymentItemSelection(t.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{t.item}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(t.transaction_date), 'PP')}
                              </p>
                            </div>
                            <p className="font-semibold">${Number(t.debit).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="manualAmount">
                      Payment Amount {selectedManualPaymentItems.length > 0 && `(Selected: $${getSelectedManualPaymentTotal().toLocaleString()})`}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        id="manualAmount"
                        type="number"
                        placeholder={selectedManualPaymentItems.length > 0 ? getSelectedManualPaymentTotal().toString() : "0.00"}
                        value={manualPaymentAmount}
                        onChange={(e) => setManualPaymentAmount(e.target.value)}
                        className="pl-7"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use selected items total
                    </p>
                  </div>

                  {/* Payment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="manualDate">Payment Date</Label>
                    <Input 
                      id="manualDate"
                      type="date"
                      value={manualPaymentDate}
                      onChange={(e) => setManualPaymentDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for today
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="manualDescription">Description (optional)</Label>
                    <Input 
                      id="manualDescription"
                      placeholder="e.g., Cash payment for website deposit"
                      value={manualPaymentDescription}
                      onChange={(e) => setManualPaymentDescription(e.target.value)}
                    />
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Payment Method:</span>
                      <span className="font-medium capitalize">{manualPaymentMethod.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Amount:</span>
                      <span className="text-green-600">
                        ${(manualPaymentAmount ? parseFloat(manualPaymentAmount) : getSelectedManualPaymentTotal()).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setManualPaymentOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleRecordManualPayment} 
                    disabled={recordingManualPayment || (!manualPaymentAmount && selectedManualPaymentItems.length === 0)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {recordingManualPayment ? 'Recording...' : 'Record Payment'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            )}

            {/* Add Credit Button - always visible for adding credit */}
            <Dialog open={addCreditOpen} onOpenChange={setAddCreditOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="w-full mt-2 text-green-600 hover:text-green-700 hover:bg-green-50">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Add Credit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Credit to Account</DialogTitle>
                  <DialogDescription>
                    Add credit to this client's account. Credit will be automatically applied to future charges before billing.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Credit Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="creditAmount">Credit Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        id="creditAmount"
                        type="number"
                        placeholder="0.00"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        className="pl-7"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="creditDescription">Description</Label>
                    <Input 
                      id="creditDescription"
                      placeholder="e.g., Goodwill credit, Prepayment, Refund"
                      value={creditDescription}
                      onChange={(e) => setCreditDescription(e.target.value)}
                    />
                  </div>

                  {/* Current Balance Info */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Balance:</span>
                      <span className={currentBalance > 0 ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>
                        ${currentBalance.toLocaleString()}
                      </span>
                    </div>
                    {creditAmount && parseFloat(creditAmount) > 0 && (
                      <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                        <span className="text-muted-foreground">After Credit:</span>
                        <span className={currentBalance - parseFloat(creditAmount) > 0 ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>
                          ${(currentBalance - parseFloat(creditAmount)).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddCreditOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddCredit} 
                    disabled={addingCredit || !creditAmount || parseFloat(creditAmount) <= 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {addingCredit ? 'Adding...' : `Add $${creditAmount || '0'} Credit`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Active Memberships/Subscriptions */}
      <ActiveSubscriptions leadId={lead.id} canEdit={canEdit} />

      {/* Send Invoice Button */}
      {canEdit && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Send Invoice
            </CardTitle>
            <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Send Invoice to Client</DialogTitle>
                  <DialogDescription>
                    Select transactions to include and send an invoice to {lead.email || 'the client'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Client Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">Client</Label>
                      <p className="font-medium">{lead.name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="font-medium">{lead.email || 'No email'}</p>
                    </div>
                    {lead.business_name && (
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Business</Label>
                        <p className="font-medium">{lead.business_name}</p>
                      </div>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date (optional)</Label>
                    <Input 
                      id="dueDate"
                      type="date"
                      value={invoiceDueDate}
                      onChange={(e) => setInvoiceDueDate(e.target.value)}
                    />
                  </div>

                  {/* Select Transactions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Select Charges to Include</Label>
                      <Button variant="ghost" size="sm" onClick={selectAllTransactions}>
                        {selectedTransactions.length === getInvoiceableTransactions().length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    
                    {getInvoiceableTransactions().length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No unpaid charges to invoice</p>
                    ) : (
                      <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                        {getInvoiceableTransactions().map((t) => (
                          <div 
                            key={t.id} 
                            className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleTransactionSelection(t.id)}
                          >
                            <Checkbox 
                              checked={selectedTransactions.includes(t.id)}
                              onCheckedChange={() => toggleTransactionSelection(t.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{t.item}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(t.transaction_date), 'PP')}
                              </p>
                            </div>
                            <p className="font-semibold">${Number(t.debit).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Invoice Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNotes">Notes (optional)</Label>
                    <Textarea 
                      id="invoiceNotes"
                      placeholder="Add any additional notes for the invoice..."
                      value={invoiceNotes}
                      onChange={(e) => setInvoiceNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Summary with Credit Info */}
                  {(() => {
                    const invoiceTotal = getSelectedItems().reduce((sum, i) => sum + i.amount, 0);
                    const availableCredit = getAvailableCredit();
                    const creditToApply = Math.min(availableCredit, invoiceTotal);
                    const netOwed = invoiceTotal - creditToApply;
                    
                    return (
                      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Selected Items:</span>
                          <span>{getSelectedItems().length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Invoice Total:</span>
                          <span className="font-semibold">${invoiceTotal.toLocaleString()}</span>
                        </div>
                        
                        {availableCredit > 0 && invoiceTotal > 0 && (
                          <>
                            <div className="flex justify-between text-sm text-primary border-t pt-2">
                              <span>Account Credit Available:</span>
                              <span>-${availableCredit.toLocaleString()}</span>
                            </div>
                            {creditToApply > 0 && (
                              <div className="flex justify-between text-sm text-primary bg-primary/10 -mx-2 px-2 py-1 rounded">
                                <span>Credit to Apply:</span>
                                <span>-${creditToApply.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold">
                              <span>Net Amount Due:</span>
                              <span className={netOwed === 0 ? 'text-green-600' : 'text-amber-600'}>
                                ${netOwed.toLocaleString()}
                              </span>
                            </div>
                            {netOwed === 0 && (
                              <p className="text-xs text-primary text-center">
                                ✓ Invoice fully covered by account credit
                              </p>
                            )}
                          </>
                        )}
                        
                        {availableCredit === 0 && (
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Current Balance Due:</span>
                            <span className="text-amber-600">${currentBalance.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setInvoiceOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSendInvoice} 
                    disabled={sendingInvoice || getSelectedItems().length === 0 || !lead.email}
                  >
                    {sendingInvoice ? 'Sending...' : 'Send Invoice'}
                    <Send className="h-4 w-4 ml-2" />
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              Create and send professional invoices directly to your client's email address.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Charge Form */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Charge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Add One-Time Product
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProducts.length === 0 ? (
                        <SelectItem value="none" disabled>No active products available</SelectItem>
                      ) : (
                        activeProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center gap-4">
                              <span>{product.name}</span>
                              <span className="text-muted-foreground text-sm">
                                ${product.price.toLocaleString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleAddProduct}
                  disabled={!selectedProduct || selectedProduct === 'none'}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>

            {/* Membership Selection */}
            <div className="space-y-2 pt-4 border-t border-border/40">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Add Recurring Membership
              </Label>
              
              {!lead.stripe_payment_method_id && (
                <p className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  No card on file. Membership charges will accumulate until a payment method is added.
                </p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Select 
                    value={selectedMembership} 
                    onValueChange={setSelectedMembership}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a membership..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeMemberships.length === 0 ? (
                        <SelectItem value="none" disabled>No active memberships available</SelectItem>
                      ) : (
                        activeMemberships.map((membership) => (
                          <SelectItem key={membership.id} value={membership.id}>
                            <div className="flex items-center gap-4">
                              <span>{membership.name}</span>
                              <span className="text-muted-foreground text-sm">
                                ${membership.price.toLocaleString()}/{membership.billing_interval}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Input
                    type="date"
                    value={membershipStartDate}
                    onChange={(e) => setMembershipStartDate(e.target.value)}
                    className="w-full"
                    title="Start date (leave empty for today)"
                  />
                </div>
                
                <Button 
                  onClick={handleAddMembership}
                  disabled={!selectedMembership || selectedMembership === 'none' || creatingSubscription}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  {creatingSubscription ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Optional Notes */}
            {(selectedProduct || selectedMembership) && (
              <div className="space-y-2 pt-4 border-t border-border/40">
                <Label htmlFor="transaction-notes">Notes (optional)</Label>
                <Input
                  id="transaction-notes"
                  placeholder="Add notes for this transaction..."
                  value={transactionNotes}
                  onChange={(e) => setTransactionNotes(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Void Transaction Dialog */}
      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Void Transaction
            </DialogTitle>
            <DialogDescription>
              This will create a reversing entry to nullify this transaction. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="void-reason">Reason for voiding *</Label>
              <Textarea
                id="void-reason"
                placeholder="e.g., Duplicate charge, Customer refund requested, Incorrect amount..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleVoid} 
              disabled={processingVoid || !voidReason.trim()}
            >
              {processingVoid ? 'Voiding...' : 'Void Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions recorded</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  {canEdit && <TableHead className="w-[100px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow 
                    key={t.id} 
                    className={`${t.isFuture ? 'opacity-50' : ''} ${t.item.startsWith('VOID:') ? 'bg-destructive/5' : ''}`}
                  >
                    <TableCell className={t.isFuture ? 'text-muted-foreground' : 'text-foreground'}>
                      <div className="flex items-center gap-2">
                        {t.isFuture && <Calendar className="h-3 w-3" />}
                        {format(new Date(t.transaction_date), 'PP')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className={`${t.isFuture ? 'text-muted-foreground' : t.item.startsWith('VOID:') ? 'font-medium text-destructive' : 'font-medium text-foreground'}`}>
                          {t.item}
                        </p>
                        {t.notes && <p className="text-xs text-muted-foreground">{t.notes}</p>}
                        <div className="flex gap-1 flex-wrap">
                          {getRecurringBadge(t)}
                          {getVoidedBadge(t)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getInvoiceStatusBadge(t)}
                    </TableCell>
                    <TableCell className={`text-right ${t.isFuture ? 'text-muted-foreground' : 'text-green-600 font-medium'}`}>
                      {Number(t.credit) > 0 ? `$${Number(t.credit).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right ${t.isFuture ? 'text-muted-foreground' : 'font-medium'}`}>
                      {Number(t.debit) > 0 ? `$${Number(t.debit).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right ${
                      t.isFuture 
                        ? 'text-muted-foreground' 
                        : t.balance > 0 
                          ? 'text-amber-600 font-bold' 
                          : 'text-green-600 font-bold'
                    }`}>
                      ${t.balance.toLocaleString()}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-1">
                          {t.is_recurring && !t.isFuture && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                              onClick={() => cancelRecurring(t.id)}
                              title="Cancel recurring"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {!t.isFuture && canVoidTransaction(t) && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-amber-600 hover:text-amber-700"
                              onClick={() => handleOpenVoid(t.id)}
                              title="Void transaction"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          {!t.isFuture && canDeleteTransaction(t) && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteTransaction(t.id)}
                              title="Delete transaction"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
