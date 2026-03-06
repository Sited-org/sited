import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Star, ArrowRight, Loader2, Shield, Clock, Users, Zap, Quote, CheckCircle2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useFeaturedTestimonials } from "@/hooks/useTestimonials";
import { ThemeSwitchSection } from "@/components/common/ThemeSwitchSection";

/* ─── Schema ─── */
const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  businessName: z.string().trim().min(1, "Business name is required").max(200),
  phone: z.string().trim().min(1, "Phone number is required").max(30),
});

/* ─── Fallback client sites ─── */
const fallbackSites = [
  { name: "Hunter Insight", url: "https://hunterinsight.com.au", screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/hunterinsight-full.png" },
  { name: "Ingle & Brown", url: "https://inglebrown.sited.co", screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/inglebrown-full.png" },
  { name: "Wisdom Education", url: "https://wisdomeducation.org", screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/wisdomeducation-full.png" },
];

/* ─── Testimonials ─── */
const testimonials = [
  { text: "Andy & the team at Sited were great in their professionalism & customer service. If you are looking for a website I would definitely recommend reaching out to Andy.", author: "Ben Brown", role: "Owner, Ingle & Brown Conveyancing" },
  { text: "Sited was incredible in their delivery, even with very specific instructions for how I wanted the website to look. All changes were looked at & implemented within days.", author: "Beata Fuller", role: "CEO, Wisdom Education" },
  { text: "Sited transformed our entire digital presence. The website they built doesn't just look incredible — it's become our most effective sales tool.", author: "Sarah Mitchell", role: "Founder, Bloom Floristry" },
  { text: "From day one, Sited treated our project like it was their own. The attention to detail and speed of delivery was beyond what we expected.", author: "Daniel Verwoert", role: "Owner, Hunter Insight" },
];

/* ─── Stats ─── */
const stats = [
  { value: "5.0", label: "Google Reviews", icon: Star },
  { value: "98%", label: "Satisfaction Rate", icon: Shield },
  { value: "7 Days", label: "Avg Delivery", icon: Clock },
  { value: "500+", label: "Happy Clients", icon: Users },
  { value: "95+", label: "Google Speed Score", icon: Zap },
];

/* ─── Reusable Lead Form ─── */
const LeadForm = ({ id, ctaText, source }: { id: string; ctaText: string; source: string }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const result = leadSchema.safeParse({ name, email, businessName, phone });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => { if (e.path[0]) fieldErrors[e.path[0] as string] = e.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await supabase.functions.invoke("save-partial-lead", {
        body: {
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone,
          project_type: "website",
          business_name: result.data.businessName,
          form_data: { source, business_name: result.data.businessName },
        },
      });
      await supabase.functions.invoke("send-lead-notification", {
        body: {
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone,
          projectType: "website",
          formData: { source, business_name: result.data.businessName },
        },
      });
      // Store lead info in session for questionnaire/offer flow
      sessionStorage.setItem("lead_captured", "true");
      sessionStorage.setItem("lead_name", result.data.name);
      sessionStorage.setItem("lead_email", result.data.email);
      sessionStorage.setItem("lead_phone", result.data.phone);
      sessionStorage.setItem("lead_business_name", result.data.businessName);
      toast.success("You're in! We'll be in touch shortly.");
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const handleSeeOffer = () => {
    navigate("/contact/offers");
  };

  if (submitted) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8 space-y-5">
        <CheckCircle2 size={48} className="mx-auto text-green-500 mb-2" />
        <h3 className="text-xl font-bold text-foreground">Thanks for your entry!</h3>
        <p className="text-muted-foreground">Want to see your personalised offer now?</p>
        <Button onClick={handleSeeOffer} size="lg" className="bg-sited-blue hover:bg-sited-blue-hover text-white font-bold gap-2 px-8">
          See My Offer <ArrowRight size={16} />
        </Button>
        <p className="text-xs text-muted-foreground">Quick questionnaire → Instant offer · No payment required</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${id}-name`} className="text-foreground">Name *</Label>
          <Input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1 bg-background border-border" />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor={`${id}-business`} className="text-foreground">Business Name *</Label>
          <Input id={`${id}-business`} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business" className="mt-1 bg-background border-border" />
          {errors.businessName && <p className="text-xs text-destructive mt-1">{errors.businessName}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${id}-email`} className="text-foreground">Email *</Label>
          <Input id={`${id}-email`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" className="mt-1 bg-background border-border" />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>
        <div>
          <Label htmlFor={`${id}-phone`} className="text-foreground">Phone *</Label>
          <Input id={`${id}-phone`} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04XX XXX XXX" className="mt-1 bg-background border-border" />
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-sited-blue hover:bg-sited-blue-hover text-white font-bold text-base h-12 mt-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {ctaText} <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
      <p className="text-center text-xs text-muted-foreground">Start with a $49 refundable deposit · Delivered in 7 days · 100% money-back guarantee</p>
    </div>
  );
};

/* ─── Stars Row ─── */
const StarsRow = () => (
  <div className="flex items-center gap-1">
    {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />)}
    <span className="text-sm font-bold text-foreground ml-2">5.0 on Google</span>
  </div>
);

/* ─── MacBook Card (simplified for landing) ─── */
const MacBookCard = ({ site, index }: { site: { name: string; url: string; screenshot: string }; index: number }) => {
  const [loaded, setLoaded] = useState(false);
  const [scrollActive, setScrollActive] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [viewportH, setViewportH] = useState(0);
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
    const t = setTimeout(() => setScrollActive(true), index * 600 + 1000);
    return () => clearTimeout(t);
  }, [loaded, index]);

  return (
    <div className="relative bg-card border border-border rounded-2xl shadow-elevated overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 border-b border-border">
        <div className="w-1.5 h-1.5 rounded-full bg-destructive/50" />
        <div className="w-1.5 h-1.5 rounded-full bg-gold" />
        <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
        <div className="ml-2 flex-1 h-4 bg-background rounded-md flex items-center px-2">
          <span className="text-[8px] text-muted-foreground truncate">{site.url}</span>
        </div>
      </div>
      <div ref={viewportRef} className="relative w-full overflow-hidden bg-background" style={{ aspectRatio: "16 / 10" }}>
        <div className="absolute top-0 left-0 w-full will-change-transform" style={{
          animation: scrollActive && scrollDistance > 0 ? `scrollIframe 18s ease-in-out infinite` : "none",
          ["--scroll-distance" as string]: `-${scrollDistance}px`,
        }}>
          <img
            src={site.screenshot}
            alt={`${site.name} website`}
            className="w-full h-auto block"
            loading="lazy"
            onLoad={(e) => {
              const img = e.currentTarget;
              setScrollDistance(Math.max(0, img.offsetHeight - viewportH));
              setLoaded(true);
            }}
          />
        </div>
        {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
      </div>
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">{site.name}</span>
        <StarsRow />
      </div>
    </div>
  );
};

/* ─── Counter Animation ─── */
const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = Math.ceil(value / 40);
    const interval = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(interval); }
      else setCount(start);
    }, 30);
    return () => clearInterval(interval);
  }, [isInView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
};

/* ═══════════════════════════════════════════════ */
/* ─── MAIN PAGE ─── */
/* ═══════════════════════════════════════════════ */
const LandingPage = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const lockInRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const { data: featuredTestimonials } = useFeaturedTestimonials();

  // Build showcase sites from featured testimonials
  const clientSites = featuredTestimonials && featuredTestimonials.length > 0
    ? featuredTestimonials
        .filter(t => t.website_url)
        .map(t => ({
          name: t.business_name,
          url: t.website_url!,
          screenshot: `https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/${t.website_url!.replace(/https?:\/\//, '').replace(/\//g, '').replace(/\./g, '')}-full.png`,
        }))
    : fallbackSites;

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToLockIn = () => lockInRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* ── Scroll progress bar ── */}
      <motion.div className="fixed top-0 left-0 h-1 bg-sited-blue z-50" style={{ width: progressWidth }} />

      {/* ════════════════════════════════════ */}
      {/* BLOCK 1 — HERO */}
      {/* ════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-sited-blue/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
        </div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <StarsRow />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[0.95]">
            Your Website<br />
            <span className="text-sited-blue">Built in 7 Days</span><br />
            or Less.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            Professional, high-converting websites starting from just a <span className="text-foreground font-bold">$49 deposit</span>. Delivered in 7 days — if you're not happy, <span className="text-foreground font-bold">we refund the $49</span>. No risk.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={scrollToForm} size="xl" className="bg-sited-blue hover:bg-sited-blue-hover text-white font-bold gap-2 px-10">
              Lock In My Price <ArrowRight size={18} />
            </Button>
            <Button onClick={() => document.getElementById("showcase")?.scrollIntoView({ behavior: "smooth" })} variant="outline" size="lg" className="gap-2">
              See Our Work <ChevronDown size={16} />
            </Button>
          </div>
          <p className="mt-4 text-sm text-green-600 dark:text-green-400 font-semibold">No commitment · 48 Hours to decide</p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown className="text-muted-foreground" size={28} />
        </motion.div>
      </section>

      {/* ════════════════════════════════════ */}
      {/* BLOCK 2 — LEAD CAPTURE */}
      {/* ════════════════════════════════════ */}
      <section ref={formRef} className="py-16 sm:py-24 bg-card border-y border-border">
        <div className="w-[92%] max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">Limited February Spots</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">Get Your <span className="text-sited-blue">Free Quote</span></h2>
            <p className="text-muted-foreground mt-2">No payment needed. No obligation. Just your details and we'll take it from there.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }} className="bg-background border border-border rounded-2xl p-6 sm:p-8 shadow-elevated">
            <LeadForm id="top" ctaText="Get My Free Quote" source="landing_top" />
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════ */}
      {/* BLOCK 3 — FOUNDER NOTE */}
      {/* ════════════════════════════════════ */}
      <ThemeSwitchSection className="py-16 sm:py-24 bg-background">
        <div className="w-[92%] max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative bg-card border border-border rounded-2xl p-8 sm:p-12 shadow-soft">
            <Quote size={40} className="text-sited-blue/20 absolute top-6 left-6" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase mb-6">A Note From <span className="text-sited-blue">Our Founder</span></h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  I started Sited because I was tired of seeing businesses get ripped off by agencies charging $5,000–$15,000 for a website that takes months to deliver.
                </p>
                <p>
                  We build professional, high-converting websites for <span className="text-foreground font-bold">$549</span> — and we do it in under 7 days. Not because we cut corners, but because we've perfected the process.
                </p>
                <p>
                  No outsourcing. No templates. No AI-generated garbage. Every site is hand-coded by our in-house team, optimised for speed, SEO, and conversions.
                </p>
                <p className="text-foreground font-semibold">
                  If you're not 100% happy with the final result, you don't pay. Simple as that.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-sited-blue/20 flex items-center justify-center text-sited-blue font-black text-lg">A</div>
                <div>
                  <p className="font-bold text-foreground">Andy</p>
                  <p className="text-sm text-muted-foreground">Founder, Sited</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </ThemeSwitchSection>

      {/* ════════════════════════════════════ */}
      {/* BLOCK 4 — WEBSITE SHOWCASE */}
      {/* ════════════════════════════════════ */}
      <section id="showcase" className="py-16 sm:py-24 bg-card border-y border-border">
        <div className="w-[92%] max-w-[1200px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">Live Client Websites</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase">
              Real Sites. <span className="text-sited-blue">Real Businesses.</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">Every one of these is live right now, built in under 7 days.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clientSites.map((site, i) => (
              <motion.div key={site.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <MacBookCard site={site} index={i} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ */}
      {/* BLOCK 5 — TEXT TESTIMONIALS */}
      {/* ════════════════════════════════════ */}
      <ThemeSwitchSection className="py-16 sm:py-24 bg-background">
        <div className="w-[92%] max-w-[900px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">5-Star Reviews</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase">
              Don't Take Our <span className="text-sited-blue">Word</span> For It
            </h2>
          </motion.div>
          <div className="space-y-0">
            {testimonials.map((t, i) => (
              <TestimonialBlock key={t.author} testimonial={t} index={i} />
            ))}
          </div>
        </div>
      </ThemeSwitchSection>

      {/* ════════════════════════════════════ */}
      {/* BLOCK 6 — LOCK IN PRICE FORM */}
      {/* ════════════════════════════════════ */}
      <section ref={lockInRef} className="py-16 sm:py-24 bg-foreground text-background">
        <div className="w-[92%] max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">Only 4 Spots Left</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase mb-3">
              Start With Just <span className="text-sited-blue">$49</span>
            </h2>
            <p className="text-background/60 mb-2 max-w-md mx-auto">Secure your spot in the February batch. Your $49 deposit is 100% refundable if you're not happy with the result.</p>
            <p className="text-green-400 text-sm font-bold mb-8">Delivered in 7 days · Full refund if not satisfied</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
            className="bg-background text-foreground rounded-2xl p-6 sm:p-8 shadow-elevated">
            <LeadForm id="bottom" ctaText="Lock In My Price" source="landing_lock_in" />
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════ */}
      {/* BLOCK 7 — PROVEN RESULTS */}
      {/* ════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-card border-y border-border">
        <div className="w-[92%] max-w-[1100px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">The Numbers Don't Lie</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase">
              Proven <span className="text-sited-blue">Results</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-background border border-border rounded-2xl p-6 text-center shadow-soft hover:shadow-elevated transition-shadow"
              >
                <stat.icon size={28} className="mx-auto text-sited-blue mb-3" />
                <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-semibold uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ */}
      {/* BLOCK 8 — WHY SO CHEAP */}
      {/* ════════════════════════════════════ */}
      <ThemeSwitchSection className="py-16 sm:py-24 bg-background">
        <div className="w-[92%] max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">Transparency</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase">
              Why Are We <span className="text-sited-blue">So Affordable?</span>
            </h2>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
            {[
              { title: "Zero Overheads", desc: "No fancy office, no receptionist, no boardroom. We're a lean, remote-first team. Every dollar goes into your website." },
              { title: "Perfected Process", desc: "We've built hundreds of sites. Our workflow is dialled in so tight that we deliver in days, not months — without cutting corners." },
              { title: "No Middlemen", desc: "No account managers, no outsourced devs overseas. You talk directly to the people building your site." },
              { title: "Volume, Not Markup", desc: "Agencies charge $10K+ because they need to cover bloated teams. We keep prices low and rely on volume and referrals instead." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 items-start bg-card border border-border rounded-xl p-5 hover:border-sited-blue/30 transition-colors"
              >
                <CheckCircle2 className="text-sited-blue shrink-0 mt-0.5" size={22} />
                <div>
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Final CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
            <Button onClick={scrollToLockIn} size="xl" className="bg-sited-blue hover:bg-sited-blue-hover text-white font-bold gap-2 px-10">
              Lock In $549 Now <ArrowRight size={18} />
            </Button>
          </motion.div>
        </div>
      </ThemeSwitchSection>

      {/* Spacer for sticky footer */}
      <div className="h-20" />

      {/* ════════════════════════════════════ */}
      {/* STICKY FOOTER */}
      {/* ════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-foreground text-background border-t border-border">
        <div className="w-[96%] max-w-5xl mx-auto py-3 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-background/70">February Batch</span>
              <span className="text-xs font-black text-destructive">4 Left</span>
            </div>
            <div className="w-full bg-background/20 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-destructive rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "94.3%" }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              />
            </div>
            <p className="text-[10px] text-background/50 mt-0.5">66/70 complete</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <Button onClick={scrollToLockIn} size="sm" className="bg-sited-blue hover:bg-sited-blue-hover text-white font-bold text-xs sm:text-sm">
              Lock In My Price
            </Button>
            <p className="text-[10px] text-green-400 font-semibold mt-1">No commitment · 48 Hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Testimonial Block (scroll-driven) ─── */
const TestimonialBlock = ({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [60, 0, 0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.4, 0.6, 0.85, 1], [0, 0.6, 1, 1, 0.6, 0]);

  return (
    <motion.div ref={ref} style={{ y, opacity }} className="py-8 sm:py-12 border-b border-border last:border-b-0">
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        <Quote size={32} className="text-sited-blue/30 shrink-0 mt-1" />
        <div className="flex-1">
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-snug tracking-tight">
            "{testimonial.text}"
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => <Star key={i} size={13} className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />)}
            </div>
            <span className="text-sm font-bold text-foreground">{testimonial.author}</span>
            <span className="text-sm text-muted-foreground">· {testimonial.role}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LandingPage;
