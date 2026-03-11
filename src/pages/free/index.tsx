import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Shield, Clock, Zap, CheckCircle2, Lock, ChevronRight, Users, Check, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { ThemeSwitchSection } from "@/components/common/ThemeSwitchSection";
import OnboardingBookingInline from "@/components/booking/OnboardingBookingInline";

/* ─── Schema ─── */
const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  businessName: z.string().trim().min(1, "Business name is required").max(200),
  phone: z.string().trim().min(1, "Phone number is required").max(30),
});

/* ─── Offer Config ─── */
const OFFER = {
  id: "free-build",
  totalPrice: 0,
  monthlyPrice: 120,
  lineItems: [
    { label: "Custom Website Design & Development", value: 0, strikethrough: 1599 },
    { label: "7 Core Pages", value: 0, strikethrough: 700 },
    { label: "3 Local SEO Pages", value: 0, strikethrough: 450 },
    { label: "Mobile-First Responsive Build", value: 0, strikethrough: 300 },
    { label: "Credentials & Access Vault", value: 0, strikethrough: 150 },
    { label: "7-Day Delivery", value: 0, strikethrough: 249 },
  ],
};

/* ─── Testimonials ─── */
const testimonials = [
  { text: "Andy & the team at Sited were great in their professionalism & customer service. If you are looking for a website I would definitely recommend reaching out to Andy.", author: "Ben Brown", role: "Owner, Ingle & Brown Conveyancing" },
  { text: "Sited was incredible in their delivery, even with very specific instructions for how I wanted the website to look. All changes were looked at & implemented within days.", author: "Beata Fuller", role: "CEO, Wisdom Education" },
  { text: "Sited transformed our entire digital presence. The website they built doesn't just look incredible — it's become our most effective sales tool.", author: "Sarah Mitchell", role: "Founder, Bloom Floristry" },
  { text: "From day one, Sited treated our project like it was their own. The attention to detail and speed of delivery was beyond what we expected.", author: "Daniel Verwoert", role: "Owner, Hunter Insight" },
];

/* ─── Feature cards ─── */
const features = [
  { icon: "🎨", title: "Full Custom Design", desc: "Not a template. Not a theme. A website built specifically for your brand, your market, and your customers." },
  { icon: "📄", title: "7 Core Pages", desc: "Home, About, Services, Contact, and more — everything your business actually needs to look credible and convert." },
  { icon: "📍", title: "3 Local SEO Pages", desc: "Geo-targeted pages engineered to rank in your area. Your competitors don't have these. You will." },
  { icon: "⚡", title: "7-Day Delivery", desc: "From brief to live in 7 days or less. Not weeks. Not \"we'll get back to you.\" Seven. Days." },
  { icon: "📱", title: "Mobile-First & Responsive", desc: "Built to look and perform perfectly on every screen — from iPhone to desktop." },
  { icon: "🔒", title: "Credentials & Access Vault", desc: "We handle your logins, DNS, hosting setup — everything. You just run your business." },
];

/* ─── FAQ data ─── */
const faqs = [
  { q: "Is this actually free? What's the catch?", a: "Yes, it's actually free. The website build costs you nothing. The $120/month covers hosting, ongoing SEO, and unlimited maintenance after launch. Think of it like getting a car for free — you still pay for fuel and servicing. Except this car gets you customers." },
  { q: "Why are you doing this for free?", a: "Simple. We want 40 clients who we can demonstrate real results for. You get an incredible website with zero risk. We get a growing portfolio and a client relationship. Everyone wins. That's the whole plan." },
  { q: "What if I already have a website?", a: "We rebuild it. If you've never worked with Sited before, you qualify — even if you have an existing site. We'll build something better." },
  { q: "What happens after 40 clients?", a: "This offer closes. Permanently. We're not being dramatic — there are genuinely only 40 spots. When they're gone, the price goes back to normal." },
  { q: "Can I cancel the $120/month whenever I want?", a: "Yes. No contracts, no lock-ins, no awkward phone calls. Cancel anytime. Your website stays live for the billing period you've already paid." },
  { q: "How long does the build actually take?", a: "7 days or less from the moment we receive your assets and brief. Most builds are delivered in 5 days." },
];

/* ─── Process Steps ─── */
const processSteps = [
  { step: 1, title: "We Build It (Free)", desc: "Your full website is designed, built, and launched. You pay nothing.", icon: CheckCircle2 },
  { step: 2, title: "You Go Live", desc: "Your site goes live. You start getting found. Customers start calling.", icon: Zap },
  { step: 3, title: "We Keep It Perfect — $120/mo", desc: "Hosting. SEO. Unlimited edits & changes. We maintain your site monthly.", icon: Shield },
];

const qualifyCards = [
  { title: "You're a brand new Sited client", desc: "Never worked with us before? Perfect. This offer is specifically for first-timers." },
  { title: "You have an active business", desc: "A real business. Running. Trading. You serve customers. That's it." },
  { title: "You love FREE stuff", desc: "We mean, come on. If you saw \"free website\" and kept scrolling, we're genuinely worried about you." },
];

const included = [
  "Managed Hosting & SSL",
  "Ongoing Local SEO Optimisation",
  "UNLIMITED Design Changes & Content Updates",
  "Priority Support",
  "Monthly Performance Reports",
  "Continuous Upgrades",
];

/* ═══════════════════════════════════════════════ */
/* ─── MAIN PAGE ─── */
/* ═══════════════════════════════════════════════ */
const FreeLandingPage = () => {
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", email: "", phone: "", businessName: "" });

  // FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  /* Animated logo */
  const [logoSuffix, setLogoSuffix] = useState<".co" | ".au">(".co");
  useEffect(() => {
    const interval = setInterval(() => setLogoSuffix((s) => (s === ".co" ? ".au" : ".co")), 3000);
    return () => clearInterval(interval);
  }, []);

  /* SEO */
  useEffect(() => {
    document.title = "Free Website Build — Sited | 7 Pages + 3 Local SEO Pages, No Cost";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Sited is building fully custom websites for free — 7 pages + 3 Local SEO pages, delivered in 7 days. Only 40 spots. 21 taken. Claim yours now.");
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) { robots = document.createElement("meta"); robots.setAttribute("name", "robots"); document.head.appendChild(robots); }
    robots.setAttribute("content", "noindex, nofollow");
  }, []);

  const handleFormSubmit = async () => {
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
          name: result.data.name, email: result.data.email, phone: result.data.phone,
          project_type: "website", business_name: result.data.businessName,
          form_data: { source: "free_vsl", business_name: result.data.businessName },
        },
      });
      await supabase.functions.invoke("send-lead-notification", {
        body: {
          name: result.data.name, email: result.data.email, phone: result.data.phone,
          projectType: "website", formData: { source: "free_vsl", business_name: result.data.businessName },
        },
      });
      setCustomerInfo({ name: result.data.name, email: result.data.email, phone: result.data.phone, businessName: result.data.businessName });
      setSubmitted(true);
      toast.success("You're in! Now book your discovery call.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  // If submitted, show booking flow
  if (submitted) {
    return (
      <div className="min-h-screen bg-background px-4 py-12 sm:py-16">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center space-y-4 mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check size={32} className="text-green-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">You're In!</h1>
          <p className="text-muted-foreground">
            Your spot is secured. Now book your free 20-minute discovery call so we can learn about your business.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-lg mx-auto rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden"
        >
          <OnboardingBookingInline
            tierName="Free Website Build"
            customerName={customerInfo.name}
            customerEmail={customerInfo.email}
            customerPhone={customerInfo.phone}
            customerBusinessName={customerInfo.businessName}
            durationOverride={20}
            callLabelOverride="Discovery Call"
            bookingTypeOverride="discovery"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Scroll progress */}
      <motion.div className="fixed top-0 left-0 h-1 bg-sited-blue z-50" style={{ width: progressWidth }} />

      {/* Scarcity bar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-10 flex items-center justify-center bg-foreground">
        <p className="text-xs font-semibold tracking-wide text-gold">
          <span className="inline-block animate-pulse mr-1">🔥</span>
          Only <strong>19</strong> spots remaining out of 40 — This offer disappears when they're gone.
        </p>
      </div>

      {/* ════════════════════════════════════ */}
      {/* HERO + INLINE FORM (matches /go) */}
      {/* ════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-start justify-center px-4 pt-20 sm:pt-24 lg:pt-28 pb-8 overflow-hidden">
        {/* Sited animated logo */}
        <div className="absolute top-12 left-5 sm:left-8 z-20 select-none">
          <span className="text-lg sm:text-xl font-black tracking-tight text-foreground">
            Sited
            <AnimatePresence mode="wait">
              <motion.span
                key={logoSuffix}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className="inline-block"
                style={{ color: logoSuffix === ".co" ? "hsl(var(--gold))" : "hsl(var(--sited-blue))" }}
              >
                {logoSuffix}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>

        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-sited-blue/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            {/* Left — Copy */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-7 lg:pt-8">
              <p className="text-xs uppercase tracking-[0.25em] text-gold font-bold mb-4">FREE WEBSITE OFFER</p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-[0.92]">
                YOUR FULL WEBSITE.
                <br />
                <span className="text-green-500">FOR FREE.</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-lg">
                7 pages + 3 Local SEO pages. Fully custom. Done in <span className="text-foreground font-bold">7 days or less</span>.
                No catch. No tricks. Just results.
              </p>

              {/* Trust badges */}
              <div className="hidden lg:flex items-center gap-6 mt-10">
                {[
                  { icon: Shield, text: "Zero Upfront Cost" },
                  { icon: Clock, text: "7-Day Delivery" },
                  { icon: Zap, text: "10 Pages Total" },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <badge.icon size={16} className="text-sited-blue" />
                    <span className="font-semibold">{badge.text}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="hidden lg:flex items-center gap-8 mt-10 pt-8 border-t border-border">
                {[
                  { value: "200+", label: "Websites Built" },
                  { value: "7", label: "Day Delivery" },
                  { value: "$0", label: "Upfront Cost" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl xl:text-3xl font-black text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — Form Card (matches /go style) */}
            <motion.div ref={formRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="lg:col-span-5">
              <div className="border border-border rounded-2xl p-5 sm:p-7 shadow-elevated bg-[#f5f5f4]">
                <>
                    <div className="text-center mb-5">
                      <p className="text-xs uppercase tracking-[0.25em] font-bold mb-1 text-sited-blue">Limited Spots</p>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-gray-900">Claim Your <span className="text-green-500">Free</span> Website</h2>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="free-name" className="text-gray-700 text-xs font-semibold">Name *</Label>
                          <Input id="free-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1 bg-white border-gray-200 h-11 text-gray-900 placeholder:text-gray-400" />
                          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                        </div>
                        <div>
                          <Label htmlFor="free-business" className="text-gray-700 text-xs font-semibold">Business Name *</Label>
                          <Input id="free-business" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business" className="mt-1 bg-white border-gray-200 h-11 text-gray-900 placeholder:text-gray-400" />
                          {errors.businessName && <p className="text-xs text-destructive mt-1">{errors.businessName}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="free-email" className="text-gray-700 text-xs font-semibold">Email *</Label>
                          <Input id="free-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" className="mt-1 bg-white border-gray-200 h-11 text-gray-900 placeholder:text-gray-400" />
                          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                        </div>
                        <div>
                          <Label htmlFor="free-phone" className="text-gray-700 text-xs font-semibold">Phone *</Label>
                          <Input id="free-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04XX XXX XXX" className="mt-1 bg-white border-gray-200 h-11 text-gray-900 placeholder:text-gray-400" />
                          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                        </div>
                      </div>
                      <Button onClick={handleFormSubmit} disabled={submitting} className="w-full bg-sited-blue hover:bg-sited-blue-hover text-white font-bold text-base h-12 mt-2">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Claim My Free Website <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                      <p className="text-center text-xs text-gray-500">No payment required · 7-day delivery · Only 19 spots left</p>
                    </div>
                  </>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ */}
      {/* VSL VIDEO SECTION */}
      {/* ════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 bg-background">
        <ScrollReveal className="max-w-[860px] mx-auto">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-sited-blue/5 rounded-2xl" />
            <p className="relative text-center text-xs font-bold uppercase tracking-widest text-gold mb-4">
              WATCH THIS FIRST — 3 minutes that could change your business
            </p>
            <div className="relative w-full rounded-xl bg-muted flex items-center justify-center" style={{ aspectRatio: "16/9" }}>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-gold/40 flex items-center justify-center">
                  <Play size={24} className="text-gold ml-1" fill="hsl(var(--gold))" />
                </div>
                <p className="text-sm text-muted-foreground">[ Your VSL video goes here — paste Vimeo or YouTube embed URL ]</p>
              </div>
            </div>
            <p className="relative text-center text-xs text-muted-foreground mt-4">No audio? Click the player and unmute. 🔊</p>
          </div>
        </ScrollReveal>
      </section>

      {/* ════════════════════════════════════ */}
      {/* WHAT YOU GET — cream background */}
      {/* ════════════════════════════════════ */}
      <ThemeSwitchSection className="py-16 sm:py-24 bg-background">
        <div className="w-[92%] max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">Everything Included</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase">
              Nothing <span className="text-sited-blue">Held Back.</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Here's exactly what you're getting — completely free on day one.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 0.08}>
                <div className="rounded-xl border border-border bg-card p-6 shadow-soft hover:shadow-elevated transition-shadow duration-300">
                  <p className="text-2xl mb-2">{f.icon}</p>
                  <h3 className="text-lg font-bold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Value callout */}
          <ScrollReveal>
            <div className="rounded-xl border border-gold/30 bg-card p-8 text-center shadow-elevated">
              <p className="text-lg text-foreground mb-2">💡 Total value of everything above:</p>
              <p className="text-2xl line-through text-muted-foreground mb-1">$3,448+</p>
              <p className="text-5xl font-black text-green-500">$0</p>
            </div>
          </ScrollReveal>
        </div>
      </ThemeSwitchSection>

      {/* ════════════════════════════════════ */}
      {/* HOW IT WORKS — cream background */}
      {/* ════════════════════════════════════ */}
      <ThemeSwitchSection className="py-16 sm:py-24 bg-background">
        <div className="w-[92%] max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">The Process</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase">
              After Your Free Build — <span className="text-sited-blue">Here's How It Works</span>
            </h2>
          </ScrollReveal>

          <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 mb-14">
            {processSteps.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 0.12} className="flex-1 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-sited-blue/10 flex items-center justify-center mb-4">
                  <s.icon size={20} className="text-sited-blue" />
                </div>
                <p className="text-xs font-bold text-sited-blue uppercase tracking-wider mb-2">Step {s.step}</p>
                <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </ScrollReveal>
            ))}
          </div>

          {/* $120/mo breakdown */}
          <ScrollReveal>
            <div className="rounded-xl border border-border bg-card p-8 shadow-soft">
              <h3 className="text-xl font-bold text-center text-foreground mb-6">What's included in $120/month:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {included.map((item) => (
                  <p key={item} className="text-sm text-foreground flex items-center gap-2">
                    <Check size={14} className="text-green-500 flex-shrink-0" /> {item}
                  </p>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-6">Cancel anytime. No contracts. No nasty surprises.</p>
            </div>
          </ScrollReveal>
        </div>
      </ThemeSwitchSection>

      {/* ════════════════════════════════════ */}
      {/* IS THIS YOU? */}
      {/* ════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-gold font-bold mb-3">Qualify</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase">
              Is This <span className="text-gold">You?</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {qualifyCards.map((c, i) => (
              <ScrollReveal key={c.title} delay={i * 0.1}>
                <div className="rounded-xl border border-border bg-card p-6 shadow-soft h-full">
                  <p className="text-sited-blue font-bold text-sm mb-3">✅ {c.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <p className="text-center text-sm text-muted-foreground max-w-3xl mx-auto">
              ⚠️ Warning: This offer may cause an irrational urge to tell every business owner you know about it. Side effects include: more leads, better branding, and finally having a website you're proud of.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════ */}
      {/* TESTIMONIALS — cream background */}
      {/* ════════════════════════════════════ */}
      <ThemeSwitchSection className="py-16 sm:py-24 bg-background">
        <div className="w-[92%] max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">Social Proof</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase">
              What Our Clients <span className="text-sited-blue">Say</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.author} delay={i * 0.1}>
                <div className="rounded-xl border border-border bg-card p-6 shadow-soft h-full">
                  <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">"{t.text}"</p>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </ThemeSwitchSection>

      {/* ════════════════════════════════════ */}
      {/* FAQ — cream background */}
      {/* ════════════════════════════════════ */}
      <ThemeSwitchSection className="py-16 sm:py-24 bg-background">
        <div className="w-[92%] max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase">
              Questions? <span className="text-sited-blue">We've Got You.</span>
            </h2>
          </ScrollReveal>

          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => (
              <ScrollReveal key={i} delay={i * 0.05}>
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-soft">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left"
                  >
                    <span className="text-base font-semibold text-foreground pr-4">{f.q}</span>
                    <ChevronRight
                      size={18}
                      className={`text-sited-blue flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-90" : ""}`}
                    />
                  </button>
                  <div
                    className="transition-all duration-300 overflow-hidden"
                    style={{ maxHeight: openFaq === i ? 300 : 0, opacity: openFaq === i ? 1 : 0 }}
                  >
                    <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </ThemeSwitchSection>

      {/* ════════════════════════════════════ */}
      {/* FOOTER CTA */}
      {/* ════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 bg-foreground text-background">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <p className="text-6xl md:text-8xl font-black text-gold mb-2">19 / 40</p>
            <p className="text-sm uppercase tracking-widest text-background/60 mb-10">Spots Claimed</p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Don't let someone else take your spot.
            </h2>
            <p className="text-base text-background/60 mb-10 max-w-xl mx-auto">
              This is a limited offer — not a countdown timer trick, not manufactured urgency.
              There are genuinely 40 spots. 21 are taken. When the last one goes, this page comes down.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <Button
              onClick={scrollToForm}
              className="bg-sited-blue hover:bg-sited-blue-hover text-white font-bold text-base h-14 px-10 w-full md:w-auto"
            >
              Claim My Free Website Before It's Gone <ArrowRight className="ml-2" />
            </Button>
          </ScrollReveal>
        </div>

        <p className="text-center text-xs text-background/30 mt-16">
          © 2025 Sited. All rights reserved. | hello@sited.co
        </p>
      </section>

      {/* Spacer for sticky footer */}
      <div className="h-20" />

      {/* ════════════════════════════════════ */}
      {/* STICKY FOOTER — Spots Progress */}
      {/* ════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-foreground text-background border-t border-border">
        <div className="w-[96%] max-w-5xl mx-auto py-3 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-background/70">Free Build Spots</span>
              <span className="text-xs font-black text-destructive">19 Left</span>
            </div>
            <div className="w-full bg-background/20 rounded-full h-2 overflow-hidden">
              <motion.div className="h-full bg-destructive rounded-full" initial={{ width: "0%" }} animate={{ width: "52.5%" }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }} />
            </div>
            <p className="text-[10px] text-background/50 mt-0.5">21/40 spots claimed</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <Button onClick={scrollToForm} size="sm" className="bg-sited-blue hover:bg-sited-blue-hover text-white font-bold text-xs sm:text-sm">
              Claim Spot
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeLandingPage;
