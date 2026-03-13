import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Loader2, Globe, CalendarDays } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DURATION = 30;
const CALL_LABEL = 'Check-in Call';

const AUSTRALIA_TIMEZONES = [
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Australia/Adelaide', label: 'Adelaide (ACST/ACDT)' },
  { value: 'Australia/Hobart', label: 'Hobart (AEST/AEDT)' },
  { value: 'Australia/Darwin', label: 'Darwin (ACST)' },
];

interface ClientBookCheckinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    name?: string;
    email: string;
    phone?: string;
    business_name?: string;
    form_data?: any;
  };
  sessionToken: string;
  onBooked?: () => void;
}

export function ClientBookCheckinDialog({ open, onOpenChange, lead, sessionToken, onBooked }: ClientBookCheckinDialogProps) {
  const [step, setStep] = useState<'calendar' | 'confirm'>('calendar');
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState('Australia/Brisbane');
  const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();
  const daysInMonth = new Date(year, currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = (currentMonth.getDay() + 6) % 7;

  const calendarDates = useMemo(() => {
    const dates: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) dates.push(null);
    for (let i = 1; i <= daysInMonth; i++) dates.push(i);
    return dates;
  }, [firstDayOfWeek, daysInMonth]);

  const isDateAvailable = (date: number) => {
    const d = new Date(year, currentMonth.getMonth(), date);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    if (monthOffset === 0 && date <= today.getDate()) return false;
    return true;
  };

  useEffect(() => {
    if (!selectedDay || step !== 'calendar') return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      const dd = new Date(year, currentMonth.getMonth(), selectedDay);
      const dateStr = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
      try {
        const { data, error } = await supabase.functions.invoke('get-available-slots', {
          body: { date: dateStr, duration_override: DURATION, timezone: selectedTimezone },
        });
        if (!error && data) {
          setTimeSlots(data.slots || []);
          if (!data.available) setTimeSlots([]);
        }
      } catch {
        setTimeSlots([]);
      }
      setLoadingSlots(false);
    };
    fetchSlots();
  }, [selectedDay, year, monthOffset, selectedTimezone, step]);

  const handleSubmit = async () => {
    if (!selectedDay || !selectedTime) return;
    setIsSubmitting(true);

    const bookingDate = new Date(year, currentMonth.getMonth(), selectedDay);
    const dateStr = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}-${String(bookingDate.getDate()).padStart(2, '0')}`;

    const nameParts = (lead.name || '').split(' ');
    const firstName = nameParts[0] || lead.email.split('@')[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    const businessType = lead.form_data?.businessType || lead.form_data?.business_type || 'Other';
    const businessLocation = lead.form_data?.businessLocation || lead.form_data?.business_location || 'Australia';

    // Use the submit-booking edge function (service role, no auth needed)
    try {
      // First get a captcha token
      const { data: captchaData } = await supabase.functions.invoke('generate-captcha');
      if (!captchaData?.token || captchaData?.answer === undefined) {
        toast.error('Failed to verify. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const { data: bookingResult, error: bookingError } = await supabase.functions.invoke('submit-booking', {
        body: {
          captcha_token: captchaData.token,
          captcha_answer: captchaData.answer,
          booking: {
            first_name: firstName,
            last_name: lastName,
            email: lead.email,
            phone: lead.phone || '',
            business_name: lead.business_name || '',
            business_type: businessType,
            business_location: businessLocation,
            booking_date: dateStr,
            booking_time: selectedTime,
            booking_type: 'checkin',
            duration_minutes: DURATION,
            notes: 'Booked from client portal',
          },
        },
      });

      if (bookingError || bookingResult?.error) {
        toast.error(bookingResult?.error || 'Failed to create booking');
        setIsSubmitting(false);
        return;
      }

      // Create Zoom meeting
      const [timePart, ampm] = selectedTime.split(' ');
      const [hStr, mStr] = timePart.split(':');
      let hours = parseInt(hStr);
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const startDate = new Date(year, currentMonth.getMonth(), selectedDay, hours, parseInt(mStr));

      await supabase.functions.invoke('create-zoom-meeting', {
        body: {
          booking_id: bookingResult.booking_id,
          topic: `Check-in Call – ${lead.business_name || lead.name || lead.email}`,
          start_time: startDate.toISOString(),
          duration: DURATION,
          attendee_email: lead.email,
          attendee_name: lead.name || firstName,
          booking_type: 'checkin',
          business_name: lead.business_name || '',
          attendee_phone: lead.phone || '',
          attendee_timezone: selectedTimezone,
          create_lead: false,
          business_type: businessType,
          business_location: businessLocation,
        },
      });

      toast.success(`Check-in Call booked for ${dateStr} at ${selectedTime}`);
      setIsBooked(true);
      onBooked?.();
    } catch {
      toast.error('Failed to create booking');
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('calendar');
      setSelectedDay(null);
      setSelectedTime(null);
      setIsBooked(false);
      setMonthOffset(0);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[92vw] sm:max-w-lg p-0 gap-0 border-border/50 bg-card overflow-hidden max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogTitle className="sr-only">Book a Check-in Call</DialogTitle>

        <AnimatePresence mode="wait">
          {isBooked ? (
            <motion.div key="booked" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 px-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </motion.div>
              <p className="text-lg font-semibold text-green-500 mb-1">Booked!</p>
              <p className="text-sm text-muted-foreground text-center">
                {CALL_LABEL} · {monthName} {selectedDay}, {year} at {selectedTime} · {DURATION} min
              </p>
              <Button variant="outline" className="mt-6" onClick={handleClose}>Close</Button>
            </motion.div>

          ) : step === 'calendar' ? (
            <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Book a Check-in Call</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5">{DURATION}-minute call · Pick a date and time</p>

              {/* Timezone */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe size={14} className="text-muted-foreground" />
                  <Label className="text-xs text-muted-foreground">Timezone</Label>
                </div>
                <Select value={selectedTimezone} onValueChange={(v) => { setSelectedTimezone(v); setSelectedTime(null); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {AUSTRALIA_TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Nav */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => monthOffset > 0 && setMonthOffset(m => m - 1)} className="p-2 rounded-full hover:bg-muted/50 disabled:opacity-30" disabled={monthOffset === 0}>
                  <ChevronLeft size={18} className="text-muted-foreground" />
                </button>
                <span className="text-sm font-semibold">{monthName} {year}</span>
                <button onClick={() => monthOffset < 2 && setMonthOffset(m => m + 1)} className="p-2 rounded-full hover:bg-muted/50 disabled:opacity-30" disabled={monthOffset >= 2}>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                ))}
              </div>

              {/* Calendar */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDates.map((date, i) => {
                  if (date === null) return <div key={`e-${i}`} />;
                  const available = isDateAvailable(date);
                  const isSelected = date === selectedDay;
                  return (
                    <button
                      key={date}
                      onClick={() => { if (available) { setSelectedDay(date); setSelectedTime(null); } }}
                      disabled={!available}
                      className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${!available ? 'text-muted-foreground/30 cursor-not-allowed' : 'cursor-pointer hover:bg-muted'} ${isSelected ? 'bg-foreground text-background' : ''}`}
                    >
                      {date}
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              <AnimatePresence>
                {selectedDay && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="pt-4 mt-4 border-t border-border/50">
                      <p className="text-sm text-muted-foreground mb-3">Available times ({DURATION} min)</p>
                      {loadingSlots ? (
                        <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                      ) : timeSlots.filter(s => s.available).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No available times</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.filter(s => s.available).map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => { setSelectedTime(slot.time); setStep('confirm'); }}
                              className="py-2.5 px-3 rounded-lg border border-border/50 text-sm font-medium transition-colors hover:border-foreground/20 hover:bg-muted/50"
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          ) : (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 sm:p-8">
              <button onClick={() => setStep('calendar')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ChevronLeft size={16} /> Back
              </button>
              <h3 className="text-lg font-semibold mb-4">Confirm Booking</h3>

              <div className="space-y-3 rounded-xl border border-border/50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{CALL_LABEL}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{monthName} {selectedDay}, {year}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{DURATION} min</span>
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-6" size="lg">
                {isSubmitting ? 'Booking...' : 'Confirm & Book'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
