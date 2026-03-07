import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Star, ArrowRight, Loader2, Shield, Clock, Users, Zap, Quote, CheckCircle2, ChevronDown, Check, Lock, Crown, ChevronRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useFeaturedTestimonials } from "@/hooks/useTestimonials";
import { ThemeSwitchSection } from "@/components/common/ThemeSwitchSection";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import OfferPaymentForm from "@/components/offer/OfferPaymentForm";
import OnboardingBookingDialog from "@/components/booking/OnboardingBookingDialog";

const stripePromise = loadStripe("pk_live_51JrYQ7KEOhx2BLuXYJRHZBM73eHstHWeshWHlBjKoj5XdOoXCIHbSN9oGaPRNeUNUQaja8o2a4cCoyHdbPSZzfzA00BOHBEapc");

/* ─── Schema ─── */
const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  businessName: z.string().trim().min(1, "Business name is required").max(200),
  phone: z.string().trim().min(1, "Phone number is required").max(30),
});

/* ─── Tier Config ─── */
type TierConfig = {
  id: string;
  name: string;
  tagline: string;
  totalPrice: number;
  usualPrice: number;
  savings: number;
  icon: typeof Zap;
  features: string[];
  lineItems: { label: string; value: number; strikethrough?: number }[];
};

const TIERS: Record<string, TierConfig> = {
  "basic-deposit": {
    id: "basic-deposit",
    name: "Blue",
    tagline: "Built for the basics",
    totalPrice: 549,
    usualPrice: 1399,
    savings: 850,
    icon: Zap,
    features: ["Professional website", "High-converting funnel", "Lead capture forms", "Lifetime hosting", "Industry-specific SEO", "Calendar integration", "Email integration"],
    lineItems: [
      { label: "Custom Website Design & Development", value: 549, strikethrough: 899 },
      { label: "SEO Optimisation (Industry-Specific)", value: 0, strikethrough: 200 },
      { label: "Calendar & Email Integration", value: 0, strikethrough: 150 },
      { label: "Lifetime Hosting", value: 0, strikethrough: 150 },
    ],
  },
  gold: {
    id: "gold",
    name: "Gold",
    tagline: "Made for the everyday business",
    totalPrice: 649,
    usualPrice: 1699,
    savings: 1050,
    icon: Star,
    features: ["Everything in Blue", "Admin dashboard", "Lead management CRM", "Extra SEO infrastructure", "Payment integration", "Calendar integration", "Email integration"],
    lineItems: [
      { label: "Custom Website Design & Development", value: 549, strikethrough: 899 },
      { label: "Admin Dashboard & Lead CRM", value: 100, strikethrough: 400 },
      { label: "Advanced SEO Infrastructure", value: 0, strikethrough: 200 },
      { label: "Payment, Calendar & Email Integration", value: 0, strikethrough: 200 },
    ],
  },
  platinum: {
    id: "platinum",
    name: "Platinum",
    tagline: "Built for those ready to dominate",
    totalPrice: 1199,
    usualPrice: 2559,
    savings: 1360,
    icon: Crown,
    features: ["Everything in Gold", "Client portal", "Built-in AI chatbot", "Premium SEO infrastructure", "Any custom integrations", "Priority support & delivery"],
    lineItems: [
      { label: "Custom Website Design & Development", value: 549, strikethrough: 899 },
      { label: "Admin Dashboard & Lead CRM", value: 100, strikethrough: 400 },
      { label: "Client Portal & AI Chatbot", value: 350, strikethrough: 660 },
      { label: "Premium SEO & Custom Integrations", value: 200, strikethrough: 400 },
      { label: "Priority Support & Delivery", value: 0, strikethrough: 200 },
    ],
  },
};

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

/* ─── Stars Row ─── */
const StarsRow = () => (
  <div className="flex items-center gap-1">
    {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />)}
    <span className="text-sm font-bold text-foreground ml-2">5.0 on Google</span>
  </div>
);

/* ─── MacBook Card ─── */
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
          <img src={site.screenshot} alt={`${site.name} website`} className="w-full h-auto block" loading="lazy"
            onLoad={(e) => { const img = e.currentTarget; setScrollDistance(Math.max(0, img.offsetHeight - viewportH)); setLoaded(true); }} />
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
      if (start >= value) { setCount(value); clearInterval(interval); } else setCount(start);
    }, 30);
    return () => clearInterval(interval);
  }, [isInView, value]);
  return <span ref={ref}>{count}{suffix}</span>;
};

/* ─── Invoice Breakdown ─── */
const InvoiceBreakdown = ({
  tier,
  onChangeTier,
  leadInfo,
  onPaymentSuccess,
}: {
  tier: TierConfig;
  onChangeTier: (id: string) => void;
  leadInfo: { name: string; email: string; phone: string };
  onPaymentSuccess: (info: { name: string; email: string; phone: string }) => void;
}) => {
  const subtotal = tier.lineItems.reduce((sum, item) => sum + (item.strikethrough || item.value), 0);
  const discount = subtotal - tier.totalPrice;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.5 }}
      className="mt-6 space-y-5"
    >
      {/* Tier Selector Tabs */}
      <div className="flex gap-2">
        {Object.values(TIERS).map((t) => {
          const isActive = t.id === tier.id;
          const TIcon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onChangeTier(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${
                isActive
                  ? t.id === "platinum"
                    ? "border-gray-400 bg-gray-200/50 dark:bg-gray-600/30 dark:border-gray-400 text-foreground"
                    : t.id === "gold"
                      ? "border-gold/50 bg-gold/10 text-foreground"
                      : "border-sited-blue/50 bg-sited-blue/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
              }`}
            >
              <TIcon size={14} className={
                isActive
                  ? t.id === "platinum" ? "text-gray-500 dark:text-gray-300" : t.id === "gold" ? "text-gold" : "text-sited-blue"
                  : "text-muted-foreground"
              } />
              {t.name}
            </button>
          );
        })}
      </div>

      {/* Invoice Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Invoice — {tier.name} Package</span>
          <span className="text-xs font-bold text-green-500">SAVE ${tier.savings.toLocaleString()}</span>
        </div>
        <div className="divide-y divide-border">
          {tier.lineItems.map((item, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-foreground">{item.label}</span>
              <div className="flex items-center gap-3">
                {item.strikethrough && item.strikethrough !== item.value && (
                  <span className="text-xs text-muted-foreground line-through">${item.strikethrough.toLocaleString()}</span>
                )}
                <span className={`text-sm font-bold ${item.value === 0 ? "text-green-500" : "text-foreground"}`}>
                  {item.value === 0 ? "FREE" : `$${item.value.toLocaleString()}`}
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* Totals */}
        <div className="border-t-2 border-border bg-muted/30 px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Usual Price</span>
            <span className="text-muted-foreground line-through">${tier.usualPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-500 font-bold">Discount Applied</span>
            <span className="text-green-500 font-bold">-${discount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg pt-1 border-t border-border">
            <span className="font-black text-foreground">Total</span>
            <span className="font-black text-foreground">${tier.totalPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm pt-1">
            <span className="font-bold text-sited-blue">Due Today (Refundable Deposit)</span>
            <span className="font-black text-sited-blue text-lg">$49</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Remaining (after delivery)</span>
            <span className="text-muted-foreground">${(tier.totalPrice - 49).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Guarantee */}
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-foreground uppercase tracking-wide mb-1">100% Money-Back Guarantee</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Don't love the website? <span className="font-bold text-foreground">Full $49 refund</span> — no questions asked. Love it? Pay the remaining ${(tier.totalPrice - 49).toLocaleString()} within 7 days of delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Stripe Payment Form */}
      <Elements stripe={stripePromise}>
        <OfferPaymentForm
          tier={tier.id}
          tierName={tier.name}
          onSuccess={onPaymentSuccess}
          onCancel={() => {}} // No cancel in this flow
          prefillName={leadInfo.name}
          prefillEmail={leadInfo.email}
          prefillPhone={leadInfo.phone}
        />
      </Elements>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════ */
/* ─── MAIN PAGE ─── */
/* ═══════════════════════════════════════════════ */
const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const { data: featuredTestimonials } = useFeaturedTestimonials();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Flow state
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedTier, setSelectedTier] = useState("basic-deposit");
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", email: "", phone: "" });

  const invoiceRef = useRef<HTMLDivElement>(null);

  const clientSites = featuredTestimonials && featuredTestimonials.length > 0
    ? featuredTestimonials.filter(t => t.website_url).map(t => ({
        name: t.business_name,
        url: t.website_url!,
        screenshot: `https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/${t.website_url!.replace(/https?:\/\//, '').replace(/\//g, '').replace(/\./g, '')}-full.png`,
      }))
    : fallbackSites;

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
          form_data: { source: "landing_go", business_name: result.data.businessName },
        },
      });
      await supabase.functions.invoke("send-lead-notification", {
        body: {
          name: result.data.name, email: result.data.email, phone: result.data.phone,
          projectType: "website", formData: { source: "landing_go", business_name: result.data.businessName },
        },
      });
      sessionStorage.setItem("lead_captured", "true");
      sessionStorage.setItem("lead_name", result.data.name);
      sessionStorage.setItem("lead_email", result.data.email);
      sessionStorage.setItem("lead_phone", result.data.phone);
      sessionStorage.setItem("lead_business_name", result.data.businessName);
      setCustomerInfo({ name: result.data.name, email: result.data.email, phone: result.data.phone });
      setShowInvoice(true);
      // Scroll to invoice after a beat
      setTimeout(() => invoiceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const handlePaymentSuccess = (info: { name: string; email: string; phone: string }) => {
    setCustomerInfo(info);
    setPaymentComplete(true);
    setShowBookingDialog(true);
  };

  // Payment complete screen
  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check size={40} className="text-green-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">You're In!</h1>
          <p className="text-muted-foreground text-lg">
            Your deposit has been received. Let's book your onboarding call to kick off your{" "}
            <span className="font-bold text-foreground">{TIERS[selectedTier].name}</span> project.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowBookingDialog(true)}
            className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-sited-blue hover:bg-sited-blue-hover text-white font-black text-sm uppercase tracking-wider transition-colors"
          >
            Book Your Onboarding Call <ArrowRight size={16} />
          </motion.button>
        </motion.div>
        <OnboardingBookingDialog
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          tierName={TIERS[selectedTier].name}
          customerName={customerInfo.name}
          customerEmail={customerInfo.email}
          customerPhone={customerInfo.phone}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* ── Scroll progress bar ── */}
      <motion.div className="fixed top-0 left-0 h-1 bg-sited-blue z-50" style={{ width: progressWidth }} />

      {/* ════════════════════════════════════ */}
      {/* HERO + INLINE FORM */}
      {/* ════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-start justify-center px-4 pt-12 sm:pt-16 pb-8 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-sited-blue/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left — Copy */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-2 mb-5">
                <StarsRow />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-[0.95]">
                Your Website<br />
                <span className="text-sited-blue">Built in 7 Days</span><br />
                or Less.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-md">
                Professional, high-converting websites starting from just a <span className="text-foreground font-bold">$49 refundable deposit</span>. Delivered in 7 days — if you're not happy, <span className="text-foreground font-bold">we refund the $49</span>. No risk.
              </p>
              <p className="mt-3 text-sm text-green-600 dark:text-green-400 font-semibold">No commitment · 48 Hours to decide · 100% money-back guarantee</p>

              {/* Trust badges — desktop only */}
              <div className="hidden lg:flex items-center gap-4 mt-8">
                {[
                  { icon: Shield, text: "Money-Back Guarantee" },
                  { icon: Clock, text: "7 Day Delivery" },
                  { icon: Zap, text: "95+ Speed Score" },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <badge.icon size={14} className="text-sited-blue" />
                    <span className="font-semibold">{badge.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — Form */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-elevated">
                <div className="text-center mb-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-1">Limited Spots</p>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Lock In Your <span className="text-sited-blue">Price</span></h2>
                </div>

                {!showInvoice ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="go-name" className="text-foreground text-xs">Name *</Label>
                        <Input id="go-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1 bg-background border-border h-11" />
                        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <Label htmlFor="go-business" className="text-foreground text-xs">Business Name *</Label>
                        <Input id="go-business" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business" className="mt-1 bg-background border-border h-11" />
                        {errors.businessName && <p className="text-xs text-destructive mt-1">{errors.businessName}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="go-email" className="text-foreground text-xs">Email *</Label>
                        <Input id="go-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" className="mt-1 bg-background border-border h-11" />
                        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="go-phone" className="text-foreground text-xs">Phone *</Label>
                        <Input id="go-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04XX XXX XXX" className="mt-1 bg-background border-border h-11" />
                        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                      </div>
                    </div>
                    <Button onClick={handleFormSubmit} disabled={submitting} className="w-full bg-sited-blue hover:bg-sited-blue-hover text-white font-bold text-base h-12 mt-2">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Lock In My Price <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">$49 refundable deposit · Delivered in 7 days · No obligation</p>
                  </div>
                ) : (
                  <div ref={invoiceRef}>
                    <InvoiceBreakdown
                      tier={TIERS[selectedTier]}
                      onChangeTier={setSelectedTier}
                      leadInfo={customerInfo}
                      onPaymentSuccess={handlePaymentSuccess}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ */}
      {/* WEBSITE SHOWCASE */}
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
      {/* TEXT TESTIMONIALS */}
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
      {/* PROVEN RESULTS */}
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
              <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-background border border-border rounded-2xl p-6 text-center shadow-soft hover:shadow-elevated transition-shadow">
                <stat.icon size={28} className="mx-auto text-sited-blue mb-3" />
                <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-semibold uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ */}
      {/* WHY SO AFFORDABLE */}
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
              <motion.div key={item.title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex gap-4 items-start bg-card border border-border rounded-xl p-5 hover:border-sited-blue/30 transition-colors">
                <CheckCircle2 className="text-sited-blue shrink-0 mt-0.5" size={22} />
                <div>
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
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
              <span className="text-xs font-bold uppercase tracking-wider text-background/70">This Month</span>
              <span className="text-xs font-black text-destructive">4 Left</span>
            </div>
            <div className="w-full bg-background/20 rounded-full h-2 overflow-hidden">
              <motion.div className="h-full bg-destructive rounded-full" initial={{ width: "0%" }} animate={{ width: "94.3%" }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }} />
            </div>
            <p className="text-[10px] text-background/50 mt-0.5">66/70 complete</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <Button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} size="sm" className="bg-sited-blue hover:bg-sited-blue-hover text-white font-bold text-xs sm:text-sm">
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
