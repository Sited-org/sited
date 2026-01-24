import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { RefreshCw, XCircle, AlertTriangle, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Subscription {
  id: string;
  status: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  created: number;
}

interface ActiveSubscriptionsProps {
  leadId: string;
  canEdit: boolean;
}

export function ActiveSubscriptions({ leadId, canEdit }: ActiveSubscriptionsProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [cancelOption, setCancelOption] = useState<'immediate' | 'period_end'>('period_end');
  const [cancelling, setCancelling] = useState(false);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-lead-subscriptions', {
        body: { lead_id: leadId },
      });

      if (error) throw error;

      if (data?.success) {
        setSubscriptions(data.subscriptions || []);
      } else {
        throw new Error(data?.error || 'Failed to fetch subscriptions');
      }
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      // Silent fail - just show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [leadId]);

  const handleCancelClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setCancelOption('period_end');
    setCancelDialogOpen(true);
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscription_id: selectedSubscription.id,
          lead_id: leadId,
          cancel_at_period_end: cancelOption === 'period_end',
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to cancel subscription');
      }

      toast.success(
        cancelOption === 'period_end'
          ? 'Subscription will cancel at end of billing period'
          : 'Subscription cancelled immediately'
      );

      setCancelDialogOpen(false);
      setSelectedSubscription(null);
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (subscription: Subscription) => {
    if (subscription.cancel_at_period_end) {
      return <Badge variant="outline" className="text-amber-600 border-amber-600/30">Cancelling</Badge>;
    }
    switch (subscription.status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">Unpaid</Badge>;
      case 'trialing':
        return <Badge variant="outline" className="text-blue-600 border-blue-600/30">Trial</Badge>;
      default:
        return <Badge variant="outline">{subscription.status}</Badge>;
    }
  };

  const activeSubscriptions = subscriptions.filter(
    s => s.status === 'active' || s.status === 'trialing' || s.status === 'past_due'
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Active Memberships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading subscriptions...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeSubscriptions.length === 0) {
    return null; // Don't show the card if there are no active subscriptions
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Active Memberships
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchSubscriptions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeSubscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{subscription.name}</span>
                    {getStatusBadge(subscription)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">
                      ${subscription.amount.toLocaleString()}/{subscription.interval}
                    </span>
                    {subscription.cancel_at_period_end ? (
                      <span className="ml-2 text-amber-600">
                        • Ends {format(new Date(subscription.current_period_end * 1000), 'PP')}
                      </span>
                    ) : (
                      <span className="ml-2">
                        • Renews {format(new Date(subscription.current_period_end * 1000), 'PP')}
                      </span>
                    )}
                  </div>
                </div>
                {canEdit && !subscription.cancel_at_period_end && subscription.status !== 'canceled' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleCancelClick(subscription)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel{' '}
              <span className="font-medium">{selectedSubscription?.name}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <RadioGroup value={cancelOption} onValueChange={(v) => setCancelOption(v as 'immediate' | 'period_end')}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="period_end" id="period_end" className="mt-1" />
                <Label htmlFor="period_end" className="flex-1 cursor-pointer">
                  <div className="font-medium">Cancel at end of billing period</div>
                  <div className="text-sm text-muted-foreground">
                    Client keeps access until{' '}
                    {selectedSubscription &&
                      format(new Date(selectedSubscription.current_period_end * 1000), 'PP')}
                  </div>
                </Label>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer mt-2">
                <RadioGroupItem value="immediate" id="immediate" className="mt-1" />
                <Label htmlFor="immediate" className="flex-1 cursor-pointer">
                  <div className="font-medium">Cancel immediately</div>
                  <div className="text-sm text-muted-foreground">
                    Subscription ends now. No refund is issued automatically.
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
