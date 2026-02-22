import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, ArrowRight, Loader2, MapPin, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DURATION = 20;
const CALL_LABEL = "Discovery Call";

const AUSTRALIA_TIMEZONES = [
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)", state: "NSW" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST/AEDT)", state: "VIC" },
  { value: "Australia/Brisbane", label: "Brisbane (AEST)", state: "QLD" },
  { value: "Australia/Perth", label: "Perth (AWST)", state: "WA" },
  { value: "Australia/Adelaide", label: "Adelaide (ACST/ACDT)", state: "SA" },
  { value: "Australia/Hobart", label: "Hobart (AEST/AEDT)", state: "TAS" },
  { value: "Australia/Darwin", label: "Darwin (ACST)", state: "NT" },
  { value: "Australia/Lord_Howe", label: "Lord Howe Island", state: "NSW" },
];

const AUSTRALIA_LOCATIONS = [
  "Sydney, NSW", "Melbourne, VIC", "Brisbane, QLD", "Perth, WA", "Adelaide, SA",
  "Gold Coast, QLD", "Canberra, ACT", "Hobart, TAS", "Darwin, NT",
  "Newcastle, NSW", "Wollongong, NSW", "Sunshine Coast, QLD", "Geelong, VIC",
  "Townsville, QLD", "Cairns, QLD", "Toowoomba, QLD", "Ballarat, VIC",
  "Bendigo, VIC", "Launceston, TAS", "Mackay, QLD", "Rockhampton, QLD",
  "Bunbury, WA", "Bundaberg, QLD", "Hervey Bay, QLD", "Wagga Wagga, NSW",
  "Mildura, VIC", "Shepparton, VIC", "Gladstone, QLD", "Albury, NSW",
  "Port Macquarie, NSW", "Tamworth, NSW", "Orange, NSW", "Dubbo, NSW",
  "Geraldton, WA", "Kalgoorlie, WA", "Alice Springs, NT", "Mount Gambier, SA",
];

function guessTimezoneFromLocation(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes("wa") || loc.includes("perth") || loc.includes("bunbury") || loc.includes("geraldton") || loc.includes("kalgoorlie")) return "Australia/Perth";
  if (loc.includes("sa") || loc.includes("adelaide") || loc.includes("mount gambier")) return "Australia/Adelaide";
  if (loc.includes("nt") || loc.includes("darwin") || loc.includes("alice springs")) return "Australia/Darwin";
  if (loc.includes("tas") || loc.includes("hobart") || loc.includes("launceston")) return "Australia/Hobart";
  if (loc.includes("qld") || loc.includes("brisbane") || loc.includes("gold coast") || loc.includes("sunshine coast") || loc.includes("townsville") || loc.includes("cairns") || loc.includes("toowoomba") || loc.includes("mackay") || loc.includes("rockhampton") || loc.includes("bundaberg") || loc.includes("hervey bay") || loc.includes("gladstone")) return "Australia/Brisbane";
  return "Australia/Sydney";
}

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BookingDialog = ({ open, onOpenChange }: BookingDialogProps) => {
  const [step, setStep] = useState<"calendar" | "form">("calendar");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [zoomJoinUrl, setZoomJoinUrl] = useState<string | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState("Australia/Sydney");
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "",
    businessLocation: "",
  });

  const filteredLocations = useMemo(() => {
    if (!locationQuery.trim()) return AUSTRALIA_LOCATIONS.slice(0, 8);
    return AUSTRALIA_LOCATIONS.filter(l => l.toLowerCase().includes(locationQuery.toLowerCase())).slice(0, 8);
  }, [locationQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
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
    if (!selectedDay) return;
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
  }, [selectedDay, year, monthOffset, selectedTimezone]);

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("form");
  };

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = (location: string) => {
    setLocationQuery(location);
    handleInputChange("businessLocation", location);
    setShowLocationDropdown(false);
    // Auto-set timezone
    setSelectedTimezone(guessTimezoneFromLocation(location));
  };

  const isFormValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.businessName.trim() &&
    form.businessType &&
    form.businessLocation.trim();

  const handleSubmit = async () => {
    if (!isFormValid || !selectedDay || !selectedTime) return;
    setIsSubmitting(true);

    const bookingDate = new Date(year, currentMonth.getMonth(), selectedDay);
    const dateStr = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}-${String(bookingDate.getDate()).padStart(2, '0')}`;

    const { data: insertData, error } = await supabase.from("bookings").insert({
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      business_name: form.businessName.trim(),
      business_type: form.businessType,
      business_location: form.businessLocation.trim(),
      booking_date: dateStr,
      booking_time: selectedTime,
      booking_type: 'discovery',
      duration_minutes: DURATION,
    }).select('id').single();

    if (error) {
      setIsSubmitting(false);
      toast.error("Something went wrong. Please try again.");
      return;
    }

    try {
      const [timePart, ampm] = selectedTime!.split(' ');
      const [hStr, mStr] = timePart.split(':');
      let hours = parseInt(hStr);
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const startDate = new Date(year, currentMonth.getMonth(), selectedDay, hours, parseInt(mStr));

      const { data: zoomData } = await supabase.functions.invoke('create-zoom-meeting', {
        body: {
          booking_id: insertData.id,
          topic: `Discovery Call – ${form.businessName.trim()}`,
          start_time: startDate.toISOString(),
          duration: DURATION,
          attendee_email: form.email.trim(),
          attendee_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          booking_type: 'discovery',
          business_name: form.businessName.trim(),
          attendee_phone: form.phone.trim(),
          attendee_timezone: selectedTimezone,
          create_lead: true,
          business_type: form.businessType,
          business_location: form.businessLocation.trim(),
        },
      });

      if (zoomData?.zoom_join_url) {
        setZoomJoinUrl(zoomData.zoom_join_url);
      }
    } catch (e) {
      console.error('Zoom meeting creation failed:', e);
    }

    setIsSubmitting(false);
    setIsBooked(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("calendar");
      setSelectedDay(null);
      setSelectedTime(null);
      setHoveredDay(null);
      setIsBooked(false);
      setMonthOffset(0);
      setZoomJoinUrl(null);
      setLocationQuery("");
      setSelectedTimezone("Australia/Sydney");
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        businessName: "",
        businessType: "",
        businessLocation: "",
      });
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[92vw] sm:max-w-lg p-0 gap-0 border-border/50 bg-card overflow-hidden max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogTitle className="sr-only">Book a Discovery Call</DialogTitle>

        <AnimatePresence mode="wait">
          {isBooked ? (
            <motion.div
              key="booked"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 px-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
              >
                <Check className="w-8 h-8 text-green-500" />
              </motion.div>
              <p className="text-lg font-semibold text-green-500 mb-1">Booked</p>
              <p className="text-sm text-muted-foreground text-center">
                {monthName} {selectedDay}, {year} at {selectedTime} — {DURATION} min {CALL_LABEL}
              </p>
              {zoomJoinUrl ? (
                <a
                  href={zoomJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  Join Zoom Meeting ↗
                </a>
              ) : (
                <p className="text-sm text-muted-foreground text-center mt-3">
                  We'll send a confirmation with meeting details to {form.email}.
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center mt-2">
                A confirmation email with your Zoom link has been sent.
              </p>
              <Button variant="outline" className="mt-6" onClick={handleClose}>
                Close
              </Button>
            </motion.div>

          ) : step === "calendar" ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 sm:p-8"
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold">{CALL_LABEL}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {DURATION}-minute call to learn about your business and goals. Pick a date and time.
                </p>
              </div>

              {/* Timezone Selector */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe size={14} className="text-muted-foreground" />
                  <Label className="text-xs text-muted-foreground">Your timezone</Label>
                </div>
                <Select value={selectedTimezone} onValueChange={(v) => { setSelectedTimezone(v); setSelectedTime(null); }}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {AUSTRALIA_TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Nav */}
              <div className="flex items-center justify-between mb-6">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => monthOffset > 0 && setMonthOffset((m) => m - 1)}
                  className="p-2 rounded-full hover:bg-muted/50 transition-colors disabled:opacity-30"
                  disabled={monthOffset === 0}
                >
                  <ChevronLeft size={18} className="text-muted-foreground" />
                </motion.button>
                <span className="text-sm font-semibold">{monthName} {year}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => monthOffset < 2 && setMonthOffset((m) => m + 1)}
                  className="p-2 rounded-full hover:bg-muted/50 transition-colors disabled:opacity-30"
                  disabled={monthOffset >= 2}
                >
                  <ChevronRight size={18} className="text-muted-foreground" />
                </motion.button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDates.map((date, i) => {
                  if (date === null) return <div key={`empty-${i}`} />;
                  const available = isDateAvailable(date);
                  const isSelected = date === selectedDay;
                  const isHovered = date === hoveredDay;

                  return (
                    <motion.button
                      key={date}
                      onHoverStart={() => available && setHoveredDay(date)}
                      onHoverEnd={() => setHoveredDay(null)}
                      onClick={() => { if (available) { setSelectedDay(date); setSelectedTime(null); } }}
                      whileHover={available ? { scale: 1.1 } : {}}
                      whileTap={available ? { scale: 0.95 } : {}}
                      disabled={!available}
                      className={`
                        aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-150
                        ${!available ? "text-muted-foreground/30 cursor-not-allowed" : "cursor-pointer"}
                        ${isSelected ? "bg-foreground text-background" : ""}
                        ${isHovered && !isSelected ? "bg-muted" : ""}
                        ${available && !isSelected ? "hover:bg-muted" : ""}
                      `}
                    >
                      {date}
                    </motion.button>
                  );
                })}
              </div>

              {/* Time Slots */}
              <AnimatePresence>
                {selectedDay && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 mt-6 border-t border-border/50">
                      <p className="text-sm text-muted-foreground mb-3">Available times ({DURATION} min)</p>
                      {loadingSlots ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : timeSlots.filter(s => s.available).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No available times for this date</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.filter(s => s.available).map((slot, index) => (
                            <motion.button
                              key={slot.time}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleTimeSelect(slot.time)}
                              className="py-2.5 px-3 rounded-lg border border-border/50 text-sm font-medium hover:border-foreground/20 hover:bg-muted/50 transition-colors"
                            >
                              {slot.time}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 sm:p-8"
            >
              <button
                onClick={() => setStep("calendar")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <div className="mb-1">
                <h3 className="text-lg font-semibold">Your Details</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {CALL_LABEL} · {monthName} {selectedDay}, {year} at {selectedTime} · {DURATION} min
                </p>
              </div>

              <div className="space-y-3 mt-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">First name *</Label>
                    <Input value={form.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} placeholder="First name" className="h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Last name *</Label>
                    <Input value={form.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} placeholder="Last name" className="h-10 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => handleInputChange("email", e.target.value)} placeholder="you@example.com" className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone *</Label>
                  <Input type="tel" value={form.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="0400 000 000" className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Business name *</Label>
                  <Input value={form.businessName} onChange={(e) => handleInputChange("businessName", e.target.value)} placeholder="Your business name" className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Business type *</Label>
                  <Select value={form.businessType} onValueChange={(v) => handleInputChange("businessType", v)}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {["Trades & Construction","Professional Services","Health & Wellness","Hospitality & Food","Retail & E-commerce","Real Estate","Creative & Media","Education & Training","Technology","Non-Profit","Other"].map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5" ref={locationRef}>
                  <Label className="text-xs flex items-center gap-1"><MapPin size={12} /> Business location *</Label>
                  <div className="relative">
                    <Input
                      value={locationQuery || form.businessLocation}
                      onChange={(e) => {
                        setLocationQuery(e.target.value);
                        handleInputChange("businessLocation", e.target.value);
                        setShowLocationDropdown(true);
                      }}
                      onFocus={() => setShowLocationDropdown(true)}
                      placeholder="Search city..."
                      className="h-10 text-sm"
                    />
                    {showLocationDropdown && filteredLocations.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredLocations.map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => handleLocationSelect(loc)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} variant="hero" size="lg" className="w-full mt-2">
                  {isSubmitting ? "Booking..." : "Confirm Booking"}
                  <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
