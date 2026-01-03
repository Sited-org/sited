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
import { Trash2, DollarSign, TrendingUp, TrendingDown, Send, FileText, RefreshCw, Calendar, XCircle, CreditCard, Wallet, Package, Ban } from 'lucide-react';
import { useTransactions, TransactionWithBalance } from '@/hooks/useTransactions';
import { useMemberships } from '@/hooks/useMemberships';
import { useProducts } from '@/hooks/useProducts';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    });

    setSelectedProduct('');
    setTransactionNotes('');
  };

  const handleAddMembership = async () => {
    const membership = activeMemberships.find(m => m.id === selectedMembership);
    if (!membership) return;

    await addTransaction({
      lead_id: lead.id,
      item: membership.name,
      credit: 0,
      debit: membership.price,
      notes: transactionNotes || membership.description || null,
      transaction_date: new Date().toISOString(),
      is_recurring: true,
      recurring_interval: membership.billing_interval,
      recurring_end_date: null,
      parent_transaction_id: null,
      status: 'completed',
      invoice_status: 'not_sent',
      stripe_invoice_id: null,
    });

    setSelectedMembership('');
    setTransactionNotes('');
  };

  const toggleTransactionSelection = (id: string) => {
    setSelectedTransactions(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const selectAllTransactions = () => {
    const completedDebits = transactions.filter(t => Number(t.debit) > 0 && !t.isFuture);
    if (selectedTransactions.length === completedDebits.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(completedDebits.map(t => t.id));
    }
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

  // Payment functions
  const getUnpaidDebits = () => {
    return transactions.filter(t => Number(t.debit) > 0 && !t.isFuture);
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

  const handleProcessPayment = async () => {
    if (selectedPaymentItems.length === 0) {
      toast.error('Please select at least one item to pay');
      return;
    }

    // Check if lead has a saved payment method (card or bank account)
    if (!lead.stripe_payment_method_id) {
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
      
      toast.success(`Payment of $${paymentTotal.toLocaleString()} processed successfully`);
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
    
    // For debit transactions (charges), show invoice status
    if (Number(transaction.debit) > 0) {
      switch (transaction.invoice_status) {
        case 'not_sent':
          return <Badge variant="outline" className="text-slate-500 border-slate-500/30">Not Sent</Badge>;
        case 'sent':
          return <Badge variant="outline" className="text-blue-600 border-blue-600/30">Sent</Badge>;
        case 'processing':
          return <Badge variant="outline" className="text-amber-600 border-amber-600/30">Processing</Badge>;
        case 'paid':
          return <Badge variant="default" className="bg-green-600">Paid</Badge>;
        default:
          return <Badge variant="outline" className="text-slate-500 border-slate-500/30">Not Sent</Badge>;
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

                    {/* Payment Summary */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Selected Items:</span>
                        <span>{selectedPaymentItems.length}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Payment Total:</span>
                        <span>${getSelectedPaymentTotal().toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Payment Method Info */}
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                      <Wallet className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Payment Method</p>
                        <p className="text-xs text-muted-foreground">Card or bank account on file (see Card tab)</p>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPaymentOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleProcessPayment} 
                      disabled={processingPayment || selectedPaymentItems.length === 0}
                      className="bg-foreground text-background hover:bg-foreground/90"
                    >
                      {processingPayment ? 'Processing...' : `Pay $${getSelectedPaymentTotal().toLocaleString()}`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      </div>

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
                        {selectedTransactions.length === transactions.filter(t => Number(t.debit) > 0 && !t.isFuture).length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    
                    {transactions.filter(t => Number(t.debit) > 0 && !t.isFuture).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No charges to invoice</p>
                    ) : (
                      <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                        {transactions.filter(t => Number(t.debit) > 0 && !t.isFuture).map((t) => (
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

                  {/* Summary */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Selected Items:</span>
                      <span>{getSelectedItems().length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Invoice Total:</span>
                      <span className="font-semibold">
                        ${getSelectedItems().reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Current Balance Due:</span>
                      <span className="text-amber-600">${currentBalance.toLocaleString()}</span>
                    </div>
                  </div>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <Select value={selectedMembership} onValueChange={setSelectedMembership}>
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
                
                <Button 
                  onClick={handleAddMembership}
                  disabled={!selectedMembership || selectedMembership === 'none'}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Membership
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
