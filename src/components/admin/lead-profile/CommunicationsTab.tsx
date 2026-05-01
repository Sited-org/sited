import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, XCircle, Clock, Send, MessageSquare, Download, FileText, Image, Paperclip, Receipt, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { UpcomingCallsSection } from './UpcomingCallsSection';
import { toast } from 'sonner';

interface EmailLog {
  id: string;
  template_type: string;
  subject: string;
  recipient_email: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  error_message: string | null;
}

interface TeamRequest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  action_type: string | null;
  requires_client_action: boolean | null;
  client_response: string | null;
  created_at: string;
  completed_at: string | null;
}

interface RequestAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  content_type: string | null;
  uploaded_by: string;
}

interface InvoiceRecord {
  id: string;
  item: string;
  debit: number;
  transaction_date: string;
  invoice_status: string | null;
  stripe_invoice_id: string;
  notes: string | null;
}

interface CommunicationsTabProps {
  leadId: string;
  leadEmail: string;
  lead?: any;
}

const templateLabels: Record<string, string> = {
  lead_notification: 'Lead Notification',
  payment_receipt: 'Payment Receipt',
  onboarding: 'Onboarding',
  milestone: 'Milestone Update',
  invoice: 'Invoice',
  client_credentials: 'Client Credentials',
  monthly_report: 'Monthly Report',
  booking_confirmation: 'Booking Confirmation',
  booking_reschedule: 'Booking Reschedule',
  booking_cancellation: 'Booking Cancellation',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export function CommunicationsTab({ leadId, leadEmail, lead }: CommunicationsTabProps) {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [teamRequests, setTeamRequests] = useState<TeamRequest[]>([]);
  const [requestAttachments, setRequestAttachments] = useState<Record<string, RequestAttachment[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [emailsRes, requestsRes, invoicesRes] = await Promise.all([
        supabase
          .from('email_logs')
          .select('*')
          .or(`lead_id.eq.${leadId},recipient_email.eq.${leadEmail}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('client_requests')
          .select('*')
          .eq('lead_id', leadId)
          .eq('request_source', 'admin')
          .order('created_at', { ascending: false }),
        supabase
          .from('transactions')
          .select('id, item, debit, transaction_date, invoice_status, stripe_invoice_id, notes')
          .eq('lead_id', leadId)
          .not('stripe_invoice_id', 'is', null)
          .not('item', 'ilike', 'Credit Applied%')
          .not('item', 'ilike', 'VOID:%')
          .order('transaction_date', { ascending: false }),
      ]);

      setEmails((emailsRes.data || []) as EmailLog[]);
      
      // Deduplicate invoices by stripe_invoice_id (keep first/most recent)
      const seenInvoiceIds = new Set<string>();
      const uniqueInvoices = ((invoicesRes.data || []) as InvoiceRecord[]).filter(inv => {
        if (seenInvoiceIds.has(inv.stripe_invoice_id)) return false;
        seenInvoiceIds.add(inv.stripe_invoice_id);
        return true;
      });
      setInvoices(uniqueInvoices);
      const reqs = (requestsRes.data || []) as TeamRequest[];
      setTeamRequests(reqs);

      // Fetch attachments for all team requests
      if (reqs.length > 0) {
        const { data: attachData } = await supabase
          .from('request_attachments')
          .select('*')
          .in('request_id', reqs.map(r => r.id));

        if (attachData) {
          const grouped: Record<string, RequestAttachment[]> = {};
          (attachData as RequestAttachment[]).forEach(a => {
            const rid = (a as any).request_id;
            if (!grouped[rid]) grouped[rid] = [];
            grouped[rid].push(a);
          });
          setRequestAttachments(grouped);
        }
      }

      setLoading(false);
    }
    fetchData();
  }, [leadId, leadEmail]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <Send className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'sent': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleDownload = async (att: RequestAttachment) => {
    try {
      const { data, error } = await supabase.storage.from('request-attachments').download(att.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error('Download failed: ' + e.message);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return <div className="animate-pulse text-muted-foreground p-4">Loading communications...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Upcoming Calls */}
      {lead && <UpcomingCallsSection lead={lead} compact />}

      {/* Team Requests Sent to Client */}
      {teamRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Requests Sent to Client
              <Badge variant="secondary" className="ml-auto">{teamRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamRequests.map((req) => {
                const atts = requestAttachments[req.id] || [];
                const clientAtts = atts.filter(a => a.uploaded_by === 'client');
                return (
                  <div key={req.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{req.title}</h4>
                          <Badge variant="outline" className={statusColors[req.status] || ''}>
                            {req.status === 'in_progress' ? 'Awaiting Client' : req.status.replace('_', ' ')}
                          </Badge>
                          {req.action_type && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {req.action_type.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        {req.description && (
                          <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Sent {format(new Date(req.created_at), 'MMM d, yyyy')}
                          {req.completed_at && (
                            <span className="text-green-600 ml-2">
                              · Completed {format(new Date(req.completed_at), 'MMM d, yyyy')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Client Response */}
                    {req.client_response && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Client Response:</p>
                        <p className="text-sm whitespace-pre-wrap">{req.client_response}</p>
                      </div>
                    )}

                    {/* Client Uploaded Files */}
                    {clientAtts.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          Client Uploads ({clientAtts.length})
                        </p>
                        <div className="space-y-1">
                          {clientAtts.map(att => (
                            <div key={att.id} className="flex items-center justify-between p-2 bg-muted/50 rounded border">
                              <div className="flex items-center gap-2 min-w-0">
                                {att.content_type?.startsWith('image/') ? (
                                  <Image className="h-4 w-4 text-muted-foreground shrink-0" />
                                ) : (
                                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <span className="text-sm truncate">{att.file_name}</span>
                                <span className="text-xs text-muted-foreground">{formatSize(att.file_size)}</span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleDownload(att)}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoices
              <Badge variant="secondary" className="ml-auto">{invoices.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.map((inv) => {
                const statusColor = inv.invoice_status === 'paid'
                  ? 'bg-green-500/10 text-green-600 border-green-500/20'
                  : inv.invoice_status === 'void'
                    ? 'bg-red-500/10 text-red-600 border-red-500/20'
                    : inv.invoice_status === 'sent' || inv.invoice_status === 'processing'
                      ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';

                return (
                  <div key={`${inv.stripe_invoice_id}-${inv.id}`} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="mt-0.5">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{inv.item}</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor}`}>
                          {inv.invoice_status || 'unknown'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>${Number(inv.debit || 0).toFixed(2)}</span>
                        <span>•</span>
                        <span>{inv.stripe_invoice_id}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(inv.transaction_date), 'PPp')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No emails have been sent to this client yet.</p>
          ) : (
            <div className="space-y-3">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="mt-0.5">{getStatusIcon(email.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{email.subject}</p>
                      <Badge variant={getStatusVariant(email.status)} className="text-[10px] px-1.5 py-0">
                        {email.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{templateLabels[email.template_type] || email.template_type}</span>
                      <span>•</span>
                      <span>{email.recipient_email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(email.sent_at || email.created_at), 'PPp')}
                    </p>
                    {email.error_message && (
                      <p className="text-xs text-destructive mt-1">{email.error_message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
