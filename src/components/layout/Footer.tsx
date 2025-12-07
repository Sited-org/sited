import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, MessageCircle, Zap, CheckCircle2, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useChatStore } from "@/hooks/useChatStore";

// Live activity simulator for social proof
const useRealtimeActivity = () => {
  const activities = [
    { name: "Sarah M.", action: "started a website project", time: "2 min ago", location: "Sydney" },
    { name: "James K.", action: "booked a discovery call", time: "5 min ago", location: "London" },
    { name: "Emily R.", action: "launched their new app", time: "12 min ago", location: "Toronto" },
    { name: "Marcus L.", action: "requested AI integration", time: "18 min ago", location: "Berlin" },
    { name: "Ana S.", action: "submitted project brief", time: "24 min ago", location: "São Paulo" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activities.length);
        setIsVisible(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return { activity: activities[currentIndex], isVisible };
};

// Magnetic button effect
const MagneticButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.3);
    y.set((e.clientY - centerY) * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="relative group"
    >
      {children}
    </motion.button>
  );
};

// Typing effect for the headline
const TypedText = ({ phrases }: { phrases: string[] }) => {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[currentPhrase];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < phrase.length) {
          setDisplayText(phrase.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentPhrase((prev) => (prev + 1) % phrases.length);
        }
      }
    }, isDeleting ? 30 : 80);
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentPhrase, phrases]);

  return (
    <span className="text-accent-foreground">
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-[3px] h-[1em] bg-accent-foreground ml-1 align-middle"
      />
    </span>
  );
};

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { activity, isVisible } = useRealtimeActivity();
  const { setIsOpen } = useChatStore();
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  const services = [
    { name: "Website", path: "/onboarding/website", icon: "🌐", stat: "2 week delivery" },
    { name: "App", path: "/onboarding/app", icon: "📱", stat: "from $15k" },
    { name: "AI", path: "/onboarding/ai", icon: "⚡", stat: "60% automation" },
  ];

  return (
    <footer className="relative overflow-hidden bg-foreground text-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-[120px]"
          animate={{ 
            x: [0, 100, 0], 
            y: [0, 50, 0],
            scale: [1, 1.2, 1] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent rounded-full blur-[100px]"
          animate={{ 
            x: [0, -80, 0], 
            y: [0, -60, 0],
            scale: [1.2, 1, 1.2] 
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Live Activity Bar */}
      <div className="relative border-b border-background/10 bg-background/5 backdrop-blur-sm">
        <div className="container-tight py-3">
          <AnimatePresence mode="wait">
            {isVisible && (
              <motion.div
                key={activity.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-3 text-sm"
              >
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-background/70">Live</span>
                </span>
                <span className="text-background/90">
                  <span className="font-medium">{activity.name}</span> {activity.action}
                </span>
                <span className="text-background/50">• {activity.location}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Deal Closing Section */}
      <div className="relative">
        <div className="container-tight py-20 md:py-28">
          {/* The Big Question */}
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-background/60 text-sm uppercase tracking-widest mb-4"
            >
              One question
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4"
            >
              Ready to build your{" "}
              <TypedText phrases={["dream website?", "next big app?", "AI advantage?"]} />
            </motion.h2>
          </div>

          {/* Interactive Service Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16"
          >
            {services.map((service, index) => (
              <Link
                key={service.name}
                to={service.path}
                onMouseEnter={() => setHoveredService(service.name)}
                onMouseLeave={() => setHoveredService(null)}
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                    hoveredService === service.name
                      ? "bg-background text-foreground border-transparent"
                      : "bg-background/5 border-background/10 hover:border-background/20"
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
                    <motion.div
                      animate={{ x: hoveredService === service.name ? 0 : -10, opacity: hoveredService === service.name ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight size={24} />
                    </motion.div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.div>

          {/* Primary CTA with Magnetic Effect */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center mb-16"
          >
            <p className="text-background/60 mb-6">Or skip the forms entirely</p>
            <MagneticButton onClick={() => setIsOpen(true)}>
              <div className="relative inline-flex items-center gap-3 px-8 py-5 bg-accent text-accent-foreground rounded-full text-lg font-semibold overflow-hidden group">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-accent via-background/20 to-accent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ opacity: 0.3 }}
                />
                <MessageCircle size={22} />
                <span className="relative">Chat with us now</span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative"
                >
                  <Sparkles size={18} />
                </motion.div>
              </div>
            </MagneticButton>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-background/50"
          >
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
          </motion.div>
        </div>

        {/* Divider with glow */}
        <div className="relative h-px">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent" />
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-32 h-px bg-accent"
            animate={{ scaleX: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>

        {/* Bottom Bar */}
        <div className="container-tight py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo */}
            <Link to="/" className="text-2xl font-semibold tracking-tight">
              Sited.
            </Link>

            {/* Quick Links */}
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

            {/* Copyright */}
            <p className="text-sm text-background/40">
              © {currentYear} Sited
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};