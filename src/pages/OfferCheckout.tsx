import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Shield, Zap, Star, Crown, ChevronRight, Flame, TrendingUp, Bot, Globe, BarChart3, Users, Lock, Sparkles } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useOfferContent } from "@/hooks/useOfferContent";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useIsMobile } from "@/hooks/use-mobile";
import OfferPaymentForm from "@/components/offer/OfferPaymentForm";
import FeatureWithInfo from "@/components/offer/FeatureInfo";
import OfferUpgradeCard from "@/components/offer/OfferUpgradeCard";
import SocialProofSection from "@/components/offer/SocialProofSection";
import OnboardingBookingDialog from "@/components/booking/OnboardingBookingDialog";

const stripePromise = loadStripe("pk_live_51JrYQ7KEOhx2BLuXYJRHZBM73eHstHWeshWHlBjKoj5XdOoXCIHbSN9oGaPRNeUNUQaja8o2a4cCoyHdbPSZzfzA00BOHBEapc");

export type TierConfig = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  totalPrice: string;
  usualPrice: string;
  savings: string;
  icon: typeof Zap;
  features: string[];
  accentClass: string;
  badgeClass: string;
  popular?: boolean;
};

const TIERS: Record<string, TierConfig> = {
  "basic-deposit": {
    id: "basic-deposit",
    name: "Blue",
    tagline: "Built for the basics",
    price: "$49",
    totalPrice: "$549",
    usualPrice: "$1,399",
    savings: "$850",
    icon: Zap,
    features: [
      "Professional website",
      "High-converting funnel",
      "Lead capture forms",
      "Lifetime hosting",
      "Industry-specific SEO",
      "Calendar integration",
      "Email integration",
    ],
    accentClass: "border-sited-blue/40 bg-sited-blue/5",
    badgeClass: "bg-sited-blue text-white",
  },
  gold: {
    id: "gold",
    name: "Gold",
    tagline: "Made for the everyday business",
    price: "$49",
    totalPrice: "$649",
    usualPrice: "$1,699",
    savings: "$1,050",
    icon: Star,
    features: [
      "Everything in Blue",
      "Admin dashboard",
      "Lead management CRM",
      "Extra SEO infrastructure",
      "Payment integration",
      "Calendar integration",
      "Email integration",
    ],
    accentClass: "border-gold/40 bg-gold/5",
    badgeClass: "bg-gold text-foreground",
  },
  platinum: {
    id: "platinum",
    name: "Platinum",
    tagline: "Built for those ready to dominate their market",
    price: "$49",
    totalPrice: "$1,199",
    usualPrice: "$2,559",
    savings: "$1,360",
    icon: Crown,
    features: [
      "Everything in Gold",
      "Client portal",
      "Built-in AI chatbot",
      "Premium SEO infrastructure",
      "Any custom integrations",
      "Priority support & delivery",
    ],
    accentClass: "border-gray-300/50 dark:border-gray-400/30 bg-gradient-to-br from-gray-100/80 via-white/90 to-gray-200/60 dark:from-gray-700/30 dark:via-gray-600/20 dark:to-gray-500/10",
    badgeClass: "bg-gradient-to-r from-gray-300 via-white to-gray-300 dark:from-gray-500 dark:via-gray-300 dark:to-gray-500 text-gray-900",
    popular: true,
  },
};

const UPGRADE_BENEFITS = [
  {
    icon: BarChart3,
    title: "Admin Dashboard & CRM",
    description: "See every lead, every sale, every interaction in one powerful dashboard. Businesses using a CRM see 29% more sales on average.",
    tiers: ["gold", "platinum"],
  },
  {
    icon: Users,
    title: "Client Portal",
    description: "Give your clients their own login to track progress, make requests, and manage payments. Builds trust and reduces back-and-forth emails by 80%.",
    tiers: ["platinum"],
  },
  {
    icon: Bot,
    title: "Built-in AI Chatbot",
    description: "Your website works for you 24/7. Answer questions, capture leads, and book appointments — even while you sleep.",
    tiers: ["platinum"],
  },
  {
    icon: TrendingUp,
    title: "Premium SEO Infrastructure",
    description: "Dominate search results across your entire service area with advanced technical SEO, local landing pages, and content strategy.",
    tiers: ["platinum"],
  },
  {
    icon: Globe,
    title: "Any Custom Integrations",
    description: "Connect any tool, any platform, any API. From Stripe subscriptions to custom webhooks — your website becomes the centre of your tech stack.",
    tiers: ["platinum"],
  },
];

/* Silver shimmer for Platinum card */
const silverShimmer = "bg-[linear-gradient(110deg,hsl(0_0%_85%)_0%,hsl(0_0%_95%)_45%,hsl(0_0%_100%)_50%,hsl(0_0%_95%)_55%,hsl(0_0%_85%)_100%)] dark:bg-[linear-gradient(110deg,hsl(0_0%_35%)_0%,hsl(0_0%_50%)_45%,hsl(0_0%_65%)_50%,hsl(0_0%_50%)_55%,hsl(0_0%_35%)_100%)]";

const Offer = () => {
  const navigate = useNavigate();
  const { content, loading } = useOfferContent();
  const isMobile = useIsMobile();
  const [selectedTier, setSelectedTier] = useState<string>("basic-deposit");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    const complete = sessionStorage.getItem("questionnaire_complete");
    if (!complete) {
      navigate("/contact/offers", { replace: true });
    }
  }, [navigate]);

  usePageSEO({
    title: "Secure Your Website | Sited — $49 Deposit",
    description: "Get a fully custom website with just a $49 refundable deposit. Choose Blue, Gold, or Platinum.",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sited-blue border-t-transparent" />
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg text-center space-y-6"
        >
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
            Book Your Onboarding Call
            <ArrowRight size={16} />
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

  const activeTier = TIERS[selectedTier];
  const Icon = activeTier.icon;
  const isPlatinum = selectedTier === "platinum";
  const isGold = selectedTier === "gold";

  return (
    <div className="min-h-screen bg-background">
      {/* Urgency Banner */}
      <div className="bg-foreground text-background text-center py-3 px-4">
        <p className="text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2">
          <Flame size={16} className="animate-pulse text-gold" />
          {content.urgency_text || "LIMITED TIME — SAVE UP TO $1,360"}
          <Flame size={16} className="animate-pulse text-gold" />
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-foreground uppercase leading-[0.9]">
            YOUR WEBSITE,<br />
            <span className="text-sited-blue">IN 7 DAYS</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            We'll build your website in <span className="font-black text-foreground">7 Days</span> — If you don't love it, we'll refund your deposit! <span className="font-black text-foreground">No Risk, No Lock-In!</span>
          </p>
        </motion.div>

        {/* ═══════════════════════════════════════════
            MOBILE LAYOUT — Linear Sales Funnel
        ═══════════════════════════════════════════ */}
        {isMobile ? (
          <>
            {/* Step 1: Blue Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border-2 border-sited-blue/40 bg-sited-blue/5 p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-sited-blue/10">
                  <Zap size={24} className="text-sited-blue" />
                </div>
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-sited-blue text-white text-[10px] font-black uppercase tracking-wider mb-1">
                    Recommended
                  </span>
                  <h2 className="text-2xl font-black text-foreground">Blue</h2>
                  <p className="text-xs text-muted-foreground">{TIERS["basic-deposit"].tagline}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-foreground">$49</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Refundable Deposit</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-black text-foreground">Total: $549</span>
                  <span className="text-sm text-muted-foreground line-through">$1,399</span>
                </div>
                <p className="text-xs font-black text-green-500 mt-1">SAVE $850</p>
              </div>

              {/* Features */}
              <div className="space-y-2.5 mb-6">
                {TIERS["basic-deposit"].features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check size={16} className="flex-shrink-0 mt-0.5 text-sited-blue" />
                    <FeatureWithInfo feature={f} />
                  </div>
                ))}
              </div>

              {/* Guarantee */}
              <div className="rounded-xl border border-sited-blue/30 bg-sited-blue/5 p-4 mb-6">
                <div className="flex items-start gap-2.5">
                  <Shield size={20} className="text-sited-blue flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-foreground uppercase tracking-wide mb-1">100% Money-Back Guarantee</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-black text-foreground">Don't love it?</span> Full $49 refund — no questions asked.{" "}
                      <span className="font-black text-foreground">Love it?</span> Pay the remaining within 7 days of delivery.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              {!showPayment && (
                <motion.button
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedTier("basic-deposit"); setShowPayment(true); }}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-5 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg bg-sited-blue hover:bg-sited-blue-hover text-white shadow-sited-blue/30"
                >
                  Secure Your Website — $49
                  <ArrowRight size={16} />
                </motion.button>
              )}

              <AnimatePresence>
                {showPayment && selectedTier === "basic-deposit" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Elements stripe={stripePromise}>
                      <OfferPaymentForm
                        tier={selectedTier}
                        tierName="Blue"
                        onSuccess={(info) => {
                          setCustomerInfo(info);
                          setPaymentComplete(true);
                          setShowBookingDialog(true);
                        }}
                        onCancel={() => setShowPayment(false)}
                      />
                    </Elements>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Step 2: Upsell Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <div className="rounded-xl border border-dashed border-gold/40 bg-gold/5 p-4 text-center mb-4">
                <p className="text-sm font-black text-foreground mb-1">
                  Based on your answers, this may be better for you
                </p>
                <p className="text-xs text-muted-foreground">
                  Businesses like yours see <span className="font-bold text-foreground">3-5x more leads</span> & save <span className="font-bold text-foreground">35% more time</span> with these packages
                </p>
              </div>

              {/* Gold Expandable */}
              <div className="space-y-3">
                {/* Gold Card */}
                <div className="rounded-xl border border-gold/40 bg-gold/5 overflow-hidden">
                  <button
                    onClick={() => { setSelectedTier(selectedTier === "gold" ? "basic-deposit" : "gold"); setShowPayment(false); }}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className="p-1.5 rounded-lg bg-gold/20">
                      <Star size={18} className="text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-black text-foreground">Gold</h3>
                      <p className="text-xs text-muted-foreground">{TIERS.gold.tagline}</p>
                    </div>
                    <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-300 ${selectedTier === "gold" ? "rotate-90" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {selectedTier === "gold" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gold/20"
                      >
                        <div className="p-4 space-y-4">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-foreground">$49</span>
                              <span className="text-xs font-bold text-muted-foreground uppercase">Refundable Deposit</span>
                            </div>
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className="text-base font-black text-foreground">Total: {TIERS.gold.totalPrice}</span>
                              <span className="text-sm text-muted-foreground line-through">{TIERS.gold.usualPrice}</span>
                            </div>
                            <p className="text-xs font-black text-green-500 mt-1">SAVE {TIERS.gold.savings}</p>
                          </div>

                          <div className="space-y-2">
                            {TIERS.gold.features.map((f, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                                <Check size={14} className="flex-shrink-0 mt-0.5 text-gold" />
                                <FeatureWithInfo feature={f} />
                              </div>
                            ))}
                          </div>

                          <div className="rounded-lg border border-sited-blue/30 bg-sited-blue/5 p-3">
                            <div className="flex items-start gap-2">
                              <Shield size={16} className="text-sited-blue flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-muted-foreground">
                                <span className="font-black text-foreground">Don't love it?</span> Full $49 refund. <span className="font-black text-foreground">Love it?</span> Pay the rest within 7 days.
                              </p>
                            </div>
                          </div>

                          {!showPayment && (
                            <motion.button
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setShowPayment(true)}
                              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg bg-sited-blue hover:bg-sited-blue-hover text-white shadow-sited-blue/30"
                            >
                              Secure Your Website — $49
                              <ArrowRight size={16} />
                            </motion.button>
                          )}

                          <AnimatePresence>
                            {showPayment && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                <Elements stripe={stripePromise}>
                                  <OfferPaymentForm
                                    tier="gold"
                                    tierName="Gold"
                                    onSuccess={(info) => { setCustomerInfo(info); setPaymentComplete(true); setShowBookingDialog(true); }}
                                    onCancel={() => setShowPayment(false)}
                                  />
                                </Elements>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Platinum Card */}
                <div className="rounded-xl border border-gray-300/50 dark:border-gray-400/30 bg-gradient-to-br from-gray-100/80 via-white/90 to-gray-200/60 dark:from-gray-700/20 dark:via-gray-600/10 dark:to-gray-500/5 overflow-hidden">
                  <button
                    onClick={() => { setSelectedTier(selectedTier === "platinum" ? "basic-deposit" : "platinum"); setShowPayment(false); }}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className="p-1.5 rounded-lg bg-gray-300/30 dark:bg-gray-500/20">
                      <Crown size={18} className="text-gray-500 dark:text-gray-300" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-foreground">Platinum</h3>
                        <Sparkles size={12} className="text-gray-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">{TIERS.platinum.tagline}</p>
                    </div>
                    <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-300 ${selectedTier === "platinum" ? "rotate-90" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {selectedTier === "platinum" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-300/30 dark:border-gray-500/20"
                      >
                        <div className="p-4 space-y-4">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-foreground">$49</span>
                              <span className="text-xs font-bold text-muted-foreground uppercase">Refundable Deposit</span>
                            </div>
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className="text-base font-black text-foreground">Total: {TIERS.platinum.totalPrice}</span>
                              <span className="text-sm text-muted-foreground line-through">{TIERS.platinum.usualPrice}</span>
                            </div>
                            <p className="text-xs font-black text-green-500 mt-1">SAVE {TIERS.platinum.savings}</p>
                          </div>

                          <div className="space-y-2">
                            {TIERS.platinum.features.map((f, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                                <Check size={14} className="flex-shrink-0 mt-0.5 text-gray-500 dark:text-gray-300" />
                                <FeatureWithInfo feature={f} />
                              </div>
                            ))}
                          </div>

                          <div className="rounded-lg border border-sited-blue/30 bg-sited-blue/5 p-3">
                            <div className="flex items-start gap-2">
                              <Shield size={16} className="text-sited-blue flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-muted-foreground">
                                <span className="font-black text-foreground">Don't love it?</span> Full $49 refund. <span className="font-black text-foreground">Love it?</span> Pay the rest within 7 days.
                              </p>
                            </div>
                          </div>

                          {!showPayment && (
                            <motion.button
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setShowPayment(true)}
                              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg bg-sited-blue hover:bg-sited-blue-hover text-white shadow-sited-blue/30"
                            >
                              Secure Your Website — $49
                              <ArrowRight size={16} />
                            </motion.button>
                          )}

                          <AnimatePresence>
                            {showPayment && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                <Elements stripe={stripePromise}>
                                  <OfferPaymentForm
                                    tier="platinum"
                                    tierName="Platinum"
                                    onSuccess={(info) => { setCustomerInfo(info); setPaymentComplete(true); setShowBookingDialog(true); }}
                                    onCancel={() => setShowPayment(false)}
                                  />
                                </Elements>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Bottom guarantee reminder */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Shield size={16} className="text-sited-blue" />
                <span className="font-bold">Don't love it?</span> Full $49 refund — no questions asked.
              </div>
            </div>

            <SocialProofSection />
          </>
        ) : (
          /* ═══════════════════════════════════════════
              DESKTOP LAYOUT — Original with tier grid
          ═══════════════════════════════════════════ */
          <>
            {/* Tier Selector Cards */}
            <div className="grid grid-cols-3 gap-5 mb-10">
              {Object.values(TIERS).map((tier, idx) => {
                const TIcon = tier.icon;
                const isActive = selectedTier === tier.id;
                const isTierPlatinum = tier.id === "platinum";
                const isTierGold = tier.id === "gold";

                return (
                  <motion.div
                    key={tier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => { setSelectedTier(tier.id); setShowPayment(false); }}
                    className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 ${
                      isActive
                        ? isTierPlatinum
                          ? "border-gray-400 dark:border-gray-300 shadow-lg shadow-gray-400/20 dark:shadow-gray-300/10 scale-[1.02] " + activeTier.accentClass
                          : `${tier.accentClass} shadow-lg scale-[1.02]`
                        : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-md"
                    }`}
                  >
                    {isTierPlatinum && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg ${silverShimmer} text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-500`}>
                          <Sparkles size={10} />
                          Premium
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`p-2 rounded-lg ${
                        isTierPlatinum ? "bg-gray-300/30 dark:bg-gray-500/20" :
                        isTierGold ? "bg-gold/20" : "bg-sited-blue/10"
                      }`}>
                        <TIcon size={20} className={
                          isTierPlatinum ? "text-gray-500 dark:text-gray-300" :
                          isTierGold ? "text-gold" : "text-sited-blue"
                        } />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-foreground">{tier.name}</h3>
                        <p className="text-xs text-muted-foreground">{tier.tagline}</p>
                      </div>
                    </div>

                    {isActive ? (
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl sm:text-4xl font-black text-foreground">$49</span>
                          <span className="text-xs font-bold text-muted-foreground uppercase">Deposit</span>
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-base font-black text-foreground">Total: {tier.totalPrice}</span>
                          <span className="text-sm text-muted-foreground line-through">{tier.usualPrice}</span>
                        </div>
                        <p className="text-xs font-black text-green-500 mt-1">SAVE {tier.savings}</p>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <p className="text-sm font-bold text-muted-foreground">Select to see pricing</p>
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      {tier.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check size={14} className={`flex-shrink-0 mt-0.5 ${
                            isTierPlatinum ? "text-gray-500 dark:text-gray-300" :
                            isTierGold ? "text-gold" : "text-sited-blue"
                          }`} />
                          <span>{f}</span>
                        </div>
                      ))}
                      {tier.features.length > 4 && (
                        <p className="text-xs text-muted-foreground pl-5 font-medium">
                          +{tier.features.length - 4} more included
                        </p>
                      )}
                    </div>

                    <div className={`w-full py-2.5 rounded-lg text-center text-xs font-black uppercase tracking-wider transition-colors ${
                      isActive
                        ? isTierPlatinum
                          ? `${silverShimmer} text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-500`
                          : isTierGold
                            ? "bg-gold text-foreground"
                            : "bg-sited-blue text-white"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {isActive ? "Selected" : "Select Plan"}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Selected Tier Detail */}
            <motion.div
              key={selectedTier}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl border-2 p-8 ${
                isPlatinum
                  ? "border-gray-400/50 dark:border-gray-300/30 bg-gradient-to-br from-gray-100/80 via-white/90 to-gray-200/60 dark:from-gray-700/20 dark:via-gray-600/10 dark:to-gray-500/5"
                  : activeTier.accentClass
              }`}
            >
              <div className="flex flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    isPlatinum ? "bg-gray-300/30 dark:bg-gray-500/20" :
                    isGold ? "bg-gold/20" : "bg-sited-blue/10"
                  }`}>
                    <Icon size={28} className={
                      isPlatinum ? "text-gray-500 dark:text-gray-300" :
                      isGold ? "text-gold" : "text-sited-blue"
                    } />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl font-black text-foreground">{activeTier.name}</h2>
                      {activeTier.popular && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${silverShimmer} text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-500`}>
                          Best Value
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{activeTier.tagline}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-2 justify-end">
                    <span className="text-5xl font-black text-foreground">$49</span>
                    <span className="text-sm font-bold text-muted-foreground uppercase">Deposit</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2 justify-end">
                    <span className="text-xl font-black text-foreground">Total: {activeTier.totalPrice}</span>
                    <span className="text-base text-muted-foreground line-through">{activeTier.usualPrice}</span>
                  </div>
                  <p className="text-sm font-black text-green-500">YOU SAVE {activeTier.savings}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {activeTier.features.map((feature, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 text-sm text-foreground p-3 rounded-xl border transition-colors ${
                      isPlatinum
                        ? "bg-gray-200/30 dark:bg-gray-600/10 border-gray-300/30 dark:border-gray-500/20"
                        : isGold
                          ? "bg-gold/5 border-gold/20"
                          : "bg-sited-blue/5 border-sited-blue/20"
                    }`}
                  >
                    <Check size={16} className={`flex-shrink-0 mt-0.5 ${
                      isPlatinum ? "text-gray-500 dark:text-gray-300" :
                      isGold ? "text-gold" : "text-sited-blue"
                    }`} />
                    <FeatureWithInfo feature={feature} />
                  </div>
                ))}
              </div>

              {/* Refund Guarantee */}
              <div className="mb-6 rounded-xl border-2 border-sited-blue/30 bg-sited-blue/5 dark:bg-sited-blue/10 p-5">
                <div className="flex items-start gap-3">
                  <Shield size={24} className="text-sited-blue flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-black text-foreground uppercase tracking-wide mb-1">
                      100% Money-Back Guarantee
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      If you <span className="font-black text-foreground">don't love</span> the website we build — you get a{" "}
                      <span className="font-black text-sited-blue">full refund of your $49 deposit</span>. No questions asked.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                      If you <span className="font-black text-foreground">love it</span> and want to work with us — we deliver your completed project within{" "}
                      <span className="font-black text-foreground">7 days or earlier</span>. Then you simply pay the remaining balance for your package.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              {!showPayment && (
                <motion.button
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowPayment(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-5 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg bg-sited-blue hover:bg-sited-blue-hover text-white shadow-sited-blue/30"
                >
                  Secure Your Website — $49 Deposit
                  <ArrowRight size={16} />
                </motion.button>
              )}

              <AnimatePresence>
                {showPayment && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Elements stripe={stripePromise}>
                      <OfferPaymentForm
                        tier={selectedTier}
                        tierName={activeTier.name}
                        onSuccess={(info) => {
                          setCustomerInfo(info);
                          setPaymentComplete(true);
                          setShowBookingDialog(true);
                        }}
                        onCancel={() => setShowPayment(false)}
                      />
                    </Elements>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Small guarantee reminder */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Shield size={16} className="text-sited-blue" />
                <span className="font-bold">Don't love it?</span> Full $49 refund — no questions asked.
              </div>
            </div>

            {/* Why Upgrade (desktop, when Blue selected) */}
            {selectedTier === "basic-deposit" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-16"
              >
                <div className="rounded-2xl border-2 border-dashed border-gold/40 bg-gold/5 p-8 text-center mb-8">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold text-foreground text-[10px] font-black uppercase tracking-wider mb-3">
                    <TrendingUp size={12} />
                    Worth Exploring
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-2">
                    Based on your answers, you may find more value in one of these packages!
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                    Businesses that invest in premium tools see <span className="font-black text-foreground">3-5x more leads</span> and save 
                    <span className="font-black text-foreground"> 15+ hours per week</span> on admin.
                  </p>
                </div>

                <div className="space-y-4">
                  {UPGRADE_BENEFITS.map((benefit, i) => {
                    const BIcon = benefit.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex gap-4 p-5 rounded-xl border border-gold/20 bg-gold/5 hover:bg-gold/10 transition-colors"
                      >
                        <div className="p-2.5 rounded-lg bg-gold/20 h-fit">
                          <BIcon size={20} className="text-gold" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-foreground mb-1">{benefit.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
                          <div className="mt-2 flex gap-1.5">
                            {benefit.tiers.map((t) => (
                              <span key={t} className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                t === "platinum" ? "bg-gray-300/30 dark:bg-gray-500/20 text-gray-600 dark:text-gray-300" : "bg-gold/20 text-gold-hover"
                              }`}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-8 text-center">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedTier("platinum"); setShowPayment(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg transition-all ${silverShimmer} text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-500 hover:shadow-xl`}
                  >
                    <Sparkles size={16} />
                    Explore Platinum — Save $1,360
                    <ChevronRight size={16} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Comparison Table */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-16"
            >
              <h3 className="text-center text-2xl font-black text-foreground uppercase tracking-tight mb-6">
                Compare All Plans
              </h3>
              <div className="rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Feature</th>
                      <th className="text-center p-4 text-xs font-black uppercase tracking-wider text-sited-blue">Blue</th>
                      <th className="text-center p-4 text-xs font-black uppercase tracking-wider text-gold">Gold</th>
                      <th className="text-center p-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-300 bg-gray-100/50 dark:bg-gray-700/20">Platinum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "Professional Website", blue: true, gold: true, plat: true },
                      { feature: "High-Converting Funnel", blue: true, gold: true, plat: true },
                      { feature: "Lead Capture Forms", blue: true, gold: true, plat: true },
                      { feature: "Lifetime Hosting", blue: true, gold: true, plat: true },
                      { feature: "SEO Optimisation", blue: "Basic", gold: "Extra", plat: "Premium" },
                      { feature: "Calendar Integration", blue: true, gold: true, plat: true },
                      { feature: "Email Integration", blue: true, gold: true, plat: true },
                      { feature: "Payment Integration", blue: false, gold: true, plat: true },
                      { feature: "Admin Dashboard", blue: false, gold: true, plat: true },
                      { feature: "Lead Management CRM", blue: false, gold: true, plat: true },
                      { feature: "Client Portal", blue: false, gold: false, plat: true },
                      { feature: "AI Chatbot", blue: false, gold: false, plat: true },
                      { feature: "Custom Integrations", blue: false, gold: false, plat: true },
                      { feature: "Priority Support", blue: false, gold: false, plat: true },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="p-4 text-sm font-medium text-foreground">{row.feature}</td>
                        <td className="p-4 text-center">
                          {row.blue === true ? <Check size={16} className="mx-auto text-sited-blue" /> :
                           row.blue === false ? <span className="text-muted-foreground/40">—</span> :
                           <span className="text-xs font-bold text-sited-blue">{row.blue}</span>}
                        </td>
                        <td className="p-4 text-center">
                          {row.gold === true ? <Check size={16} className="mx-auto text-gold" /> :
                           row.gold === false ? <span className="text-muted-foreground/40">—</span> :
                           <span className="text-xs font-bold text-gold">{row.gold}</span>}
                        </td>
                        <td className="p-4 text-center bg-gray-100/50 dark:bg-gray-700/20">
                          {row.plat === true ? <Check size={16} className="mx-auto text-gray-500 dark:text-gray-300" /> :
                           row.plat === false ? <span className="text-muted-foreground/40">—</span> :
                           <span className="text-xs font-bold text-gray-500 dark:text-gray-300">{row.plat}</span>}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border bg-muted/30">
                      <td className="p-4 text-sm font-black text-foreground">Total Price</td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-black text-foreground">$549</span>
                        <br />
                        <span className="text-[10px] text-muted-foreground line-through">$1,399</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-black text-foreground">$649</span>
                        <br />
                        <span className="text-[10px] text-muted-foreground line-through">$1,699</span>
                      </td>
                      <td className="p-4 text-center bg-gray-100/50 dark:bg-gray-700/20">
                        <span className="text-sm font-black text-gray-600 dark:text-gray-200">$1,199</span>
                        <br />
                        <span className="text-[10px] text-muted-foreground line-through">$2,559</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 text-center">
                <motion.button
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowPayment(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-sited-blue hover:bg-sited-blue-hover text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-sited-blue/30 transition-all"
                >
                  Secure Your Website — $49
                  <ArrowRight size={16} />
                </motion.button>
                <p className="text-xs text-muted-foreground mt-3">$49 deposit • 100% refundable • 7-day delivery</p>
              </div>
            </motion.div>

            <SocialProofSection />
          </>
        )}
      </div>
    </div>
  );
};

export default Offer;
