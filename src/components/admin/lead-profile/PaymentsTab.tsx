import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { format } from 'date-fns';

interface PaymentsTabProps {
  lead: any;
  dealAmount: string;
  setDealAmount: (v: string) => void;
  canEdit: boolean;
}

export function PaymentsTab({ lead, dealAmount, setDealAmount, canEdit }: PaymentsTabProps) {
  const { transactions, loading, totalCredit, totalDebit, currentBalance, addTransaction, deleteTransaction } = useTransactions(lead.id);
  
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('debit');
  const [newItem, setNewItem] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const handleAddTransaction = async () => {
    if (!newItem.trim() || !newAmount) return;
    
    await addTransaction({
      lead_id: lead.id,
      item: newItem.trim(),
      credit: transactionType === 'credit' ? parseFloat(newAmount) : 0,
      debit: transactionType === 'debit' ? parseFloat(newAmount) : 0,
      notes: newNotes || null,
      transaction_date: new Date().toISOString(),
    });

    setNewItem('');
    setNewAmount('');
    setNewNotes('');
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
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction Form */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Select value={transactionType} onValueChange={(v) => setTransactionType(v as 'credit' | 'debit')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Charge (Debit)</SelectItem>
                  <SelectItem value="credit">Payment (Credit)</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Item description"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
              />
              
              <Input
                type="number"
                placeholder="Amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
              />
              
              <Input
                placeholder="Notes (optional)"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
              
              <Button 
                onClick={handleAddTransaction}
                disabled={!newItem.trim() || !newAmount}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  {canEdit && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(t.transaction_date), 'PP')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{t.item}</p>
                        {t.notes && <p className="text-xs text-muted-foreground">{t.notes}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {Number(t.credit) > 0 ? `$${Number(t.credit).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(t.debit) > 0 ? `$${Number(t.debit).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${t.balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      ${t.balance.toLocaleString()}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteTransaction(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
