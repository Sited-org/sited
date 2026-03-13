import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Search, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CalendarBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedDate: string | null; // YYYY-MM-DD
  preselectedTime: string | null; // e.g. "9:00 AM"
  onBooked?: () => void;
}

interface LeadOption {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  business_name: string | null;
  status: string;
  form_data: Record<string, unknown>;
}

const CALL_TYPES = [
  { type: 'discovery' as const, label: 'Discovery Call', desc: '20 min · Initial consultation', duration: 20 },
  { type: 'plan' as const, label: 'Plan Call', desc: '45 min · Detailed project planning', duration: 45 },
  { type: 'checkin' as const, label: 'Check-in Call', desc: '30 min · Progress check-in', duration: 30 },
];

export function CalendarBookingDialog({ open, onOpenChange, preselectedDate, preselectedTime, onBooked }: CalendarBookingDialogProps) {
  const [step, setStep] = useState<'type' | 'lead' | 'time' | 'confirm'>('type');
  const [callType, setCallType] = useState<'discovery' | 'plan' | 'checkin'>('discovery');
  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(preselectedTime);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const duration = CALL_TYPES.find(c => c.type === callType)?.duration || 20;
  const callLabel = CALL_TYPES.find(c => c.type === callType)?.label || 'Call';

  // Fetch leads
  useEffect(() => {
    if (!open) return;
    const fetchLeads = async () => {
      setLoadingLeads(true);
      const { data } = await supabase
        .from('leads')
        .select('id, name, email, phone, business_name, status, form_data')
        .order('created_at', { ascending: false });
      setLeads((data || []) as LeadOption[]);
      setLoadingLeads(false);
    };
    fetchLeads();
  }, [open]);

  // Fetch time slots when we have a date and call type
  useEffect(() => {
    if (!preselectedDate || step !== 'time') return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-available-slots', {
          body: { date: preselectedDate, duration_override: duration, timezone: 'Australia/Brisbane' },
        });
        if (!error && data) setTimeSlots(data.slots || []);
      } catch { setTimeSlots([]); }
      setLoadingSlots(false);
    };
    fetchSlots();
  }, [preselectedDate, duration, step]);

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(l =>
      (l.name || '').toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      (l.business_name || '').toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  const handleSubmit = async () => {
    if (!selectedLead || !selectedTime || !preselectedDate) return;
    setIsSubmitting(true);

    const nameParts = (selectedLead.name || '').split(' ');
    const firstName = nameParts[0] || selectedLead.email.split('@')[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    const businessType = (selectedLead.form_data?.businessType || selectedLead.form_data?.business_type || 'Other') as string;
    const businessLocation = (selectedLead.form_data?.businessLocation || selectedLead.form_data?.business_location || 'Australia') as string;

    // Double-booking check
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_date', preselectedDate)
      .eq('booking_time', selectedTime)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (existing) {
      toast.error('This time slot is already booked. Please choose another time.');
      setIsSubmitting(false);
      return;
    }

    const { data: insertData, error } = await supabase.from('bookings').insert({
      first_name: firstName,
      last_name: lastName,
      email: selectedLead.email,
      phone: selectedLead.phone || '',
      business_name: selectedLead.business_name || '',
      business_type: businessType,
      business_location: businessLocation,
      booking_date: preselectedDate,
      booking_time: selectedTime,
      booking_type: callType,
      duration_minutes: duration,
      status: 'confirmed',
    }).select('id').single();

    if (error) {
      toast.error('Failed to create booking');
      setIsSubmitting(false);
      return;
    }

    // Create Zoom meeting + send notifications
    try {
      const [timePart, ampm] = selectedTime.split(' ');
      const [hStr, mStr] = timePart.split(':');
      let hours = parseInt(hStr);
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const [yr, mo, dy] = preselectedDate.split('-').map(Number);
      const startDate = new Date(yr, mo - 1, dy, hours, parseInt(mStr));

      await supabase.functions.invoke('create-zoom-meeting', {
        body: {
          booking_id: insertData.id,
          topic: `${callLabel} – ${selectedLead.business_name || selectedLead.name || selectedLead.email}`,
          start_time: startDate.toISOString(),
          duration,
          attendee_email: selectedLead.email,
          attendee_name: selectedLead.name || firstName,
          booking_type: callType,
          business_name: selectedLead.business_name || '',
          attendee_phone: selectedLead.phone || '',
          attendee_timezone: 'Australia/Brisbane',
          create_lead: false,
          business_type: businessType,
          business_location: businessLocation,
        },
      });
    } catch (e) {
      console.error('Zoom meeting creation failed:', e);
    }

    toast.success(`${callLabel} booked for ${preselectedDate} at ${selectedTime}`);
    setIsSubmitting(false);
    setIsBooked(true);
    onBooked?.();
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('type');
      setSelectedLead(null);
      setSelectedTime(preselectedTime);
      setIsBooked(false);
      setCallType('discovery');
      setSearchQuery('');
    }, 300);
  };

  const formattedDate = preselectedDate
    ? new Date(preselectedDate + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[92vw] sm:max-w-lg p-0 gap-0 border-border/50 bg-card overflow-hidden max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogTitle className="sr-only">Book a Call</DialogTitle>

        <AnimatePresence mode="wait">
          {isBooked ? (
            <motion.div key="booked" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 px-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </motion.div>
              <p className="text-lg font-semibold text-green-500 mb-1">Booked</p>
              <p className="text-sm text-muted-foreground text-center">
                {callLabel} · {formattedDate} at {selectedTime} · {duration} min
              </p>
              <p className="text-sm text-muted-foreground mt-1">for {selectedLead?.name || selectedLead?.email}</p>
              <Button variant="outline" className="mt-6" onClick={handleClose}>Close</Button>
            </motion.div>

          ) : step === 'type' ? (
            <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 sm:p-8">
              <h3 className="text-lg font-semibold mb-1">New Booking</h3>
              <p className="text-sm text-muted-foreground mb-6">{formattedDate}{preselectedTime ? ` at ${preselectedTime}` : ''}</p>
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Meeting Type</p>
              <div className="space-y-3">
                {CALL_TYPES.map(({ type, label, desc }) => (
                  <button
                    key={type}
                    onClick={() => { setCallType(type); setStep('lead'); }}
                    className="w-full p-4 rounded-xl border border-border/50 text-left transition-all hover:border-primary/50 hover:bg-muted/30"
                  >
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>

          ) : step === 'lead' ? (
            <motion.div key="lead" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 sm:p-8">
              <button onClick={() => setStep('type')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ChevronLeft size={16} /> Back
              </button>
              <h3 className="text-lg font-semibold mb-1">Assign Lead</h3>
              <p className="text-sm text-muted-foreground mb-4">Select a client for the {callLabel}</p>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or business..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="max-h-[340px] overflow-y-auto space-y-1.5">
                {loadingLeads ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : filteredLeads.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No leads found</p>
                ) : (
                  filteredLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => {
                        setSelectedLead(lead);
                        if (preselectedTime) {
                          setSelectedTime(preselectedTime);
                          setStep('confirm');
                        } else {
                          setStep('time');
                        }
                      }}
                      className="w-full p-3 rounded-lg border border-border/50 text-left transition-all hover:border-primary/50 hover:bg-muted/30 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{lead.name || lead.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.business_name || lead.email}</p>
                      </div>
                      <LeadStatusDot status={lead.status} />
                    </button>
                  ))
                )}
              </div>
            </motion.div>

          ) : step === 'time' ? (
            <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 sm:p-8">
              <button onClick={() => setStep('lead')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ChevronLeft size={16} /> Back
              </button>
              <h3 className="text-lg font-semibold mb-1">Select Time</h3>
              <p className="text-sm text-muted-foreground mb-4">{formattedDate} · {duration} min</p>

              {loadingSlots ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : timeSlots.filter(s => s.available).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No available times</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto">
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
            </motion.div>

          ) : (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 sm:p-8">
              <button onClick={() => preselectedTime ? setStep('lead') : setStep('time')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ChevronLeft size={16} /> Back
              </button>
              <h3 className="text-lg font-semibold mb-4">Confirm Booking</h3>

              <div className="space-y-3 rounded-xl border border-border/50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{callLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{formattedDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{duration} min</span>
                </div>
                <div className="border-t border-border/50 pt-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{selectedLead?.name || selectedLead?.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Business</span>
                  <span className="font-medium">{selectedLead?.business_name || '–'}</span>
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

function LeadStatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    warm_lead: 'bg-amber-400',
    discovery_call_booked: 'bg-orange-400',
    new_lead: 'bg-blue-400',
    new_client: 'bg-cyan-400',
    mbr_sold_dev: 'bg-green-400',
    current_mbr: 'bg-green-500',
    ot_sold_dev: 'bg-emerald-400',
    current_ot: 'bg-emerald-500',
    no_show: 'bg-red-400',
    lost: 'bg-red-500',
  };
  return <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorMap[status] || 'bg-muted-foreground/30'}`} />;
}
