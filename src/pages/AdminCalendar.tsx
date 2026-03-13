import { useState, useMemo } from 'react';
import { useBookings, type Booking } from '@/hooks/useBookings';
import { CalendarView } from '@/components/admin/calendar/CalendarView';
import { CalendarSettings } from '@/components/admin/calendar/CalendarSettings';
import { BookingDetailSheet } from '@/components/admin/calendar/BookingDetailSheet';
import { CalendarBookingDialog } from '@/components/admin/calendar/CalendarBookingDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

type ViewMode = 'month' | 'week' | 'day';

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminCalendar() {
  const { bookings, calendarConfig, loading, updateBookingStatus, updateCalendarConfig, refreshBookings } = useBookings();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | null>(null);
  const [bookingTime, setBookingTime] = useState<string | null>(null);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
    else if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const headerLabel = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'day') {
      return currentDate.toLocaleString('default', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('default', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }, [currentDate, viewMode]);

  const openBookingDialog = (date: string, time: string | null) => {
    setBookingDate(date);
    setBookingTime(time);
    setBookingDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {bookings.filter(b => b.status === 'pending').length} pending bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-2" onClick={() => openBookingDialog(toLocalDateStr(new Date()), null)}>
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="gap-2">
            <Settings2 className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold ml-2">{headerLabel}</span>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="h-8">
            <TabsTrigger value="month" className="text-xs px-3 h-7">Month</TabsTrigger>
            <TabsTrigger value="week" className="text-xs px-3 h-7">Week</TabsTrigger>
            <TabsTrigger value="day" className="text-xs px-3 h-7">Day</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar */}
      <CalendarView
        viewMode={viewMode}
        currentDate={currentDate}
        bookings={bookings}
        config={calendarConfig}
        onBookingClick={setSelectedBooking}
        onDateClick={(d) => {
          setCurrentDate(d);
          setViewMode('day');
        }}
        onTimeSlotClick={openBookingDialog}
      />

      {/* Booking Detail */}
      <BookingDetailSheet
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        onUpdateStatus={updateBookingStatus}
        onRefresh={refreshBookings}
      />

      {/* New Booking Dialog */}
      <CalendarBookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        preselectedDate={bookingDate}
        preselectedTime={bookingTime}
        onBooked={refreshBookings}
      />

      {/* Settings */}
      <CalendarSettings
        config={calendarConfig}
        open={showSettings}
        onOpenChange={setShowSettings}
        onSave={updateCalendarConfig}
      />
    </div>
  );
}
