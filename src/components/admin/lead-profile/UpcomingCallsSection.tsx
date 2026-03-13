import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Video, ExternalLink, Plus, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, isPast, parseISO } from 'date-fns';
import { AdminBookCallDialog } from './AdminBookCallDialog';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  booking_type: string;
  duration_minutes: number;
  status: string;
  zoom_join_url: string | null;
  zoom_meeting_url: string | null;
}

interface UpcomingCallsSectionProps {
  lead: any;
  compact?: boolean;
}

export function UpcomingCallsSection({ lead, compact = false }: UpcomingCallsSectionProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!lead.email) return;
    const { data } = await supabase
      .from('bookings')
      .select('id, booking_date, booking_time, booking_type, duration_minutes, status, zoom_join_url, zoom_meeting_url')
      .eq('email', lead.email)
      .neq('status', 'cancelled')
      .order('booking_date', { ascending: true });

    setBookings((data || []) as Booking[]);
    setLoading(false);
  }, [lead.email]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const upcoming = bookings.filter(b => !isPast(parseISO(b.booking_date + 'T23:59:59')));
  const past = bookings.filter(b => isPast(parseISO(b.booking_date + 'T23:59:59')));

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const renderBooking = (booking: Booking) => (
    <div key={booking.id} className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium capitalize flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          {booking.booking_type === 'discovery' ? 'Discovery Call' : booking.booking_type === 'checkin' ? 'Check-in Call' : 'Plan Call'}
        </span>
        <Badge variant={getStatusVariant(booking.status)} className="text-[10px] px-1.5 py-0">
          {booking.status}
        </Badge>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          {format(parseISO(booking.booking_date), 'EEE, MMM d yyyy')}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {booking.booking_time}
        </span>
        <span className="text-muted-foreground/60">{booking.duration_minutes} min</span>
      </div>
      {(booking.zoom_join_url || booking.zoom_meeting_url) && (
        <div className="flex gap-3 mt-2">
          {booking.zoom_meeting_url && (
            <a href={booking.zoom_meeting_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Video className="h-3 w-3" /> Start Meeting <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {booking.zoom_join_url && (
            <a href={booking.zoom_join_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs text-muted-foreground hover:underline">
              <Video className="h-3 w-3" /> Join Link <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );

  if (loading) return null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Upcoming Calls
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setBookDialogOpen(true)} className="text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Book Call
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 && past.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">No calls scheduled for this client.</p>
              <Button variant="default" size="sm" onClick={() => setBookDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Book a Call
              </Button>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="space-y-2">
                  {upcoming.map(renderBooking)}
                </div>
              )}
              {!compact && past.length > 0 && (
                <>
                  {upcoming.length > 0 && <div className="border-t border-border/30 my-3" />}
                  <p className="text-xs font-medium text-muted-foreground mb-2">Past Calls</p>
                  <div className="space-y-2">
                    {past.map(renderBooking)}
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AdminBookCallDialog
        open={bookDialogOpen}
        onOpenChange={setBookDialogOpen}
        lead={lead}
        onBooked={fetchBookings}
      />
    </>
  );
}
