import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Globe, Users, Award, ShieldCheck } from "lucide-react";

const stats = [
  { value: "500+", label: "Websites Delivered", icon: Globe },
  { value: "7+", label: "Years in Business", icon: Award },
  { value: "4.9★", label: "Average Rating", icon: Star },
  { value: "12", label: "Countries Served", icon: Users },
];

const trustLogos = [
  { name: "Google", sub: "Partner" },
  { name: "Meta", sub: "Business Partner" },
  { name: "Stripe", sub: "Verified" },
  { name: "GitHub", sub: "Backed" },
];

const reviews = [
  {
    quote: "Best investment we ever made for our business. ROI within the first month.",
    author: "Sarah M.",
    role: "Founder, CleanPro Services",
    stars: 5,
  },
  {
    quote: "They delivered in 10 days what other agencies quoted 3 months for.",
    author: "James K.",
    role: "Owner, Elite Fitness",
    stars: 5,
  },
  {
    quote: "Our leads increased 340% in the first quarter after launch.",
    author: "Emily R.",
    role: "Director, Bright Dental",
    stars: 5,
  },
];

const showcaseSites = [
  { name: "Hunter Insight", url: "https://hunterinsight.com.au", screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/hunterinsight-full.png" },
  { name: "Ingle & Brown", url: "https://inglebrown.sited.co", screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/inglebrown-full.png" },
];

const MiniMacBookCard = ({ site, index }: { site: typeof showcaseSites[0]; index: number }) => {
  const [loaded, setLoaded] = useState(false);
  const [scrollActive, setScrollActive] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const [hovered, setHovered] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setViewportH(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => setScrollActive(true), index * 500 + 750);
    return () => clearTimeout(timer);
  }, [loaded, index]);

  return (
    <div className="group" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="relative bg-card border border-border rounded-2xl shadow-elevated overflow-hidden transition-shadow duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--foreground)/0.15)]">
        {/* MacBook chrome */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 border-b border-border">
          <div className="w-1.5 h-1.5 rounded-full bg-destructive/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
          <div className="ml-2 flex-1 h-4 bg-background rounded-md flex items-center px-2">
            <span className="text-[8px] text-muted-foreground truncate">{site.url}</span>
          </div>
        </div>

        {/* Viewport */}
        <div
          ref={viewportRef}
          className="relative w-full overflow-hidden bg-background"
          style={{ aspectRatio: "16 / 10" }}
        >
          <div
            className="absolute top-0 left-0 w-full will-change-transform"
            style={{
              animation: scrollActive && !hovered && scrollDistance > 0
                ? `scrollIframe 20s ease-in-out infinite`
                : "none",
              ["--scroll-distance" as string]: `-${scrollDistance}px`,
            }}
          >
            <img
              src={site.screenshot}
              alt={`${site.name} website screenshot`}
              className="w-full h-auto block"
              loading="lazy"
              onLoad={(e) => {
                const img = e.currentTarget;
                const dist = img.offsetHeight - viewportH;
                setScrollDistance(dist > 0 ? dist : 0);
                setLoaded(true);
              }}
            />
          </div>

          {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/60 transition-all duration-300 flex items-center justify-center z-10">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
              <p className="text-white font-black text-xs sm:text-sm uppercase tracking-tight">{site.name}</p>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block px-3 py-1 bg-sited-blue text-white text-[10px] font-bold rounded-full hover:bg-sited-blue-hover transition-colors"
              >
                Visit Site →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialProofSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className="mt-20 space-y-14"
    >
      {/* Section Header */}
      <div className="text-center space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-sited-blue">
          WHY BUSINESSES TRUST US
        </p>
        <h3 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">
          Trusted Worldwide
        </h3>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="text-center p-4 rounded-xl border border-border bg-card"
            >
              <Icon size={20} className="mx-auto mb-2 text-sited-blue" />
              <p className="text-2xl sm:text-3xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Website Showcase — 2 side-by-side */}
      <div className="space-y-4">
        <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Live Client Websites
        </p>
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {showcaseSites.map((site, i) => (
            <motion.div
              key={site.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.15 }}
            >
              <MiniMacBookCard site={site} index={i} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trusted By Logos */}
      <div className="space-y-4">
        <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Trusted & Certified By
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {trustLogos.map((logo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.05 }}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
            >
              <ShieldCheck size={18} className="text-sited-blue mb-1" />
              <p className="text-xs font-black text-foreground">{logo.name}</p>
              <p className="text-[10px] text-muted-foreground">{logo.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
          What Our Clients Say
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1 }}
              className="p-5 rounded-xl border border-border bg-card"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: review.stars }).map((_, s) => (
                  <Star key={s} size={14} className="fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-sm text-foreground font-medium mb-3 leading-relaxed">
                "{review.quote}"
              </p>
              <div>
                <p className="text-xs font-black text-foreground">{review.author}</p>
                <p className="text-xs text-muted-foreground">{review.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom trust bar */}
      <div className="text-center p-6 rounded-xl border border-sited-blue/20 bg-sited-blue/5">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck size={20} className="text-sited-blue" />
          <p className="text-sm font-black text-foreground uppercase tracking-wider">
            100% Satisfaction Guarantee
          </p>
        </div>
        <p className="text-xs text-muted-foreground max-w-lg mx-auto">
          If you're not completely happy with the final result, we'll refund your deposit in full. No questions asked. We've delivered 500+ websites and counting — your project is in safe hands.
        </p>
      </div>
    </motion.div>
  );
};

export default SocialProofSection;
