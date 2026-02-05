import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const CalendarMockup = () => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState(false);
  
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dates = Array.from({ length: 35 }, (_, i) => i - 3); // -3 to 31

  const timeSlots = ["9:00 AM", "10:30 AM", "2:00 PM", "3:30 PM"];

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setIsBooked(true);
    // Reset after 2 seconds to allow re-interaction
    setTimeout(() => {
      setIsBooked(false);
      setSelectedTime(null);
      setSelectedDay(null);
    }, 2500);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-3xl p-8 shadow-2xl max-w-xl mx-auto">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft size={20} className="text-muted-foreground" />
          </motion.button>
          <h3 className="text-lg font-semibold">January 2025</h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
          >
            <ChevronRight size={20} className="text-muted-foreground" />
          </motion.button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {days.map((day) => (
            <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {dates.map((date, index) => {
            const isValidDate = date > 0 && date <= 31;
            const isSelected = date === selectedDay;
            const isHovered = date === hoveredDay;
            const hasSlots = isValidDate && [8, 12, 15, 18, 22, 25].includes(date);
            
            return (
              <motion.button
                key={index}
                onHoverStart={() => isValidDate && setHoveredDay(date)}
                onHoverEnd={() => setHoveredDay(null)}
                onClick={() => isValidDate && setSelectedDay(date)}
                whileHover={isValidDate ? { scale: 1.15 } : {}}
                whileTap={isValidDate ? { scale: 0.95 } : {}}
                className={`
                  relative aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200
                  ${!isValidDate ? "text-muted-foreground/30" : ""}
                  ${isSelected ? "bg-foreground text-background" : ""}
                  ${isHovered && !isSelected ? "bg-muted" : ""}
                  ${hasSlots && !isSelected ? "text-accent-foreground" : ""}
                `}
                disabled={!isValidDate}
              >
                {isValidDate ? date : ""}
                {hasSlots && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-foreground" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Time Slots - appears when day is selected */}
        <motion.div
          initial={false}
          animate={{ height: selectedDay && !isBooked ? "auto" : 0, opacity: selectedDay && !isBooked ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="pt-8 border-t border-border/50 mt-8">
            <p className="text-sm text-muted-foreground mb-4">Available times</p>
            <div className="grid grid-cols-2 gap-3">
              {timeSlots.map((time, index) => (
                <motion.button
                  key={time}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, backgroundColor: "hsl(var(--muted))" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTimeSelect(time)}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium transition-colors ${
                    selectedTime === time 
                      ? "border-green-500 bg-green-500/10" 
                      : "border-border/50 hover:border-foreground/20"
                  }`}
                >
                  {time}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Booked Confirmation */}
        <motion.div
          initial={false}
          animate={{ 
            height: isBooked ? "auto" : 0, 
            opacity: isBooked ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="pt-8 border-t border-border/50 mt-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
              >
                <Check className="w-8 h-8 text-green-500" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-semibold text-green-500"
              >
                Booked
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground mt-1"
              >
                {selectedDay && `January ${selectedDay}, 2025 at ${selectedTime}`}
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CalendarMockup;
