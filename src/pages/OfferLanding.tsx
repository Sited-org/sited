import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Shield, Star, Quote } from "lucide-react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import { useState } from "react";

const clientSites = [
  {
    name: "Hunter Insight",
    url: "https://hunterinsight.com.au",
    screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/hunterinsight-full.png",
  },
  {
    name: "Ingle & Brown",
    url: "https://inglebrown.sited.co",
    screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/inglebrown-full.png",
  },
  {
    name: "Wisdom Education",
    url: "https://wisdomeducation.org",
    screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/wisdomeducation-full.png",
  },
];

const testimonials = [
  {
    text: "Andy & the team at Sited were great in their professionalism & customer service. If you are looking for a website I would definitely recommend reaching out to Andy.",
    author: "Ben Brown",
    role: "Ingle & Brown Conveyancing",
  },
  {
    text: "Sited was incredible in their delivery, even with very specific instructions for how I wanted the website to look. All changes were looked at & implemented within days.",
    author: "Beata Fuller",
    role: "Wisdom Education",
  },
  {
    text: "Sited transformed our entire digital presence. The website they built doesn't just look incredible — it's become our most effective sales tool.",
    author: "Sarah Mitchell",
    role: "Bloom Floristry",
  },
];

/* ─── MacBook mockup card with auto-scroll ─── */
const MockupCard = ({ site, index }: { site: (typeof clientSites)[0]; index: number }) => {
  const [loaded, setLoaded] = useState(false);
  const [scrollActive, setScrollActive] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Measure viewport
  useState(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setViewportH(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  });

  // Stagger scroll start
  useState(() => {
    if (!loaded) return;
    const timer = setTimeout(() => setScrollActive(true), index * 500 + 750);
    return () => clearTimeout(timer);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="min-w-[300px] sm:min-w-[380px] snap-center"
    >
      <div className="rounded-2xl border border-border bg-card shadow-elevated overflow-hidden">
        {/* Chrome bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/60 border-b border-border">
          <div className="w-2 h-2 rounded-full bg-destructive/50" />
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />
          <div className="w-2 h-2 rounded-full bg-accent/50" />
          <div className="ml-3 flex-1 h-5 bg-background rounded-md flex items-center px-3">
            <span className="text-[9px] text-muted-foreground truncate">{site.url}</span>
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
              animation:
                scrollActive && scrollDistance > 0
                  ? `scrollIframe 20s ease-in-out infinite`
                  : "none",
              ["--scroll-distance" as string]: `-${scrollDistance}px`,
            }}
          >
            <img
              src={site.screenshot}
              alt={`${site.name} website`}
              className="w-full h-auto block"
              loading="lazy"
              onLoad={(e) => {
                const img = e.currentTarget;
                const dist = img.offsetHeight - viewportH;
                setScrollDistance(dist > 0 ? dist : 0);
                setLoaded(true);
                setTimeout(() => setScrollActive(true), index * 500 + 750);
              }}
            />
          </div>
          {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
        </div>
      </div>
      <p className="mt-3 text-center text-sm font-bold text-foreground">{site.name}</p>
    </motion.div>
  );
};

/* ─── Testimonial block ─── */
const TestimonialBlock = ({ t, index }: { t: (typeof testimonials)[0]; index: number }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0, 1, 1, 1, 0]);

  return (
    <motion.div ref={ref} style={{ opacity }} className="py-8 border-b border-border last:border-b-0">
      <div className="flex gap-4 items-start">
        <Quote size={28} className="text-[hsl(var(--sited-blue))]/30 shrink-0 mt-1" />
        <div>
          <p className="text-lg sm:text-xl font-bold text-foreground leading-snug">"{t.text}"</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
              ))}
            </div>
            <span className="text-sm font-bold text-foreground">{t.author}</span>
            <span className="text-sm text-muted-foreground">· {t.role}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── CTA Button ─── */
const ClaimOfferButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    animate={{ y: [0, -5, 0] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    onClick={onClick}
    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-[hsl(var(--sited-blue))] hover:bg-[hsl(var(--sited-blue-hover))] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[hsl(var(--sited-blue))]/25 transition-colors"
  >
    Claim Offer — $49 Deposit
    <ArrowRight size={18} />
  </motion.button>
);

const OfferLanding = () => {
  const navigate = useNavigate();
  const [showLeadCapture, setShowLeadCapture] = useState(false);

  usePageSEO({
    title: "Claim Your Website | Sited — $49 Refundable Deposit",
    description:
      "Get a custom, high-converting website built in 7 days. Just $49 refundable deposit to get started.",
  });

  const handleClaim = () => {
    const captured = sessionStorage.getItem("lead_captured");
    if (!captured) {
      setShowLeadCapture(true);
    } else {
      navigate("/contact/offers");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ═══ BLOCK 1 — Hero + Claim Offer ═══ */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-foreground uppercase leading-[0.9]">
            YOUR WEBSITE,
            <br />
            <span className="text-[hsl(var(--sited-blue))]">IN 7 DAYS</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            A fully custom, high-converting website — built by our team.
            <br />
            <span className="font-black text-foreground">$49 refundable deposit</span> to get started. No risk.
          </p>

          <div className="flex flex-col items-center gap-3 pt-4">
            <ClaimOfferButton onClick={handleClaim} />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield size={14} className="text-[hsl(var(--sited-blue))]" />
              <span>100% money-back guarantee — don't love it, full refund</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══ BLOCK 2 — Who We Are + Mockups ═══ */}
      <section className="py-16 sm:py-24 bg-card border-y border-border">
        <div className="w-[92%] max-w-[1100px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 space-y-4"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--sited-blue))] font-bold">
              Who We Are
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground uppercase">
              We Build Websites That{" "}
              <span className="text-[hsl(var(--sited-blue))]">Work</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Sited is a web design studio that builds custom, high-converting websites for small businesses.
              Every site is hand-crafted — no templates, no builders, no shortcuts.
            </p>
          </motion.div>

          {/* Horizontal scrollable mockups */}
          <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-none">
            {clientSites.map((site, i) => (
              <MockupCard key={site.name} site={site} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOCK 3 — Testimonials + CTA ═══ */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="w-[92%] max-w-[800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--sited-blue))] font-bold mb-3">
              Real Results
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground uppercase">
              What Our <span className="text-[hsl(var(--sited-blue))]">Clients</span> Say
            </h2>
          </motion.div>

          <div className="mb-12">
            {testimonials.map((t, i) => (
              <TestimonialBlock key={t.author} t={t} index={i} />
            ))}
          </div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <ClaimOfferButton onClick={handleClaim} />
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Quick questionnaire to tailor the best offer for your business. Takes ~2 minutes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Lead capture gate */}
      <LeadCaptureDialog
        open={showLeadCapture}
        onOpenChange={(open) => {
          if (!open && sessionStorage.getItem("lead_captured")) {
            navigate("/contact/offers");
          }
          setShowLeadCapture(open);
        }}
      />
    </div>
  );
};

export default OfferLanding;
