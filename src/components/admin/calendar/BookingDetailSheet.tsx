import { useState, useEffect } from 'react';
import { type Booking } from '@/hooks/useBookings';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Mail, Phone, Building2, MapPin, ExternalLink, Video, CalendarX, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BookingDetailSheetProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (id: string, status: string) => Promise<boolean>;
  onRefresh?: () => void;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: 'outline',
  confirmed: 'default',
  cancelled: 'destructive',
  completed: 'secondary',
};

export function BookingDetailSheet({ booking, open, onOpenChange, onUpdateStatus, onRefresh }: BookingDetailSheetProps) {
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [processing, setProcessing] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch available slots when date changes in reschedule mode
  useEffect(() => {
    if (!rescheduleMode || !newDate || !booking) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setNewTime('');
      try {
        const { data, error } = await supabase.functions.invoke('get-available-slots', {
          body: { date: newDate, duration_override: booking.duration_minutes || 20, timezone: 'Australia/Brisbane' },
        });
        if (!error && data) {
          // Filter to only available slots, and also allow the booking's current slot if same date
          const slots = (data.slots || []).map((s: { time: string; available: boolean }) => ({
            ...s,
            available: s.available || (newDate === booking.booking_date && s.time === booking.booking_time),
          }));
          setAvailableSlots(slots);
        }
      } catch {
        setAvailableSlots([]);
      }
      setLoadingSlots(false);
    };
    fetchSlots();
  }, [newDate, rescheduleMode, booking]);

  if (!booking) return null;

  const handleStatus = async (status: string) => {
    await onUpdateStatus(booking.id, status);
    onOpenChange(false);
  };

  const handleCancel = async () => {
    setProcessing(true);
    try {
      if (booking.zoom_meeting_id) {
        await supabase.functions.invoke('manage-booking', {
          body: { action: 'cancel', booking_id: booking.id, zoom_meeting_id: booking.zoom_meeting_id },
        });
      }
      await onUpdateStatus(booking.id, 'cancelled');
      toast.success('Booking cancelled and client notified');
      onOpenChange(false);
      onRefresh?.();
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      toast.error('Please select a new date and time');
      return;
    }
    setProcessing(true);
    try {
      // Convert AM/PM time to 24h for the start_time string
      const [timePart, ampm] = newTime.split(' ');
      const [hStr, mStr] = timePart.split(':');
      let hours = parseInt(hStr);
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const startTime = `${newDate}T${String(hours).padStart(2, '0')}:${mStr.padStart(2, '0')}:00`;

      const { data, error } = await supabase.functions.invoke('manage-booking', {
        body: {
          action: 'reschedule',
          booking_id: booking.id,
          zoom_meeting_id: booking.zoom_meeting_id || null,
          new_date: newDate,
          new_time: newTime,
          new_start_time: startTime,
          duration: booking.duration_minutes || 20,
          attendee_email: booking.email,
          attendee_name: `${booking.first_name} ${booking.last_name}`,
          booking_type: booking.booking_type,
        },
      });
      if (error) throw error;
      // Check for 409 conflict returned as JSON error
      if (data?.error) {
        toast.error(data.error);
        setProcessing(false);
        return;
      }
      toast.success('Booking rescheduled and client notified');
      setRescheduleMode(false);
      onOpenChange(false);
      onRefresh?.();
    } catch (err) {
      console.error(err);
      toast.error('Failed to reschedule booking');
    } finally {
      setProcessing(false);
    }
  };

  const availableOnly = availableSlots.filter(s => s.available);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) setRescheduleMode(false); onOpenChange(o); }}>
      <SheetContent className="sm:max-w-md flex flex-col h-full overflow-hidden">
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-left">Booking Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto flex-1 pr-1 pb-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[booking.status] || 'outline'} className="capitalize">
              {booking.status}
            </Badge>
            {booking.google_calendar_event_id && (
              <Badge variant="outline" className="gap-1 text-xs">
                <ExternalLink className="h-3 w-3" />
                Synced
              </Badge>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{booking.booking_time}</span>
            </div>
          </div>

          <Separator />

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Contact</h4>
            <p className="text-sm font-semibold">{booking.first_name} {booking.last_name}</p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <a href={`mailto:${booking.email}`} className="hover:text-foreground transition-colors">{booking.email}</a>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <a href={`tel:${booking.phone}`} className="hover:text-foreground transition-colors">{booking.phone}</a>
            </div>
          </div>

          <Separator />

          {/* Business */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Business</h4>
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{booking.business_name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="ml-7">{booking.business_type}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{booking.business_location}</span>
            </div>
          </div>

          {/* Zoom Meeting */}
          {booking.zoom_join_url && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Zoom Meeting</h4>
                <a
                  href={booking.zoom_meeting_url || booking.zoom_join_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Video className="h-4 w-4" />
                  Start Meeting (Host)
                </a>
                <p className="text-xs text-muted-foreground">
                  Join URL: <a href={booking.zoom_join_url} target="_blank" rel="noopener noreferrer" className="hover:underline">{booking.zoom_join_url}</a>
                </p>
              </div>
            </>
          )}

          {booking.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notes</h4>
                <p className="text-sm text-muted-foreground">{booking.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Reschedule form */}
          {rescheduleMode && (
            <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
              <h4 className="text-sm font-medium">Reschedule to:</h4>
              <div>
                <Label className="text-xs">New Date</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>

              {newDate && (
                <div>
                  <Label className="text-xs mb-1.5 block">Available Times</Label>
                  {loadingSlots ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                  ) : availableOnly.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No available times on this date</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto">
                      {availableOnly.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => setNewTime(slot.time)}
                          className={`py-1.5 px-2 rounded-md border text-xs font-medium transition-colors ${
                            newTime === slot.time
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border/50 hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" onClick={handleReschedule} disabled={processing || !newTime}>
                  {processing ? 'Rescheduling...' : 'Confirm Reschedule'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRescheduleMode(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {(booking.status === 'pending' || booking.status === 'confirmed') && !rescheduleMode && (
              <>
                {booking.status === 'pending' && (
                  <Button size="sm" onClick={() => handleStatus('confirmed')}>Confirm</Button>
                )}
                {booking.status === 'confirmed' && (
                  <Button size="sm" onClick={() => handleStatus('completed')}>Mark Complete</Button>
                )}
                <Button size="sm" variant="outline" className="gap-1" onClick={() => { setRescheduleMode(true); setNewDate(booking.booking_date); }}>
                  <RefreshCw className="h-3 w-3" />
                  Reschedule
                </Button>
                <Button size="sm" variant="destructive" className="gap-1" onClick={handleCancel} disabled={processing}>
                  <CalendarX className="h-3 w-3" />
                  {processing ? 'Cancelling...' : 'Cancel Booking'}
                </Button>
              </>
            )}
            {(booking.status === 'cancelled' || booking.status === 'completed') && (
              <Button size="sm" variant="outline" onClick={() => handleStatus('pending')}>Re-open</Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
