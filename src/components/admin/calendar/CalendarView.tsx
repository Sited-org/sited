import { useMemo } from 'react';
import { type Booking, type CalendarConfig } from '@/hooks/useBookings';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  viewMode: 'month' | 'week' | 'day';
  currentDate: Date;
  bookings: Booking[];
  config: CalendarConfig;
  onBookingClick: (booking: Booking) => void;
  onDateClick: (date: Date) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getBookingsForDate(bookings: Booking[], date: Date) {
  const dateStr = toLocalDateStr(date);
  return bookings.filter(b => b.booking_date === dateStr && b.status !== 'cancelled');
}

function MonthView({ currentDate, bookings, onBookingClick, onDateClick }: Omit<CalendarViewProps, 'viewMode' | 'config'>) {
  const { weeks, month, year } = useMemo(() => {
    const m = currentDate.getMonth();
    const y = currentDate.getFullYear();
    const firstDay = new Date(y, m, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = [];

    for (let i = 0; i < startOffset; i++) week.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(new Date(y, m, d));
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    return { weeks, month: m, year: y };
  }, [currentDate]);

  const today = new Date();
  const todayStr = toLocalDateStr(today);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 bg-muted/30">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-xs font-medium text-muted-foreground text-center py-2.5 border-b border-border">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((date, di) => {
            if (!date) return <div key={`e-${di}`} className="min-h-[100px] border-b border-r border-border bg-muted/10" />;
            const dateStr = toLocalDateStr(date);
            const isToday = dateStr === todayStr;
            const dayBookings = getBookingsForDate(bookings, date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <div
                key={dateStr}
                onClick={() => onDateClick(date)}
                className={cn(
                  "min-h-[100px] border-b border-r border-border p-1.5 cursor-pointer hover:bg-muted/30 transition-colors",
                  isWeekend && "bg-muted/10"
                )}
              >
                <span className={cn(
                  "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-1",
                  isToday && "bg-primary text-primary-foreground"
                )}>
                  {date.getDate()}
                </span>
                <div className="space-y-0.5">
                  {dayBookings.slice(0, 3).map(b => (
                    <button
                      key={b.id}
                      onClick={(e) => { e.stopPropagation(); onBookingClick(b); }}
                      className={cn(
                        "block w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded border truncate",
                        statusColors[b.status] || statusColors.pending
                      )}
                    >
                      {b.booking_time} {b.first_name}
                    </button>
                  ))}
                  {dayBookings.length > 3 && (
                    <span className="text-[10px] text-muted-foreground pl-1">+{dayBookings.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function WeekView({ currentDate, bookings, config, onBookingClick }: Omit<CalendarViewProps, 'viewMode' | 'onDateClick'>) {
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const hours = useMemo(() => {
    const startHour = parseInt(config.available_hours_start.split(':')[0]);
    const endHour = parseInt(config.available_hours_end.split(':')[0]);
    return Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  }, [config]);

  const today = new Date();
  const todayStr = toLocalDateStr(today);

  return (
    <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-muted/30 border-b border-border">
        <div />
        {weekDays.map(d => {
          const dateStr = toLocalDateStr(d);
          return (
            <div key={dateStr} className={cn(
              "text-center py-2.5 border-l border-border",
              dateStr === todayStr && "bg-primary/10"
            )}>
              <div className="text-xs text-muted-foreground">{d.toLocaleDateString('default', { weekday: 'short' })}</div>
              <div className={cn(
                "text-sm font-semibold mt-0.5",
                dateStr === todayStr && "text-primary"
              )}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      {hours.map(hour => (
        <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[60px]">
          <div className="text-xs text-muted-foreground text-right pr-2 pt-1 border-r border-border">
            {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
          </div>
          {weekDays.map(d => {
            const dateStr = d.toISOString().split('T')[0];
            const dayBookings = getBookingsForDate(bookings, d).filter(b => {
              const h = parseInt(b.booking_time.split(':')[0]) || 
                (b.booking_time.includes('PM') && !b.booking_time.startsWith('12')
                  ? parseInt(b.booking_time) + 12
                  : b.booking_time.startsWith('12') && b.booking_time.includes('AM') ? 0 : parseInt(b.booking_time));
              // Simple hour-based matching
              const bookingHour = parseTimeToHour(b.booking_time);
              return bookingHour === hour;
            });
            return (
              <div key={`${dateStr}-${hour}`} className="border-l border-b border-border p-0.5">
                {dayBookings.map(b => (
                  <button
                    key={b.id}
                    onClick={() => onBookingClick(b)}
                    className={cn(
                      "block w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded border truncate mb-0.5",
                      statusColors[b.status] || statusColors.pending
                    )}
                  >
                    {b.booking_time} – {b.first_name} {b.last_name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DayView({ currentDate, bookings, config, onBookingClick }: Omit<CalendarViewProps, 'viewMode' | 'onDateClick'>) {
  const dayBookings = getBookingsForDate(bookings, currentDate);

  const hours = useMemo(() => {
    const startHour = parseInt(config.available_hours_start.split(':')[0]);
    const endHour = parseInt(config.available_hours_end.split(':')[0]);
    return Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  }, [config]);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {hours.map(hour => {
        const hourBookings = dayBookings.filter(b => parseTimeToHour(b.booking_time) === hour);
        return (
          <div key={hour} className="flex min-h-[70px] border-b border-border last:border-b-0">
            <div className="w-16 text-xs text-muted-foreground text-right pr-3 pt-2 border-r border-border shrink-0">
              {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
            </div>
            <div className="flex-1 p-1.5 space-y-1">
              {hourBookings.map(b => (
                <button
                  key={b.id}
                  onClick={() => onBookingClick(b)}
                  className={cn(
                    "block w-full text-left text-sm px-3 py-2 rounded-lg border",
                    statusColors[b.status] || statusColors.pending
                  )}
                >
                  <span className="font-medium">{b.booking_time}</span>
                  <span className="mx-2">·</span>
                  <span>{b.first_name} {b.last_name}</span>
                  <span className="mx-2">·</span>
                  <span className="text-xs opacity-70">{b.business_name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function parseTimeToHour(time: string): number {
  const lower = time.toLowerCase().trim();
  const match = lower.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return 0;
  let h = parseInt(match[1]);
  const period = match[3];
  if (period === 'pm' && h !== 12) h += 12;
  if (period === 'am' && h === 12) h = 0;
  return h;
}

export function CalendarView(props: CalendarViewProps) {
  if (props.viewMode === 'week') return <WeekView {...props} />;
  if (props.viewMode === 'day') return <DayView {...props} />;
  return <MonthView {...props} />;
}
