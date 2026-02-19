import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, ArrowRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BUSINESS_TYPES = [
  "Trades & Construction",
  "Professional Services",
  "Health & Wellness",
  "Hospitality & Food",
  "Retail & E-commerce",
  "Real Estate",
  "Creative & Media",
  "Education & Training",
  "Technology",
  "Non-Profit",
  "Other",
];

interface TimeSlot {
  time: string;
  available: boolean;
}

interface OnboardingBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tierName: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

const OnboardingBookingDialog = ({
  open,
  onOpenChange,
  tierName,
  customerName = "",
  customerEmail = "",
  customerPhone = "",
}: OnboardingBookingDialogProps) => {
  const [step, setStep] = useState<"calendar" | "form">("calendar");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: customerEmail,
    phone: customerPhone,
    businessName: "",
    businessType: "",
    businessLocation: "",
  });

  // Pre-fill name from payment
  useEffect(() => {
    if (customerName) {
      const parts = customerName.split(" ");
      setForm((prev) => ({
        ...prev,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
        email: customerEmail || prev.email,
        phone: customerPhone || prev.phone,
      }));
    }
  }, [customerName, customerEmail, customerPhone]);

  const DURATION = 45;

  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();
  const daysInMonth = new Date(year, currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = (currentMonth.getDay() + 6) % 7;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
      const dateStr = new Date(year, currentMonth.getMonth(), selectedDay).toISOString().split("T")[0];
      try {
        const { data, error } = await supabase.functions.invoke("get-available-slots", {
          body: { date: dateStr, duration_override: DURATION },
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
  }, [selectedDay, year, currentMonth]);

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("form");
  };

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    const dateStr = bookingDate.toISOString().split("T")[0];

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
      booking_type: 'onboarding',
      duration_minutes: DURATION,
      notes: `Onboarding call — ${tierName} (45 min)`,
    }).select('id').single();

    if (error) {
      setIsSubmitting(false);
      toast.error("Something went wrong. Please try again.");
      return;
    }

    // Create Zoom meeting + send confirmation email
    let joinUrl: string | null = null;
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
          topic: `Onboarding Call – ${form.businessName.trim()}`,
          start_time: startDate.toISOString(),
          duration: DURATION,
          attendee_email: form.email.trim(),
          attendee_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          booking_type: 'onboarding',
        },
      });

      if (zoomData?.zoom_join_url) {
        joinUrl = zoomData.zoom_join_url;
      }
    } catch (e) {
      console.error('Zoom meeting creation failed:', e);
    }

    setIsSubmitting(false);
    setIsBooked(true);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 border-border/50 bg-card overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Book Your 45-Minute Onboarding Call</DialogTitle>

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
              <p className="text-lg font-semibold text-green-500 mb-1">You're All Set!</p>
              <p className="text-sm text-muted-foreground text-center">
                {monthName} {selectedDay}, {year} at {selectedTime} — 45 minutes
              </p>
              <p className="text-sm text-muted-foreground text-center mt-3">
                We'll send a confirmation with a Zoom link to {form.email}.
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
                <h3 className="text-lg font-semibold">Book Your Onboarding Call</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  45-minute kickoff session for your <span className="font-semibold text-foreground">{tierName}</span> project.
                </p>
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
                <span className="text-sm font-semibold">
                  {monthName} {year}
                </span>
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
                {days.map((d) => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
                    {d}
                  </div>
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
                      onClick={() => {
                        if (available) {
                          setSelectedDay(date);
                          setSelectedTime(null);
                        }
                      }}
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
                      <p className="text-sm text-muted-foreground mb-3">
                        Available times ({DURATION} min)
                      </p>
                      {loadingSlots ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : timeSlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No available times for this date</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots
                            .filter((s) => s.available)
                            .map((slot, index) => (
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
                  {monthName} {selectedDay}, {year} at {selectedTime} — 45 min
                </p>
              </div>

              <div className="space-y-3 mt-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">First name *</Label>
                    <Input
                      value={form.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="First name"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Last name *</Label>
                    <Input
                      value={form.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Last name"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="you@example.com"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Phone *</Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="0400 000 000"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Business name *</Label>
                  <Input
                    value={form.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    placeholder="Your business name"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Business type *</Label>
                  <Select value={form.businessType} onValueChange={(v) => handleInputChange("businessType", v)}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Business location *</Label>
                  <Input
                    value={form.businessLocation}
                    onChange={(e) => handleInputChange("businessLocation", e.target.value)}
                    placeholder="City, State"
                    className="h-10 text-sm"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  variant="hero"
                  size="lg"
                  className="w-full mt-2"
                >
                  {isSubmitting ? "Booking..." : "Confirm Onboarding Call"}
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

export default OnboardingBookingDialog;
