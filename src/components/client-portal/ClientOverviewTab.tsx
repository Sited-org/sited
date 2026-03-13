import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  MessageSquarePlus,
  CreditCard,
  ExternalLink,
  ArrowRight,
  FileEdit,
  Send,
  Trash2,
  Loader2,
  CalendarDays,
  Clock,
  Video,
  Phone,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isPast, parseISO } from 'date-fns';

interface Transaction {
  id: string;
  item: string;
  credit: number;
  debit: number;
  transaction_date: string;
  status: string;
}

interface ClientRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface ClientBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  booking_type: string;
  duration_minutes: number;
  status: string;
  zoom_join_url: string | null;
}

interface ClientOverviewTabProps {
  lead: {
    id: string;
    name: string;
    email: string;
    business_name?: string;
    project_type: string;
    status: string;
    created_at: string;
    website_url?: string;
    form_data?: any;
    phone?: string;
  };
  transactions: Transaction[];
  requests: ClientRequest[];
  bookings: ClientBooking[];
  hasPaymentMethod: boolean;
  onNavigate: (tab: string) => void;
  sessionToken?: string;
  leadName?: string;
  onRequestCreated?: () => void;
}

export function ClientOverviewTab({ 
  lead, 
  transactions, 
  requests,
  bookings,
  hasPaymentMethod,
  onNavigate,
  sessionToken,
  leadName,
  onRequestCreated,
}: ClientOverviewTabProps) {
  const [sendingDraftId, setSendingDraftId] = useState<string | null>(null);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [bookCheckinOpen, setBookCheckinOpen] = useState(false);

  const upcomingCalls = (bookings || []).filter(b => !isPast(parseISO(b.booking_date + 'T23:59:59')));
  const getCallLabel = (type: string) => type === 'discovery' ? 'Discovery Call' : type === 'checkin' ? 'Check-in Call' : 'Plan Call';

  const pendingTransactions = transactions.filter(t => t.status === 'pending' && t.debit > 0);
  const totalDue = pendingTransactions.reduce((sum, t) => sum + (t.debit || 0), 0);
  const activeRequests = requests.filter(r => r.status === 'pending' || r.status === 'in_progress');
  const draftRequests = requests.filter(r => r.status === 'draft');
  
  const websiteUrl = lead.website_url;
  const previewUrl = lead.form_data?.preview_url || lead.form_data?.previewUrl;
  const displayUrl = websiteUrl || previewUrl;

  const handleSendDraft = async (requestId: string) => {
    setSendingDraftId(requestId);
    try {
      const { error } = await supabase.functions.invoke('submit-client-request', {
        body: {
          session_token: sessionToken,
          lead_id: lead.id,
          request_id: requestId,
          action: 'send_draft',
          client_name: leadName || lead.name,
          client_email: lead.email,
        },
      });
      if (error) throw error;
      toast.success('Request sent to the Sited team');
      onRequestCreated?.();
    } catch {
      toast.error('Failed to send request');
    } finally {
      setSendingDraftId(null);
    }
  };

  const handleDeleteDraft = async (requestId: string) => {
    setDeletingDraftId(requestId);
    try {
      const { error } = await supabase.functions.invoke('submit-client-request', {
        body: {
          session_token: sessionToken,
          lead_id: lead.id,
          request_id: requestId,
          action: 'delete_draft',
        },
      });
      if (error) throw error;
      toast.success('Draft removed');
      onRequestCreated?.();
    } catch {
      toast.error('Failed to delete draft');
    } finally {
      setDeletingDraftId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div className="pb-2">
        <h1 className="text-xl font-semibold">
          Welcome back{lead.name ? `, ${lead.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">
          Client since {format(new Date(lead.created_at), 'MMMM yyyy')}
        </p>
      </div>

      {/* Website Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Your Website</p>
                <p className="text-xs text-muted-foreground">
                  {displayUrl ? 'Live' : 'In development'}
                </p>
              </div>
            </div>
            {displayUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={displayUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => onNavigate('requests')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">{activeRequests.length}</p>
                <p className="text-xs text-muted-foreground">Active Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => onNavigate('payments')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className={`text-lg font-semibold ${totalDue > 0 ? 'text-orange-600' : ''}`}>
                  ${totalDue.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Balance Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Draft Requests */}
      {draftRequests.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <FileEdit className="h-4 w-4" />
                Draft Requests ({draftRequests.length})
              </p>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('requests')}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {draftRequests.slice(0, 3).map((r) => (
                <div key={r.id} className="p-3 bg-background rounded-lg border">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(r.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-amber-400 text-amber-600 shrink-0">Draft</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-8"
                      disabled={sendingDraftId === r.id || deletingDraftId === r.id}
                      onClick={() => handleSendDraft(r.id)}
                    >
                      {sendingDraftId === r.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                      Send to Sited
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-destructive hover:bg-destructive/10"
                      disabled={sendingDraftId === r.id || deletingDraftId === r.id}
                      onClick={() => handleDeleteDraft(r.id)}
                    >
                      {deletingDraftId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Payments */}
      {pendingTransactions.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Upcoming Payments</p>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('payments')}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {pendingTransactions.slice(0, 2).map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate mr-2">{t.item}</span>
                  <Badge variant="outline" className="shrink-0">
                    ${t.debit.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Active Requests</p>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('requests')}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {activeRequests.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="truncate mr-2">{r.title}</span>
                  <Badge 
                    variant="outline" 
                    className={r.status === 'in_progress' ? 'text-blue-600 border-blue-200' : ''}
                  >
                    {r.status === 'in_progress' ? 'In Progress' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Upcoming Calls (read-only) */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Upcoming Calls
          </p>
          {upcomingCalls.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming calls scheduled.</p>
          ) : (
            <div className="space-y-2">
              {upcomingCalls.map((b) => (
                <div key={b.id} className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {getCallLabel(b.booking_type)}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{b.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {format(parseISO(b.booking_date), 'EEE, MMM d yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {b.booking_time}
                    </span>
                    <span>{b.duration_minutes} min</span>
                  </div>
                  {b.zoom_join_url && (
                    <a href={b.zoom_join_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                      <Video className="h-3 w-3" /> Join Meeting <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
