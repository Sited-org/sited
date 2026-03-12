import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, ArrowRight, Loader2, MapPin, Globe, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BUSINESS_TYPES = [
  "Trades & Construction", "Professional Services", "Health & Wellness",
  "Hospitality & Food", "Retail & E-commerce", "Real Estate",
  "Creative & Media", "Education & Training", "Technology", "Non-Profit", "Other",
];

const AUSTRALIA_TIMEZONES = [
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST/AEDT)" },
  { value: "Australia/Brisbane", label: "Brisbane (AEST)" },
  { value: "Australia/Perth", label: "Perth (AWST)" },
  { value: "Australia/Adelaide", label: "Adelaide (ACST/ACDT)" },
  { value: "Australia/Hobart", label: "Hobart (AEST/AEDT)" },
  { value: "Australia/Darwin", label: "Darwin (ACST)" },
];

const AUSTRALIA_LOCATIONS = [
  "Sydney, NSW", "Melbourne, VIC", "Brisbane, QLD", "Perth, WA", "Adelaide, SA",
  "Gold Coast, QLD", "Canberra, ACT", "Hobart, TAS", "Darwin, NT",
  "Newcastle, NSW", "Wollongong, NSW", "Sunshine Coast, QLD", "Geelong, VIC",
  "Townsville, QLD", "Cairns, QLD", "Toowoomba, QLD", "Ballarat, VIC",
  "Bendigo, VIC", "Launceston, TAS", "Mackay, QLD", "Rockhampton, QLD",
  "Bunbury, WA", "Bundaberg, QLD", "Hervey Bay, QLD", "Wagga Wagga, NSW",
];

function guessTimezoneFromLocation(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes("wa") || loc.includes("perth") || loc.includes("bunbury")) return "Australia/Perth";
  if (loc.includes("sa") || loc.includes("adelaide")) return "Australia/Adelaide";
  if (loc.includes("nt") || loc.includes("darwin")) return "Australia/Darwin";
  if (loc.includes("tas") || loc.includes("hobart") || loc.includes("launceston")) return "Australia/Hobart";
  if (loc.includes("qld") || loc.includes("brisbane") || loc.includes("gold coast") || loc.includes("sunshine coast") || loc.includes("townsville") || loc.includes("cairns")) return "Australia/Brisbane";
  return "Australia/Sydney";
}

interface TimeSlot {
  time: string;
  available: boolean;
  adminTime?: string;
}

interface OnboardingBookingInlineProps {
  tierName: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerBusinessName?: string;
  durationOverride?: number;
  callLabelOverride?: string;
  bookingTypeOverride?: string;
  onBooked?: () => void;
}

const OnboardingBookingInline = ({
  tierName,
  customerName = "",
  customerEmail = "",
  customerPhone = "",
  customerBusinessName = "",
  durationOverride,
  callLabelOverride,
  bookingTypeOverride,
  onBooked,
}: OnboardingBookingInlineProps) => {
  const [step, setStep] = useState<"calendar" | "form">("calendar");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedAdminTime, setSelectedAdminTime] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState("Australia/Sydney");
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaQuestion, setCaptchaQuestion] = useState<string | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: customerEmail, phone: customerPhone,
    businessName: customerBusinessName, businessType: "", businessLocation: "",
  });

  useEffect(() => {
    if (customerName) {
      const parts = customerName.split(" ");
      setForm((prev) => ({
        ...prev,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
        email: customerEmail || prev.email,
        phone: customerPhone || prev.phone,
        businessName: customerBusinessName || prev.businessName,
      }));
    }
  }, [customerName, customerEmail, customerPhone, customerBusinessName]);

  const filteredLocations = useMemo(() => {
    if (!locationQuery.trim()) return AUSTRALIA_LOCATIONS.slice(0, 8);
    return AUSTRALIA_LOCATIONS.filter(l => l.toLowerCase().includes(locationQuery.toLowerCase())).slice(0, 8);
  }, [locationQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setShowLocationDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const DURATION = durationOverride || 45;
  const CALL_LABEL = callLabelOverride || "Plan Call";
  const BOOKING_TYPE = bookingTypeOverride || "plan";

  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();
  const daysInMonth = new Date(year, currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = (currentMonth.getDay() + 6) % 7;
  const daysHeader = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
        const { data, error } = await supabase.functions.invoke("get-available-slots", {
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

  const handleTimeSelect = (slot: TimeSlot) => {
    setSelectedTime(slot.time);
    setSelectedAdminTime(slot.adminTime || slot.time);
    setStep("form");
    // Pre-fetch captcha when moving to form step
    fetchCaptcha();
  };

  const fetchCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaError(null);
    setCaptchaAnswer("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-captcha");
      if (error || !data) throw new Error("Failed to load captcha");
      setCaptchaToken(data.token);
      setCaptchaQuestion(data.question);
    } catch {
      setCaptchaError("Could not load verification. Please try again.");
    }
    setCaptchaLoading(false);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = (location: string) => {
    setLocationQuery(location);
    handleInputChange("businessLocation", location);
    setShowLocationDropdown(false);
    setSelectedTimezone(guessTimezoneFromLocation(location));
  };

  const isFormValid =
    form.firstName.trim() && form.lastName.trim() && form.email.trim() &&
    form.phone.trim() && form.businessName.trim() && form.businessType && form.businessLocation.trim() &&
    captchaAnswer.trim();

  const handleSubmit = async () => {
    if (!isFormValid || !selectedDay || !selectedTime || !captchaToken) return;
    setIsSubmitting(true);
    setCaptchaError(null);

    const bookingDate = new Date(year, currentMonth.getMonth(), selectedDay);
    const dateStr = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}-${String(bookingDate.getDate()).padStart(2, '0')}`;

    try {
      const { data: result, error } = await supabase.functions.invoke("submit-booking", {
        body: {
          captcha_token: captchaToken,
          captcha_answer: Number(captchaAnswer),
          booking: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            business_name: form.businessName.trim(),
            business_type: form.businessType,
            business_location: form.businessLocation.trim(),
            booking_date: dateStr,
            booking_time: selectedAdminTime || selectedTime,
            booking_type: BOOKING_TYPE,
            duration_minutes: DURATION,
            notes: `${CALL_LABEL} — ${tierName} (${DURATION} min)`,
          },
        },
      });

      if (error || !result?.booking_id) {
        const errMsg = result?.error || "Something went wrong. Please try again.";
        console.error("submit-booking error:", error, result);
        setCaptchaError(errMsg);
        await fetchCaptcha();
        setIsSubmitting(false);
        return;
      }

      const bookingId = result.booking_id;

      // Create Zoom meeting using admin timezone time for correct scheduling
      try {
        const adminTime = selectedAdminTime || selectedTime!;
        const [timePart, ampm] = adminTime.split(' ');
        const [hStr, mStr] = timePart.split(':');
        let hours = parseInt(hStr);
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        // Build ISO string in admin timezone (Australia/Sydney default)
        const pad = (n: number) => String(n).padStart(2, '0');
        const isoDateStr = `${year}-${pad(currentMonth.getMonth() + 1)}-${pad(selectedDay)}T${pad(hours)}:${pad(parseInt(mStr))}:00`;
        // Use Intl to get the UTC offset for the admin timezone
        const tempDate = new Date(year, currentMonth.getMonth(), selectedDay, hours, parseInt(mStr));
        const adminTzOffset = getTimezoneOffsetString(tempDate, 'Australia/Sydney');

        await supabase.functions.invoke('create-zoom-meeting', {
          body: {
            booking_id: bookingId,
            topic: `${CALL_LABEL} – ${form.businessName.trim()}`,
            start_time: `${isoDateStr}${adminTzOffset}`,
            duration: DURATION,
            attendee_email: form.email.trim(),
            attendee_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
            booking_type: BOOKING_TYPE,
            business_name: form.businessName.trim(),
            attendee_phone: form.phone.trim(),
            attendee_timezone: selectedTimezone,
            create_lead: true,
            business_type: form.businessType,
            business_location: form.businessLocation.trim(),
          },
        });
      } catch (e) {
        console.error('Zoom meeting creation failed:', e);
      }

      setIsSubmitting(false);
      setIsBooked(true);
      onBooked?.();
    } catch (err) {
      console.error("Booking submission error:", err);
      toast.error("Something went wrong. Please try again.");
      await fetchCaptcha();
      setIsSubmitting(false);
    }
  };

  if (isBooked) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </motion.div>
        <p className="text-lg font-semibold text-green-500 mb-1">You're All Set!</p>
        <p className="text-sm text-muted-foreground text-center">
          {monthName} {selectedDay}, {year} at {selectedTime} — {DURATION} min {CALL_LABEL}
        </p>
        <p className="text-sm text-muted-foreground text-center mt-3">
          We'll send a confirmation with a Zoom link to {form.email}.
        </p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {step === "calendar" ? (
        <motion.div key="calendar" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Book Your {CALL_LABEL}</h3>
            <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
              {DURATION}-minute kickoff session for your <span className="font-semibold text-gray-900 dark:text-foreground">{tierName}</span> project.
            </p>
          </div>

          {/* Timezone Selector */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Globe size={14} className="text-muted-foreground" />
              <Label className="text-xs text-gray-500 dark:text-muted-foreground">Your timezone</Label>
            </div>
            <Select value={selectedTimezone} onValueChange={(v) => { setSelectedTimezone(v); setSelectedTime(null); }}>
              <SelectTrigger className="h-9 text-sm text-gray-900 dark:text-foreground border-gray-200 dark:border-border">
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
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => monthOffset > 0 && setMonthOffset((m) => m - 1)} className="p-2 rounded-full disabled:opacity-30" disabled={monthOffset === 0}>
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <span className="text-sm font-bold text-gray-900 dark:text-foreground">{monthName} {year}</span>
            <button onClick={() => monthOffset < 2 && setMonthOffset((m) => m + 1)} className="p-2 rounded-full disabled:opacity-30" disabled={monthOffset >= 2}>
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {daysHeader.map((d) => (
              <div key={d} className="text-center text-[11px] text-gray-400 font-semibold py-1.5">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDates.map((date, i) => {
              if (date === null) return <div key={`empty-${i}`} />;
              const available = isDateAvailable(date);
              const isSelected = date === selectedDay;
              return (
                <button
                  key={date}
                  onClick={() => { if (available) { setSelectedDay(date); setSelectedTime(null); } }}
                  disabled={!available}
                  className={`aspect-square rounded-md flex items-center justify-center text-sm font-medium transition-colors
                    ${!available ? "text-gray-300 cursor-not-allowed" : "text-gray-900 cursor-pointer active:bg-gray-200"}
                    ${isSelected ? "bg-sited-blue text-white" : ""}`}
                >{date}</button>
              );
            })}
          </div>

          {/* Time Slots */}
          {selectedDay && (
            <div className="pt-5 mt-5 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">Available times ({DURATION} min)</p>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
              ) : timeSlots.filter(s => s.available).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No available times for this date</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.filter((s) => s.available).map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => handleTimeSelect(slot)}
                      className="py-2.5 px-3 rounded-md border border-gray-200 text-sm font-medium text-gray-900 active:bg-sited-blue active:text-white active:border-sited-blue transition-colors"
                    >{slot.time}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-6 sm:p-8">
          <button onClick={() => setStep("calendar")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="mb-1">
            <h3 className="text-lg font-semibold">Your Details</h3>
            <p className="text-sm text-muted-foreground mt-1">{monthName} {selectedDay}, {year} at {selectedTime} — {DURATION} min</p>
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
                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select your industry" /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {BUSINESS_TYPES.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5" ref={locationRef}>
              <Label className="text-xs flex items-center gap-1"><MapPin size={12} /> Business location *</Label>
              <div className="relative">
                <Input
                  value={locationQuery || form.businessLocation}
                  onChange={(e) => { setLocationQuery(e.target.value); handleInputChange("businessLocation", e.target.value); setShowLocationDropdown(true); }}
                  onFocus={() => setShowLocationDropdown(true)}
                  placeholder="Search city..."
                  className="h-10 text-sm"
                />
                {showLocationDropdown && filteredLocations.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredLocations.map((loc) => (
                      <button key={loc} type="button" onClick={() => handleLocationSelect(loc)} className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg">{loc}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Captcha verification */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label className="text-xs">Quick verification *</Label>
              {captchaLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : captchaQuestion ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
                    <span className="text-sm font-mono font-semibold text-foreground">{captchaQuestion} =</span>
                  </div>
                  <Input
                    type="number"
                    value={captchaAnswer}
                    onChange={(e) => { setCaptchaAnswer(e.target.value); setCaptchaError(null); }}
                    placeholder="?"
                    className="h-10 w-20 text-sm text-center"
                  />
                  <button type="button" onClick={fetchCaptcha} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="New question">
                    <RefreshCw size={14} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={fetchCaptcha} className="text-sm text-primary hover:underline">
                  Load verification
                </button>
              )}
              {captchaError && (
                <p className="text-xs text-destructive">{captchaError}</p>
              )}
            </div>
            <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} variant="hero" size="lg" className="w-full mt-2">
              {isSubmitting ? "Booking..." : `Confirm ${CALL_LABEL}`}
              <ArrowRight size={16} />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingBookingInline;
