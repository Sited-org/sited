import { useMemo, useState, useEffect } from 'react';
import { type Booking, type CalendarConfig } from '@/hooks/useBookings';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CalendarViewProps {
  viewMode: 'month' | 'week' | 'day';
  currentDate: Date;
  bookings: Booking[];
  config: CalendarConfig;
  onBookingClick: (booking: Booking) => void;
  onDateClick: (date: Date) => void;
  onTimeSlotClick?: (date: string, time: string | null) => void;
}

// Lead status -> color mapping for booking pills
const leadStatusColors: Record<string, string> = {
  warm_lead: 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/10',
  discovery_call_booked: 'bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-orange-500/10',
  new_lead: 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-blue-500/10',
  new_client: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-cyan-500/10',
  mbr_sold_dev: 'bg-green-500/20 text-green-400 border-green-500/40 shadow-green-500/10',
  current_mbr: 'bg-green-600/20 text-green-500 border-green-600/40 shadow-green-600/10',
  ot_sold_dev: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10',
  current_ot: 'bg-emerald-600/20 text-emerald-500 border-emerald-600/40 shadow-emerald-600/10',
  no_show: 'bg-red-500/20 text-red-400 border-red-500/40 shadow-red-500/10',
  lost: 'bg-red-600/20 text-red-500 border-red-600/40 shadow-red-600/10',
};

const fallbackStatusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-primary/20 text-primary border-primary/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-muted text-muted-foreground border-border',
};

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getBookingsForDate(bookings: Booking[], date: Date) {
  const dateStr = toLocalDateStr(date);
  return bookings.filter(b => b.booking_date === dateStr && b.status !== 'cancelled');
}

type LeadStatusMap = Record<string, string>; // email -> status

function useLeadStatuses(bookings: Booking[]): LeadStatusMap {
  const [statusMap, setStatusMap] = useState<LeadStatusMap>({});

  useEffect(() => {
    const emails = [...new Set(bookings.filter(b => b.status !== 'cancelled').map(b => b.email))];
    if (emails.length === 0) return;

    const fetchStatuses = async () => {
      const { data } = await supabase
        .from('leads')
        .select('email, status')
        .in('email', emails);
      if (data) {
        const map: LeadStatusMap = {};
        data.forEach(l => { map[l.email] = l.status; });
        setStatusMap(map);
      }
    };
    fetchStatuses();
  }, [bookings]);

  return statusMap;
}

function getBookingColor(booking: Booking, leadStatusMap: LeadStatusMap): string {
  const leadStatus = leadStatusMap[booking.email];
  if (leadStatus && leadStatusColors[leadStatus]) {
    return leadStatusColors[leadStatus] + ' shadow-sm';
  }
  return fallbackStatusColors[booking.status] || fallbackStatusColors.pending;
}

function BookingTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = { discovery: 'D', plan: 'P', checkin: 'C' };
  const tooltips: Record<string, string> = { discovery: 'Discovery', plan: 'Plan', checkin: 'Check-in' };
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold bg-foreground/10 mr-1 shrink-0" title={tooltips[type] || type}>
      {labels[type] || 'D'}
    </span>
  );
}

function MonthView({ currentDate, bookings, onBookingClick, onDateClick, onTimeSlotClick, leadStatusMap }: Omit<CalendarViewProps, 'viewMode' | 'config'> & { leadStatusMap: LeadStatusMap }) {
  const { weeks } = useMemo(() => {
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

    return { weeks };
  }, [currentDate]);

  const today = new Date();
  const todayStr = toLocalDateStr(today);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/30">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-xs font-medium text-muted-foreground text-center py-2.5 border-b border-border">
            {d}
          </div>
        ))}
      </div>

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
                onDoubleClick={() => onTimeSlotClick?.(dateStr, null)}
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
                        "flex items-center w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded border truncate",
                        getBookingColor(b, leadStatusMap)
                      )}
                    >
                      <BookingTypeLabel type={b.booking_type} />
                      <span className="truncate">{b.booking_time} {b.first_name}</span>
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

function WeekView({ currentDate, bookings, config, onBookingClick, onTimeSlotClick, leadStatusMap }: Omit<CalendarViewProps, 'viewMode' | 'onDateClick'> & { leadStatusMap: LeadStatusMap }) {
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

      {hours.map(hour => (
        <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[60px]">
          <div className="text-xs text-muted-foreground text-right pr-2 pt-1 border-r border-border">
            {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
          </div>
          {weekDays.map(d => {
            const dateStr = toLocalDateStr(d);
            const dayBookings = getBookingsForDate(bookings, d).filter(b => parseTimeToHour(b.booking_time) === hour);
            const timeLabel = `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
            return (
              <div
                key={`${dateStr}-${hour}`}
                className="border-l border-b border-border p-0.5 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => onTimeSlotClick?.(dateStr, timeLabel)}
              >
                {dayBookings.map(b => (
                  <button
                    key={b.id}
                    onClick={(e) => { e.stopPropagation(); onBookingClick(b); }}
                    className={cn(
                      "flex items-center w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded border truncate mb-0.5",
                      getBookingColor(b, leadStatusMap)
                    )}
                  >
                    <BookingTypeLabel type={b.booking_type} />
                    <span className="truncate">{b.booking_time} – {b.first_name} {b.last_name}</span>
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

function DayView({ currentDate, bookings, config, onBookingClick, onTimeSlotClick, leadStatusMap }: Omit<CalendarViewProps, 'viewMode' | 'onDateClick'> & { leadStatusMap: LeadStatusMap }) {
  const dayBookings = getBookingsForDate(bookings, currentDate);
  const dateStr = toLocalDateStr(currentDate);

  const hours = useMemo(() => {
    const startHour = parseInt(config.available_hours_start.split(':')[0]);
    const endHour = parseInt(config.available_hours_end.split(':')[0]);
    return Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  }, [config]);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {hours.map(hour => {
        const hourBookings = dayBookings.filter(b => parseTimeToHour(b.booking_time) === hour);
        const timeLabel = `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
        return (
          <div
            key={hour}
            className="flex min-h-[70px] border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/20 transition-colors"
            onClick={() => onTimeSlotClick?.(dateStr, timeLabel)}
          >
            <div className="w-16 text-xs text-muted-foreground text-right pr-3 pt-2 border-r border-border shrink-0">
              {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
            </div>
            <div className="flex-1 p-1.5 space-y-1">
              {hourBookings.map(b => (
                <button
                  key={b.id}
                  onClick={(e) => { e.stopPropagation(); onBookingClick(b); }}
                  className={cn(
                    "flex items-center w-full text-left text-sm px-3 py-2 rounded-lg border shadow-sm",
                    getBookingColor(b, leadStatusMap)
                  )}
                >
                  <BookingTypeLabel type={b.booking_type} />
                  <span className="font-medium">{b.booking_time}</span>
                  <span className="mx-2">·</span>
                  <span>{b.first_name} {b.last_name}</span>
                  <span className="mx-2">·</span>
                  <span className="text-xs opacity-70">{b.business_name}</span>
                  <span className="mx-2">·</span>
                  <span className="text-xs opacity-50">{b.duration_minutes}min</span>
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
  const leadStatusMap = useLeadStatuses(props.bookings);
  if (props.viewMode === 'week') return <WeekView {...props} leadStatusMap={leadStatusMap} />;
  if (props.viewMode === 'day') return <DayView {...props} leadStatusMap={leadStatusMap} />;
  return <MonthView {...props} leadStatusMap={leadStatusMap} />;
}
