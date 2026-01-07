import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, MessageCircle, CheckCircle2, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { useChatStore } from "@/hooks/useChatStore";

// Static activities - memoized
const activities = [
  { name: "Sarah M.", action: "started a website project", location: "Sydney" },
  { name: "James K.", action: "booked a discovery call", location: "London" },
  { name: "Emily R.", action: "launched their new website", location: "Toronto" },
  { name: "Marcus L.", action: "requested AI integration", location: "Berlin" },
  { name: "Ana S.", action: "submitted project brief", location: "São Paulo" },
];

// Simplified activity hook
const useRealtimeActivity = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return activities[currentIndex];
};

// Simpler typing effect with reduced re-renders
const TypedText = ({ phrases }: { phrases: string[] }) => {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[phraseIndex];
    const speed = isDeleting ? 25 : 60;
    
    const timeout = setTimeout(() => {
      if (!isDeleting && text.length < phrase.length) {
        setText(phrase.slice(0, text.length + 1));
      } else if (!isDeleting && text.length === phrase.length) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && text.length > 0) {
        setText(text.slice(0, -1));
      } else if (isDeleting && text.length === 0) {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }, speed);
    
    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, phrases]);

  return (
    <span className="text-foreground">
      {text}
      <span className="inline-block w-[3px] h-[1em] bg-foreground ml-1 align-middle animate-pulse" />
    </span>
  );
};

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const activity = useRealtimeActivity();
  const { setIsOpen } = useChatStore();
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  const services = useMemo(() => [
    { name: "Website", path: "/onboarding/website", icon: "🌐", stat: "2 week delivery" },
    { name: "AI", path: "/onboarding/ai", icon: "⚡", stat: "60% automation" },
  ], []);

  return (
    <footer className="relative overflow-hidden bg-background text-foreground border-t border-border">
      {/* Static gradient background - no animation */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-muted-foreground rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-muted-foreground rounded-full blur-[100px]" />
      </div>

      {/* Live Activity Bar */}
      <div className="relative border-b border-border bg-muted/30">
        <div className="container-tight py-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activity.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center gap-3 text-sm"
            >
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-muted-foreground">Live</span>
              </span>
              <span className="text-foreground/90">
                <span className="font-medium">{activity.name}</span> {activity.action}
              </span>
              <span className="text-muted-foreground">• {activity.location}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Main Deal Closing Section */}
      <div className="relative">
        <div className="container-tight py-12 sm:py-16 md:py-20 lg:py-24">
          {/* The Big Question */}
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-muted-foreground text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4">
              One question
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight mb-3 sm:mb-4">
              Ready to build your{" "}
              <TypedText phrases={["dream website?", "AI advantage?", "online presence?"]} />
            </h2>
          </div>

          {/* Interactive Service Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10 sm:mb-14">
            {services.map((service) => (
              <Link
                key={service.name}
                to={service.path}
                onMouseEnter={() => setHoveredService(service.name)}
                onMouseLeave={() => setHoveredService(null)}
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={`relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border transition-colors duration-200 ${
                    hoveredService === service.name
                      ? "bg-foreground text-background border-transparent"
                      : "bg-muted/50 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-2xl sm:text-3xl mb-2 sm:mb-3 block">{service.icon}</span>
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-0.5 sm:mb-1">
                        {service.name} Project
                      </h3>
                      <p className={`text-xs sm:text-sm ${hoveredService === service.name ? "text-background/70" : "text-muted-foreground"}`}>
                        {service.stat}
                      </p>
                    </div>
                    <ArrowRight 
                      size={20} 
                      className={`sm:w-6 sm:h-6 transition-all duration-200 ${
                        hoveredService === service.name ? "opacity-100 translate-x-0 text-background" : "opacity-0 -translate-x-2"
                      }`}
                    />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Primary CTA */}
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">Or skip the forms entirely</p>
            <Button
              onClick={() => setIsOpen(true)}
              size="xl"
              className="bg-foreground text-background hover:bg-foreground/90 gap-2 sm:gap-3 w-full sm:w-auto"
            >
              <MessageCircle size={18} className="sm:w-5 sm:h-5" />
              Chat with us now
              <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle2 size={14} className="sm:w-4 sm:h-4 text-green-500" />
              <span>No commitment required</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock size={14} className="sm:w-4 sm:h-4 text-foreground" />
              <span>Response within 2 hours</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users size={14} className="sm:w-4 sm:h-4 text-foreground" />
              <span>50+ projects delivered</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Bottom Bar */}
        <div className="container-tight py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <Link to="/" className="text-xl sm:text-2xl font-semibold tracking-tight">
              Sited.
            </Link>
            <div className="flex items-center gap-6 sm:gap-8">
              {["Services", "Work", "Contact"].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              © {currentYear} Sited
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};