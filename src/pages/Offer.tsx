import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Shield, Zap, Star, Crown, ChevronRight, Flame, TrendingUp, Bot, Globe, BarChart3, Users, Lock } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useOfferContent } from "@/hooks/useOfferContent";
import { usePageSEO } from "@/hooks/usePageSEO";
import OfferPaymentForm from "@/components/offer/OfferPaymentForm";
import FeatureWithInfo from "@/components/offer/FeatureInfo";
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
    accentClass: "border-sited-blue/30 bg-sited-blue/5",
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
    accentClass: "border-yellow-500/30 bg-yellow-500/5",
    badgeClass: "bg-yellow-500 text-black",
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
    accentClass: "border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-900/10",
    badgeClass: "bg-purple-600 text-white",
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

const Offer = () => {
  const navigate = useNavigate();
  const { content, loading } = useOfferContent();
  const [selectedTier, setSelectedTier] = useState<string>("platinum");
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

  return (
    <div className="min-h-screen bg-background">
      {/* Urgency Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-sited-blue to-purple-600 text-white text-center py-3 px-4">
        <p className="text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2">
          <Flame size={16} className="animate-pulse" />
          {content.urgency_text || "LIMITED TIME — SAVE UP TO $1,360"}
          <Flame size={16} className="animate-pulse" />
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
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-sited-blue font-black mb-3">
            YOUR CUSTOM OFFER
          </p>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-foreground uppercase leading-[0.9]">
            CHOOSE YOUR<br />
            <span className="bg-gradient-to-r from-purple-500 to-sited-blue bg-clip-text text-transparent">
              GROWTH PLAN
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Every package starts with a <span className="font-black text-foreground">$49 refundable deposit</span>. 
            No risk. No lock-in. Just results.
          </p>
        </motion.div>

        {/* ═══ TIER SELECTOR CARDS ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-10">
          {Object.values(TIERS).map((tier, idx) => {
            const TIcon = tier.icon;
            const isActive = selectedTier === tier.id;
            const isPlatinum = tier.id === "platinum";

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => { setSelectedTier(tier.id); setShowPayment(false); }}
                className={`relative cursor-pointer rounded-2xl border-2 p-5 sm:p-6 transition-all duration-300 ${
                  isActive
                    ? isPlatinum
                      ? "border-purple-500 bg-gradient-to-br from-purple-500/15 to-purple-900/15 shadow-lg shadow-purple-500/20 scale-[1.02]"
                      : `${tier.accentClass} shadow-lg scale-[1.02]`
                    : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-md"
                }`}
              >
                {/* Popular badge */}
                {isPlatinum && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
                      <Crown size={10} />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`p-2 rounded-lg ${isPlatinum ? "bg-purple-500/20" : "bg-muted"}`}>
                    <TIcon size={20} className={isPlatinum ? "text-purple-400" : "text-foreground"} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">{tier.name}</h3>
                    <p className="text-xs text-muted-foreground">{tier.tagline}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-foreground">{tier.totalPrice}</span>
                    <span className="text-sm text-muted-foreground line-through">{tier.usualPrice}</span>
                  </div>
                  <p className="text-xs font-black text-green-500 mt-1">SAVE {tier.savings}</p>
                </div>

                <div className="space-y-2 mb-4">
                  {tier.features.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check size={14} className={`flex-shrink-0 mt-0.5 ${isPlatinum ? "text-purple-400" : "text-sited-blue"}`} />
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
                    ? isPlatinum
                      ? "bg-purple-600 text-white"
                      : "bg-sited-blue text-white"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isActive ? "Selected" : "Select Plan"}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ═══ SELECTED TIER DETAIL ═══ */}
        <motion.div
          key={selectedTier}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`rounded-2xl border-2 p-6 sm:p-8 ${
            selectedTier === "platinum"
              ? "border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-purple-900/10"
              : activeTier.accentClass
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${selectedTier === "platinum" ? "bg-purple-500/20" : "bg-background/80"}`}>
                <Icon size={28} className={selectedTier === "platinum" ? "text-purple-400" : "text-foreground"} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground">{activeTier.name}</h2>
                  {activeTier.popular && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase">
                      Best Value
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{activeTier.tagline}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-foreground">{activeTier.totalPrice}</span>
                <span className="text-lg text-muted-foreground line-through">{activeTier.usualPrice}</span>
              </div>
              <p className="text-sm font-black text-green-500">YOU SAVE {activeTier.savings}</p>
              <p className="text-xs text-muted-foreground mt-1">$49 refundable deposit today</p>
            </div>
          </div>

          {/* Full Feature List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {activeTier.features.map((feature, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 text-sm text-foreground p-3 rounded-xl border transition-colors ${
                  selectedTier === "platinum"
                    ? "bg-purple-500/5 border-purple-500/20"
                    : "bg-background/60 border-border/50"
                }`}
              >
                <Check size={16} className={`flex-shrink-0 mt-0.5 ${selectedTier === "platinum" ? "text-purple-400" : "text-sited-blue"}`} />
                <FeatureWithInfo feature={feature} />
              </div>
            ))}
          </div>

          {/* CTA */}
          {!showPayment && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPayment(true)}
              className={`w-full inline-flex items-center justify-center gap-2 px-6 py-5 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg ${
                selectedTier === "platinum"
                  ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-purple-500/30"
                  : "bg-sited-blue hover:bg-sited-blue-hover text-white"
              }`}
            >
              Secure Your {activeTier.name} Website — $49 Deposit
              <ArrowRight size={16} />
            </motion.button>
          )}

          {/* Inline Payment */}
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

        {/* Guarantee */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Shield size={16} className="text-sited-blue" />
            <span className="font-bold">100% Money-Back Guarantee</span> — Not happy? Full refund, no questions asked.
          </div>
        </div>

        {/* ═══ WHY UPGRADE SECTION ═══ */}
        {selectedTier === "basic-deposit" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <div className="rounded-2xl border-2 border-dashed border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-purple-900/5 p-6 sm:p-8 text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider mb-3">
                <TrendingUp size={12} />
                Recommended Upgrade
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground mb-2">
                Based on your answers, Platinum could be the better fit.
              </h3>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Businesses that invest in premium tools see <span className="font-black text-foreground">3-5x more leads</span> and save 
                <span className="font-black text-foreground"> 15+ hours per week</span> on admin. Here's what you'd unlock:
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
                    className="flex gap-4 p-4 sm:p-5 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors"
                  >
                    <div className="p-2.5 rounded-lg bg-purple-500/20 h-fit">
                      <BIcon size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-foreground mb-1">{benefit.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
                      <div className="mt-2 flex gap-1.5">
                        {benefit.tiers.map((t) => (
                          <span key={t} className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            t === "platinum" ? "bg-purple-600/20 text-purple-400" : "bg-yellow-500/20 text-yellow-600"
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
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-purple-500/30 transition-all"
              >
                <Crown size={16} />
                Switch to Platinum — Save $1,360
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
          <h3 className="text-center text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight mb-6">
            Compare All Plans
          </h3>
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Feature</th>
                    <th className="text-center p-4 text-xs font-black uppercase tracking-wider text-sited-blue">Blue</th>
                    <th className="text-center p-4 text-xs font-black uppercase tracking-wider text-yellow-500">Gold</th>
                    <th className="text-center p-4 text-xs font-black uppercase tracking-wider text-purple-500 bg-purple-500/5">Platinum</th>
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
                      <td className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-foreground">{row.feature}</td>
                      <td className="p-3 sm:p-4 text-center">
                        {row.blue === true ? <Check size={16} className="mx-auto text-sited-blue" /> :
                         row.blue === false ? <span className="text-muted-foreground/40">—</span> :
                         <span className="text-xs font-bold text-sited-blue">{row.blue}</span>}
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        {row.gold === true ? <Check size={16} className="mx-auto text-yellow-500" /> :
                         row.gold === false ? <span className="text-muted-foreground/40">—</span> :
                         <span className="text-xs font-bold text-yellow-500">{row.gold}</span>}
                      </td>
                      <td className="p-3 sm:p-4 text-center bg-purple-500/5">
                        {row.plat === true ? <Check size={16} className="mx-auto text-purple-500" /> :
                         row.plat === false ? <span className="text-muted-foreground/40">—</span> :
                         <span className="text-xs font-bold text-purple-500">{row.plat}</span>}
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
                    <td className="p-4 text-center bg-purple-500/5">
                      <span className="text-sm font-black text-purple-500">$1,199</span>
                      <br />
                      <span className="text-[10px] text-muted-foreground line-through">$2,559</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 text-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSelectedTier("platinum"); setShowPayment(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-purple-500/30 transition-all"
            >
              <Crown size={16} />
              Get Platinum — Dominate Your Market
              <ArrowRight size={16} />
            </motion.button>
            <p className="text-xs text-muted-foreground mt-3">Only $49 deposit • 100% refundable • No lock-in</p>
          </div>
        </motion.div>

        {/* Social Proof */}
        <SocialProofSection />
      </div>
    </div>
  );
};

export default Offer;
