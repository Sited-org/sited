import { type Booking } from '@/hooks/useBookings';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Mail, Phone, Building2, MapPin, ExternalLink, Video } from 'lucide-react';

interface BookingDetailSheetProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (id: string, status: string) => Promise<boolean>;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: 'outline',
  confirmed: 'default',
  cancelled: 'destructive',
  completed: 'secondary',
};

export function BookingDetailSheet({ booking, open, onOpenChange, onUpdateStatus }: BookingDetailSheetProps) {
  if (!booking) return null;

  const handleStatus = async (status: string) => {
    await onUpdateStatus(booking.id, status);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-left">Booking Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
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

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {booking.status === 'pending' && (
              <>
                <Button size="sm" onClick={() => handleStatus('confirmed')}>Confirm</Button>
                <Button size="sm" variant="destructive" onClick={() => handleStatus('cancelled')}>Cancel</Button>
              </>
            )}
            {booking.status === 'confirmed' && (
              <>
                <Button size="sm" onClick={() => handleStatus('completed')}>Mark Complete</Button>
                <Button size="sm" variant="destructive" onClick={() => handleStatus('cancelled')}>Cancel</Button>
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
