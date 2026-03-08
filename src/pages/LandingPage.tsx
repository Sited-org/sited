import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Shield, Clock, Users, Zap, Quote, CheckCircle2, Check, Lock, ChevronRight, CreditCard } from "lucide-react";
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

/* ─── Single Offer Config ─── */
const OFFER = {
  id: "basic-deposit",
  totalPrice: 549,
  usualPrice: 1599,
  savings: 1050,
  lineItems: [
    { label: "Custom Website Design & Development", value: 549, strikethrough: 1599 },
    { label: "SEO Optimisation (Industry-Specific)", value: 0, strikethrough: 200 },
    { label: "Calendar & Email Integration", value: 0, strikethrough: 150 },
    { label: "Lifetime Hosting", value: 0, strikethrough: 150 },
  ],
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

/* ─── Process Steps ─── */
const processSteps = [
  { step: 1, title: "Secure Your Spot", desc: "Lock in your price with a $49 refundable deposit.", icon: Lock },
  { step: 2, title: "Book Discovery Call", desc: "We learn about your business, goals & vision.", icon: Users },
  { step: 3, title: "Receive Site in 7 Days", desc: "Your custom website, designed & built start to finish.", icon: Clock },
  { step: 4, title: "Love It / Make Changes", desc: "Request revisions until you're 100% satisfied.", icon: CheckCircle2 },
  { step: 5, title: "FEEL The Difference", desc: "Launch your site & watch your business grow.", icon: Zap },
];

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
      </div>
    </div>
  );
};

/* ─── Invoice Breakdown (force-light, two-step payment) ─── */
const InvoiceBreakdown = ({
  leadInfo,
  onPaymentSuccess,
}: {
  leadInfo: { name: string; email: string; phone: string };
  onPaymentSuccess: (info: { name: string; email: string; phone: string }) => void;
}) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const subtotal = OFFER.lineItems.reduce((sum, item) => sum + (item.strikethrough || item.value), 0);
  const discount = subtotal - OFFER.totalPrice;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.5 }}
      className="mt-6 space-y-5 force-light"
    >
      {/* Invoice Table */}
      <div className="rounded-2xl border border-gray-100 overflow-hidden bg-[#f5f5f4]">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-end">
          <span className="text-xs font-bold text-green-600">SAVE ${discount.toLocaleString()}</span>
        </div>
        <div className="divide-y divide-gray-100">
          {OFFER.lineItems.map((item, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-700">{item.label}</span>
              <div className="flex items-center gap-3">
                {item.strikethrough && item.strikethrough !== item.value && (
                  <span className="text-xs text-gray-400 line-through">${item.strikethrough.toLocaleString()}</span>
                )}
                <span className={`text-sm font-bold ${item.value === 0 ? "text-green-600" : "text-gray-800"}`}>
                  {item.value === 0 ? "$0" : `$${item.value.toLocaleString()}`}
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* Totals */}
        <div className="border-t border-gray-200 bg-[#efedec] px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Usual Price</span>
            <span className="text-gray-400 line-through">${OFFER.usualPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-600 font-bold">Discount Applied</span>
            <span className="text-green-600 font-bold">-${discount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg pt-1 border-t border-gray-200">
            <span className="font-black text-gray-900">Total</span>
            <span className="font-black text-gray-900">${OFFER.totalPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm pt-1">
            <span className="font-bold" style={{ color: "hsl(202, 74%, 55%)" }}>Due Today (Refundable Deposit)</span>
            <span className="font-black text-lg" style={{ color: "hsl(202, 74%, 55%)" }}>$49</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Remaining (after delivery)</span>
            <span className="text-gray-400">${(OFFER.totalPrice - 49).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Guarantee */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-gray-900 uppercase tracking-wide mb-1">100% Money-Back Guarantee</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Don't love the website? <span className="font-bold text-gray-900">Full $49 refund</span> — no questions asked. Love it? Pay the remaining ${(OFFER.totalPrice - 49).toLocaleString()} within 7 days of delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Two-step: CTA button OR payment form */}
      <AnimatePresence mode="wait">
        {!showPaymentForm ? (
          <motion.div key="cta" initial={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <button
              onClick={() => setShowPaymentForm(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-colors"
              style={{ backgroundColor: "hsl(202, 74%, 69%)" }}
            >
              <Lock size={14} />
              Secure My Website — Pay $49
              <ChevronRight size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.div key="payment" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.4 }}>
            <Elements stripe={stripePromise}>
              <OfferPaymentForm
                tier={OFFER.id}
                tierName="Website Package"
                onSuccess={onPaymentSuccess}
                onCancel={() => setShowPaymentForm(false)}
                prefillName={leadInfo.name}
                prefillEmail={leadInfo.email}
                prefillPhone={leadInfo.phone}
              />
            </Elements>
          </motion.div>
        )}
      </AnimatePresence>
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
            Your deposit has been received. Let's book your discovery call to kick off your project.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowBookingDialog(true)}
            className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-sited-blue hover:bg-sited-blue-hover text-white font-black text-sm uppercase tracking-wider transition-colors"
          >
            Book Your Discovery Call <ArrowRight size={16} />
          </motion.button>
        </motion.div>
        <OnboardingBookingDialog
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          tierName="Website Package"
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
      <section className="relative min-h-screen flex items-start justify-center px-4 pt-12 sm:pt-16 lg:pt-20 pb-8 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-sited-blue/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
        </div>

        {/* Tinted website mockup background — adds visual depth */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.06]">
          <div className="absolute top-[5%] left-[-5%] w-[45%] rounded-2xl overflow-hidden rotate-[-6deg] shadow-2xl">
            <img src={fallbackSites[0].screenshot} alt="" className="w-full h-auto" loading="eager" />
          </div>
          <div className="absolute top-[10%] right-[-8%] w-[40%] rounded-2xl overflow-hidden rotate-[4deg] shadow-2xl">
            <img src={fallbackSites[1].screenshot} alt="" className="w-full h-auto" loading="eager" />
          </div>
          <div className="absolute bottom-[5%] left-[25%] w-[35%] rounded-2xl overflow-hidden rotate-[2deg] shadow-2xl">
            <img src={fallbackSites[2].screenshot} alt="" className="w-full h-auto" loading="eager" />
          </div>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            {/* Left — Copy (wider on desktop) */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-7 lg:pt-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-[0.92]">
                KILLER WEBSITE in<br />
                <span className="text-sited-blue">7 days</span> or less
              </h1>
              <p className="mt-3 text-base sm:text-lg lg:text-xl text-green-500 font-semibold">Just $549</p>
              <p className="mt-3 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-lg">
                Start for just <span className="text-foreground font-bold">$49</span>. Your full website is built in 7 days.
                Love it? Pay the balance and launch. Not satisfied? We'll revise it or <span className="text-foreground font-bold">refund you in full</span>.
              </p>

              {/* Trust badges — desktop only */}
              <div className="hidden lg:flex items-center gap-6 mt-10">
                {[
                  { icon: Shield, text: "Money-Back Guarantee" },
                  { icon: Clock, text: "7 Day Delivery" },
                  { icon: Zap, text: "95+ Speed Score" },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <badge.icon size={16} className="text-sited-blue" />
                    <span className="font-semibold">{badge.text}</span>
                  </div>
                ))}
              </div>

              {/* Desktop-only social proof stat */}
              <div className="hidden lg:flex items-center gap-8 mt-10 pt-8 border-t border-border">
                {[
                  { value: "200+", label: "Websites Built" },
                  { value: "7", label: "Day Average Delivery" },
                  { value: "$549", label: "All-In Package" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl xl:text-3xl font-black text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — Form (narrower, elevated) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="lg:col-span-5">
              <div className={`border border-border rounded-2xl p-5 sm:p-7 shadow-elevated transition-colors duration-500 ${showInvoice ? 'bg-white' : 'bg-[#f5f5f4]'}`}>
                <div className="text-center mb-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-1">Limited Spots</p>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-foreground">Lock In Your <span className="text-sited-blue">Price</span></h2>
                </div>

                {!showInvoice ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="go-name" className="text-foreground text-xs">Name *</Label>
                        <Input id="go-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1 bg-white border-border h-11 text-gray-900 placeholder:text-gray-400" />
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

      {/* ════════════════════════════════════ */}
      {/* HOW IT WORKS — PROCESS STEPS */}
      {/* ════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-card border-y border-border">
        <div className="w-[92%] max-w-[1100px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase">
              Your <span className="text-sited-blue">Journey</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {processSteps.map((step, i) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative bg-background border border-border rounded-2xl p-6 text-center shadow-soft hover:shadow-elevated transition-shadow group">
                {i < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                )}
                <div className="mx-auto w-12 h-12 rounded-full bg-sited-blue/10 flex items-center justify-center mb-3 group-hover:bg-sited-blue/20 transition-colors">
                  <step.icon size={22} className="text-sited-blue" />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-sited-blue font-bold mb-1">Step {step.step}</p>
                <p className="text-sm font-black text-foreground tracking-tight">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
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
            <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">Real Reviews</p>
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
            <span className="text-sm font-bold text-foreground">{testimonial.author}</span>
            <span className="text-sm text-muted-foreground">· {testimonial.role}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LandingPage;
