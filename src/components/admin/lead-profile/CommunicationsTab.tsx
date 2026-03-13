import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle2, XCircle, Clock, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { UpcomingCallsSection } from './UpcomingCallsSection';

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

export function CommunicationsTab({ leadId, leadEmail, lead }: CommunicationsTabProps) {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmails() {
      const { data } = await supabase
        .from('email_logs')
        .select('*')
        .or(`lead_id.eq.${leadId},recipient_email.eq.${leadEmail}`)
        .order('created_at', { ascending: false });

      setEmails((data || []) as EmailLog[]);
      setLoading(false);
    }
    fetchEmails();
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

  if (loading) {
    return <div className="animate-pulse text-muted-foreground p-4">Loading communications...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Upcoming Calls */}
      {lead && <UpcomingCallsSection lead={lead} compact />}

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
