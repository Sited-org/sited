import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Video, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  booking_type: string;
  duration_minutes: number;
  status: string;
  zoom_join_url: string | null;
}

interface BookingCardProps {
  leadEmail: string;
}

export function BookingCard({ leadEmail }: BookingCardProps) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      const { data } = await supabase
        .from('bookings')
        .select('id, booking_date, booking_time, booking_type, duration_minutes, status, zoom_join_url')
        .eq('email', leadEmail)
        .order('booking_date', { ascending: false })
        .limit(5);

      setBookings((data || []) as Booking[]);
      setLoading(false);
    }
    if (leadEmail) fetchBookings();
  }, [leadEmail]);

  if (loading) return null;
  if (bookings.length === 0) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'completed': return 'outline';
      default: return 'secondary' as const;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Bookings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => navigate('/admin/calendar')}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium capitalize">
                {booking.booking_type === 'discovery' ? 'Discovery Call' : 'Plan Call'}
              </span>
              <Badge variant={getStatusColor(booking.status) as any} className="text-[10px] px-1.5 py-0">
                {booking.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {format(new Date(booking.booking_date), 'PP')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {booking.booking_time} ({booking.duration_minutes}min)
              </span>
            </div>
            {booking.zoom_join_url && (
              <a
                href={booking.zoom_join_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-primary hover:underline mt-1.5"
              >
                <Video className="h-3 w-3" />
                Join Zoom
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => navigate('/admin/calendar')}
        >
          View in Calendar
        </Button>
      </CardContent>
    </Card>
  );
}
