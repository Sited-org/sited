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
  { name: "Emily R.", action: "launched their new app", location: "Toronto" },
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
    <span className="text-accent-foreground">
      {text}
      <span className="inline-block w-[3px] h-[1em] bg-accent-foreground ml-1 align-middle animate-pulse" />
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
    { name: "App", path: "/onboarding/app", icon: "📱", stat: "from $15k" },
    { name: "AI", path: "/onboarding/ai", icon: "⚡", stat: "60% automation" },
  ], []);

  return (
    <footer className="relative overflow-hidden bg-foreground text-background">
      {/* Static gradient background - no animation */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent rounded-full blur-[100px]" />
      </div>

      {/* Live Activity Bar */}
      <div className="relative border-b border-background/10 bg-background/5">
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
                <span className="text-background/70">Live</span>
              </span>
              <span className="text-background/90">
                <span className="font-medium">{activity.name}</span> {activity.action}
              </span>
              <span className="text-background/50">• {activity.location}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Main Deal Closing Section */}
      <div className="relative">
        <div className="container-tight py-20 md:py-24">
          {/* The Big Question */}
          <div className="text-center mb-14">
            <p className="text-background/60 text-sm uppercase tracking-widest mb-4">
              One question
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4">
              Ready to build your{" "}
              <TypedText phrases={["dream website?", "next big app?", "AI advantage?"]} />
            </h2>
          </div>

          {/* Interactive Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
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
                  className={`relative p-6 rounded-2xl border transition-colors duration-200 ${
                    hoveredService === service.name
                      ? "bg-background text-foreground border-transparent"
                      : "bg-background/5 border-background/10"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-3xl mb-3 block">{service.icon}</span>
                      <h3 className="text-xl font-semibold mb-1">
                        {service.name} Project
                      </h3>
                      <p className={`text-sm ${hoveredService === service.name ? "text-muted-foreground" : "text-background/60"}`}>
                        {service.stat}
                      </p>
                    </div>
                    <ArrowRight 
                      size={24} 
                      className={`transition-all duration-200 ${
                        hoveredService === service.name ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                      }`}
                    />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Primary CTA */}
          <div className="text-center mb-14">
            <p className="text-background/60 mb-6">Or skip the forms entirely</p>
            <Button
              onClick={() => setIsOpen(true)}
              size="xl"
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-3"
            >
              <MessageCircle size={20} />
              Chat with us now
              <Sparkles size={18} />
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-background/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              <span>No commitment required</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-accent-foreground" />
              <span>Response within 2 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-accent-foreground" />
              <span>50+ projects delivered</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-background/10" />

        {/* Bottom Bar */}
        <div className="container-tight py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link to="/" className="text-2xl font-semibold tracking-tight">
              Sited.
            </Link>
            <div className="flex items-center gap-8">
              {["Services", "Work", "Contact"].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
            <p className="text-sm text-background/40">
              © {currentYear} Sited
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};