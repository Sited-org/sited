import { useState } from 'react';
import { useAllTransactions, GlobalTransaction, AccountSummary } from '@/hooks/useAllTransactions';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  Search,
  FileText,
  Ban,
  RefreshCw,
  ExternalLink,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

function getStatusBadge(tx: GlobalTransaction) {
  if (tx.status === 'void' || tx.item.startsWith('VOID:')) {
    return <Badge variant="outline" className="bg-muted text-muted-foreground">Void</Badge>;
  }
  if (tx.invoice_status === 'paid') {
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>;
  }
  if (tx.invoice_status === 'sent' || tx.invoice_status === 'processing') {
    return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
  }
  if (Number(tx.credit) > 0) {
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Payment</Badge>;
  }
  if (tx.invoice_status === 'not_sent' || !tx.invoice_status) {
    return <Badge variant="outline">Not Invoiced</Badge>;
  }
  return <Badge variant="outline">{tx.status}</Badge>;
}

export default function AdminFinancial() {
  const { transactions, loading, metrics, accountSummaries, zeroAccount, voidAllOutstanding, refetch } = useAllTransactions();
  const { userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zeroAccountDialog, setZeroAccountDialog] = useState<AccountSummary | null>(null);
  const [voidDialog, setVoidDialog] = useState<AccountSummary | null>(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const isAdmin = userRole?.role === 'owner' || userRole?.role === 'admin';

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.lead?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.lead?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.lead?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'paid') return tx.invoice_status === 'paid';
    if (statusFilter === 'pending') return tx.invoice_status === 'sent' || tx.invoice_status === 'processing';
    if (statusFilter === 'outstanding') return Number(tx.debit) > 0 && tx.invoice_status !== 'paid' && tx.status !== 'void';
    if (statusFilter === 'void') return tx.status === 'void' || tx.item.startsWith('VOID:');
    return true;
  });

  // Filter accounts with outstanding balances
  const outstandingAccounts = accountSummaries.filter(a => a.balance > 0);

  const handleZeroAccount = async () => {
    if (!zeroAccountDialog || !reason.trim()) return;
    setProcessing(true);
    await zeroAccount(zeroAccountDialog.lead_id, reason);
    setProcessing(false);
    setZeroAccountDialog(null);
    setReason('');
  };

  const handleVoidAll = async () => {
    if (!voidDialog || !reason.trim()) return;
    setProcessing(true);
    await voidAllOutstanding(voidDialog.lead_id, reason);
    setProcessing(false);
    setVoidDialog(null);
    setReason('');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-muted-foreground">Track all transactions, invoices, and account balances</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Total Revenue
            </div>
            <p className="text-2xl font-bold text-green-600">${metrics.totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <AlertCircle className="h-4 w-4" />
              Total Outstanding
            </div>
            <p className="text-2xl font-bold text-amber-600">${metrics.totalOutstanding.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="h-4 w-4" />
              Pending Invoices
            </div>
            <p className="text-2xl font-bold">{metrics.pendingInvoices}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <FileText className="h-4 w-4" />
              Total Transactions
            </div>
            <p className="text-2xl font-bold">{metrics.totalTransactions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="outstanding">
            Outstanding Accounts
            {outstandingAccounts.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {outstandingAccounts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accounts">Account Summaries</TabsTrigger>
        </TabsList>

        {/* All Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by item, client, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'paid', 'pending', 'outstanding', 'void'].map(status => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <TableRow key={tx.id} className={tx.status === 'void' ? 'opacity-50' : ''}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(tx.transaction_date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">
                                  {tx.lead?.business_name || tx.lead?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground">{tx.lead?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={tx.item.startsWith('VOID:') ? 'line-through text-muted-foreground' : ''}>
                              {tx.item}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(tx)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(tx.debit) > 0 ? `$${Number(tx.debit).toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-green-600">
                            {Number(tx.credit) > 0 ? `$${Number(tx.credit).toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell>
                            <Link to={`/admin/leads/${tx.lead_id}`}>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outstanding Accounts Tab */}
        <TabsContent value="outstanding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Outstanding Accounts
              </CardTitle>
              <CardDescription>
                Accounts with unpaid balances that require attention
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Total Charged</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                          <p>All accounts are in good standing</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    outstandingAccounts.map((account) => (
                      <TableRow key={account.lead_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Link 
                                to={`/admin/leads/${account.lead_id}`}
                                className="font-medium text-sm hover:underline"
                              >
                                {account.business_name || account.name || 'Unknown'}
                              </Link>
                              <p className="text-xs text-muted-foreground">{account.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${account.totalDebit.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          ${account.totalCredit.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-amber-600">
                          ${account.balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {account.outstandingInvoices > 0 && (
                              <Badge variant="outline" className="text-amber-600">
                                {account.outstandingInvoices} pending
                              </Badge>
                            )}
                            {account.pendingCharges > 0 && (
                              <Badge variant="outline">
                                {account.pendingCharges} not invoiced
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {account.outstandingInvoices > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setVoidDialog(account)}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Void Invoices
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setZeroAccountDialog(account)}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Zero Account
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Summaries Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Account Summaries</CardTitle>
              <CardDescription>
                Complete financial overview for all clients
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Total Charged</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountSummaries.map((account) => (
                    <TableRow key={account.lead_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Link 
                              to={`/admin/leads/${account.lead_id}`}
                              className="font-medium text-sm hover:underline"
                            >
                              {account.business_name || account.name || 'Unknown'}
                            </Link>
                            <p className="text-xs text-muted-foreground">{account.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${account.totalDebit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        ${account.totalCredit.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-bold ${
                        account.balance > 0 ? 'text-amber-600' : 
                        account.balance < 0 ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {account.balance < 0 ? '-' : ''}${Math.abs(account.balance).toLocaleString()}
                        {account.balance < 0 && <span className="text-xs ml-1">(credit)</span>}
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/leads/${account.lead_id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Zero Account Dialog */}
      <Dialog open={!!zeroAccountDialog} onOpenChange={() => setZeroAccountDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zero Account Balance</DialogTitle>
            <DialogDescription>
              This will write off the outstanding balance of ${zeroAccountDialog?.balance.toLocaleString()} for{' '}
              <strong>{zeroAccountDialog?.business_name || zeroAccountDialog?.name}</strong>. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for write-off</label>
              <Textarea
                placeholder="Enter reason for zeroing this account..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZeroAccountDialog(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleZeroAccount}
              disabled={!reason.trim() || processing}
            >
              {processing ? 'Processing...' : 'Zero Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void All Invoices Dialog */}
      <Dialog open={!!voidDialog} onOpenChange={() => setVoidDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void All Outstanding Invoices</DialogTitle>
            <DialogDescription>
              This will void {voidDialog?.outstandingInvoices} outstanding invoice(s) for{' '}
              <strong>{voidDialog?.business_name || voidDialog?.name}</strong>. 
              The charges will remain but invoices will be cancelled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for voiding</label>
              <Textarea
                placeholder="Enter reason for voiding invoices..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidDialog(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleVoidAll}
              disabled={!reason.trim() || processing}
            >
              {processing ? 'Processing...' : 'Void All Invoices'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
