import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePayments } from '@/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  DollarSign, 
  Plus,
  Trash2,
  Save,
  ExternalLink
} from 'lucide-react';
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge';
import { format } from 'date-fns';

type LeadStatus = 'new' | 'contacted' | 'booked_call' | 'sold' | 'lost';

const allStatuses: LeadStatus[] = ['new', 'contacted', 'booked_call', 'sold', 'lost'];
const statusLabels: Record<LeadStatus, string> = {
  new: 'New Lead',
  contacted: 'Contacted',
  booked_call: 'Booked Call',
  sold: 'Sold',
  lost: 'Lost',
};

const projectTypeLabels: Record<string, string> = {
  website: 'Website',
  app: 'App',
  ai: 'AI Integration',
};

export default function LeadProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole } = useAuth();
  const canEdit = userRole?.can_edit_leads ?? false;
  const { payments, totalPaid, addPayment, deletePayment, loading: paymentsLoading } = usePayments(id);

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [notes, setNotes] = useState('');
  const [dealAmount, setDealAmount] = useState('0');

  // New payment form
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [newPaymentNotes, setNewPaymentNotes] = useState('');

  useEffect(() => {
    async function fetchLead() {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        toast({ title: 'Lead not found', variant: 'destructive' });
        navigate('/admin/leads');
        return;
      }

      setLead(data);
      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setBusinessName(data.business_name || '');
      setStatus(data.status as LeadStatus);
      setNotes(data.notes || '');
      setDealAmount(String(data.deal_amount || 0));
      setLoading(false);
    }

    fetchLead();
  }, [id, navigate, toast]);

  const handleSave = async () => {
    if (!id || !canEdit) return;
    setSaving(true);

    const updates: any = {
      name,
      email,
      phone,
      business_name: businessName,
      status,
      notes,
      deal_amount: parseFloat(dealAmount) || 0,
    };

    // Set deal_closed_at when status changes to sold
    if (status === 'sold' && lead.status !== 'sold') {
      updates.deal_closed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Lead updated' });
      setLead({ ...lead, ...updates });
    }
    setSaving(false);
  };

  const handleAddPayment = async () => {
    if (!newPaymentAmount || !id) return;
    
    await addPayment({
      lead_id: id,
      amount: parseFloat(newPaymentAmount),
      payment_date: new Date().toISOString(),
      payment_method: newPaymentMethod || null,
      notes: newPaymentNotes || null,
    });

    setNewPaymentAmount('');
    setNewPaymentMethod('');
    setNewPaymentNotes('');
  };

  if (loading) {
    return (
      <div className="animate-pulse text-muted-foreground p-8">Loading lead...</div>
    );
  }

  if (!lead) return null;

  const balance = (parseFloat(dealAmount) || 0) - totalPaid;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/leads')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Lead #{lead.lead_number}</h1>
            <LeadStatusBadge status={status} />
          </div>
          <p className="text-muted-foreground">
            Created {format(new Date(lead.created_at), 'PPP')}
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    disabled={!canEdit}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      disabled={!canEdit}
                    />
                    <Button variant="outline" size="icon" asChild>
                      <a href={`mailto:${email}`}><Mail className="h-4 w-4" /></a>
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      disabled={!canEdit}
                    />
                    {phone && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={`tel:${phone}`}><Phone className="h-4 w-4" /></a>
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      value={businessName} 
                      onChange={(e) => setBusinessName(e.target.value)} 
                      disabled={!canEdit}
                    />
                    <Building2 className="h-9 w-9 p-2 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project & Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Project Type</label>
                  <div className="mt-1">
                    <Badge variant="secondary" className="text-sm">
                      {projectTypeLabels[lead.project_type] || lead.project_type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)} disabled={!canEdit}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allStatuses.map((s) => (
                        <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Form Responses */}
              {lead.form_data && Object.keys(lead.form_data).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Form Responses</label>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                      {Object.entries(lead.form_data).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-muted-foreground">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!canEdit}
                placeholder="Add notes about this lead..."
                rows={5}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Financials */}
        <div className="space-y-6">
          {/* Deal Amount */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Deal Value
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Deal Amount</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">$</span>
                  <Input 
                    type="number"
                    value={dealAmount}
                    onChange={(e) => setDealAmount(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deal Amount</span>
                  <span>${parseFloat(dealAmount || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="text-green-600">${totalPaid.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Balance</span>
                  <span className={balance > 0 ? 'text-amber-600' : 'text-green-600'}>
                    ${balance.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Payment Form */}
              {canEdit && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                  />
                  <Input
                    placeholder="Payment method (optional)"
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                  />
                  <Input
                    placeholder="Notes (optional)"
                    value={newPaymentNotes}
                    onChange={(e) => setNewPaymentNotes(e.target.value)}
                  />
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={handleAddPayment}
                    disabled={!newPaymentAmount}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </div>
              )}

              {/* Payment List */}
              {paymentsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                    >
                      <div>
                        <p className="font-medium">${Number(payment.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.payment_date), 'PP')}
                          {payment.payment_method && ` • ${payment.payment_method}`}
                        </p>
                      </div>
                      {canEdit && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => deletePayment(payment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(lead.created_at), 'PP')}</span>
              </div>
              {lead.last_contacted_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Contacted</span>
                  <span>{format(new Date(lead.last_contacted_at), 'PP')}</span>
                </div>
              )}
              {lead.deal_closed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deal Closed</span>
                  <span>{format(new Date(lead.deal_closed_at), 'PP')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
