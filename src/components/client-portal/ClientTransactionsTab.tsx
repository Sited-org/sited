import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, CalendarIcon, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, addWeeks, addMonths, addQuarters, addYears, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

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

interface ClientTransactionsTabProps {
  transactions: Transaction[];
  leadName: string;
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

  return upcoming.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
}

function generatePDFContent(transactions: Transaction[], leadName: string, startDate?: Date, endDate?: Date): string {
  const filteredTransactions = transactions.filter(t => {
    if (!startDate || !endDate) return true;
    const txDate = new Date(t.transaction_date);
    return isWithinInterval(txDate, { start: startOfDay(startDate), end: endOfDay(endDate) });
  });

  const totalDebit = filteredTransactions.reduce((sum, t) => sum + Number(t.debit), 0);
  const totalCredit = filteredTransactions.reduce((sum, t) => sum + Number(t.credit), 0);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment History - ${leadName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { color: #111; margin-bottom: 5px; }
        .subtitle { color: #666; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; font-weight: 600; }
        .debit { color: #dc2626; }
        .credit { color: #16a34a; }
        .summary { margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px; }
        .summary-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .total { font-weight: bold; font-size: 1.1em; border-top: 2px solid #ddd; padding-top: 10px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>Payment History</h1>
      <p class="subtitle">${leadName}${startDate && endDate ? ` • ${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}` : ''}</p>
      
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Charges</th>
            <th>Payments</th>
          </tr>
        </thead>
        <tbody>
  `;

  filteredTransactions.forEach(t => {
    html += `
      <tr>
        <td>${format(new Date(t.transaction_date), 'MMM d, yyyy')}</td>
        <td>${t.item}</td>
        <td class="debit">${t.debit > 0 ? `$${t.debit.toFixed(2)}` : '-'}</td>
        <td class="credit">${t.credit > 0 ? `$${t.credit.toFixed(2)}` : '-'}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
      
      <div class="summary">
        <div class="summary-row">
          <span>Total Charges:</span>
          <span class="debit">$${totalDebit.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Total Payments:</span>
          <span class="credit">$${totalCredit.toFixed(2)}</span>
        </div>
        <div class="summary-row total">
          <span>Balance:</span>
          <span class="${totalDebit - totalCredit > 0 ? 'debit' : 'credit'}">$${Math.abs(totalDebit - totalCredit).toFixed(2)} ${totalDebit - totalCredit > 0 ? 'owing' : 'credit'}</span>
        </div>
      </div>
      
      <p style="margin-top: 40px; color: #999; font-size: 12px;">
        Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}
      </p>
    </body>
    </html>
  `;

  return html;
}

export function ClientTransactionsTab({ transactions, leadName }: ClientTransactionsTabProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const upcomingCharges = useMemo(() => generateUpcomingCharges(transactions), [transactions]);

  const totalDebit = transactions.reduce((sum, t) => sum + Number(t.debit), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + Number(t.credit), 0);
  const currentBalance = totalDebit - totalCredit;

  const handleDownloadPDF = () => {
    const htmlContent = generatePDFContent(transactions, leadName, startDate, endDate);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Charges</p>
                <p className="text-2xl font-bold">${totalDebit.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">${totalCredit.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={currentBalance > 0 ? 'border-red-500/30' : 'border-green-500/30'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", currentBalance > 0 ? "bg-red-500/10" : "bg-green-500/10")}>
                <FileText className={cn("h-5 w-5", currentBalance > 0 ? "text-red-600" : "text-green-600")} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className={cn("text-2xl font-bold", currentBalance > 0 ? "text-red-600" : "text-green-600")}>
                  ${Math.abs(currentBalance).toFixed(2)} {currentBalance > 0 ? 'owing' : 'credit'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Charges */}
      {upcomingCharges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Charges
            </CardTitle>
            <CardDescription>Scheduled payments for the next month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingCharges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{charge.item}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(charge.transaction_date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-600/30">
                    ${charge.debit.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History with PDF Download */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>All past transactions</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {startDate ? format(startDate, 'MMM d') : 'Start'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {endDate ? format(endDate, 'MMM d') : 'End'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={handleDownloadPDF} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
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
                    <TableHead className="text-right">Charges</TableHead>
                    <TableHead className="text-right">Payments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(t.transaction_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {t.item}
                          {t.is_recurring && (
                            <Badge variant="outline" className="text-xs">Recurring</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {t.debit > 0 ? `$${Number(t.debit).toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {t.credit > 0 ? `$${Number(t.credit).toFixed(2)}` : '-'}
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
