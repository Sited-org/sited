import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Shield, Zap, Star, Crown, ChevronDown } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useOfferContent } from "@/hooks/useOfferContent";
import { usePageSEO } from "@/hooks/usePageSEO";
import OfferPaymentForm from "@/components/offer/OfferPaymentForm";
import OfferUpgradeCard from "@/components/offer/OfferUpgradeCard";
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
  icon: typeof Zap;
  features: string[];
  accentClass: string;
  badgeClass: string;
};

const TIERS: Record<string, TierConfig> = {
  "basic-deposit": {
    id: "basic-deposit",
    name: "Basic Blue",
    tagline: "Everything you need to get started",
    price: "$49",
    totalPrice: "$549",
    icon: Zap,
    features: [
      "Professional frontend website",
      "Mobile responsive design",
      "Contact forms",
      "SEO foundations",
      "Email integration",
      "Calendar integration",
    ],
    accentClass: "border-sited-blue/40 bg-sited-blue/5",
    badgeClass: "bg-sited-blue text-white",
  },
  gold: {
    id: "gold",
    name: "Gold Package",
    tagline: "For businesses that want more leads",
    price: "$49",
    totalPrice: "$649",
    icon: Star,
    features: [
      "High-converting website",
      "Admin dashboard",
      "Lead management CRM",
      "Basic SEO package",
      "All integrations included",
      "Client portal access",
    ],
    accentClass: "border-yellow-500/40 bg-yellow-500/5",
    badgeClass: "bg-yellow-500 text-black",
  },
  platinum: {
    id: "platinum",
    name: "Platinum Package",
    tagline: "The full premium experience",
    price: "$49",
    totalPrice: "$1,199",
    icon: Crown,
    features: [
      "Highest quality design",
      "Premium SEO package",
      "Admin dashboard & CRM",
      "Client portal",
      "All integrations & APIs",
      "Priority support & delivery",
    ],
    accentClass: "border-purple-500/40 bg-purple-500/5",
    badgeClass: "bg-purple-600 text-white",
  },
};

const Offer = () => {
  const navigate = useNavigate();
  const { content, loading } = useOfferContent();
  const [selectedTier, setSelectedTier] = useState<string>("basic-deposit");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", email: "", phone: "" });

  // Gate: require questionnaire completion
  useEffect(() => {
    const complete = sessionStorage.getItem("questionnaire_complete");
    if (!complete) {
      navigate("/contact/offers", { replace: true });
    }
  }, [navigate]);

  usePageSEO({
    title: "Secure Your Website | Sited — $49 Deposit",
    description: "Get a fully custom website with just a $49 refundable deposit. Choose Basic Blue, Gold, or Platinum.",
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
          <p className="text-sm text-muted-foreground">
            45-minute kickoff session to get your project started.
          </p>
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
  const upgradeTiers = Object.values(TIERS).filter((t) => t.id !== selectedTier && t.id !== "basic-deposit");
  const Icon = activeTier.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Urgency banner */}
      <div className="bg-sited-blue text-white text-center py-3 px-4">
        <p className="text-sm font-bold uppercase tracking-wider animate-pulse">
          {content.urgency_text}
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Badge */}
        {content.badge_text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sited-blue/10 text-sited-blue text-xs font-black uppercase tracking-wider border border-sited-blue/20">
              <Zap size={14} />
              {content.badge_text}
            </span>
          </motion.div>
        )}

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">
            {content.subheadline}
          </p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-foreground uppercase leading-[0.9]">
            {content.headline}
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {content.description}
          </p>
        </motion.div>

        {/* Main Tier Card */}
        <motion.div
          key={selectedTier}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`rounded-2xl border-2 p-6 sm:p-8 ${activeTier.accentClass}`}
        >
          {/* Tier Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-background/80">
                <Icon size={24} className="text-foreground" />
              </div>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${activeTier.badgeClass}`}>
                  {selectedTier === "basic-deposit" ? "Recommended" : "Upgraded"}
                </span>
                <h2 className="text-2xl font-black text-foreground mt-1">{activeTier.name}</h2>
                <p className="text-sm text-muted-foreground">{activeTier.tagline}</p>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="mb-6 flex items-baseline gap-3">
            <span className="text-5xl sm:text-6xl font-black text-foreground">$49</span>
            <div>
              <p className="text-sm text-muted-foreground">refundable deposit</p>
              <p className="text-sm text-muted-foreground">
                Full project <span className="font-bold text-foreground">{activeTier.totalPrice}</span>
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {activeTier.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-foreground p-2.5 rounded-lg bg-background/60 border border-border/50">
                <Check size={16} className="text-sited-blue flex-shrink-0 mt-0.5" />
                <FeatureWithInfo feature={feature} />
              </div>
            ))}
          </div>

          {/* CTA Button */}
          {!showPayment && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPayment(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-sited-blue hover:bg-sited-blue-hover text-white font-black text-sm uppercase tracking-wider transition-colors"
            >
              Secure Your Website — $49 ({activeTier.totalPrice})
              <ArrowRight size={16} />
            </motion.button>
          )}

          {/* Inline Payment Form */}
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
        {content.guarantee_text && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Shield size={16} className="text-sited-blue" />
              <span>{content.guarantee_text}</span>
            </div>
          </div>
        )}

        {/* Upgrade Section */}
        {!showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-14"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-border" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ChevronDown size={14} />
                Want more?
              </p>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.values(TIERS)
                .filter((t) => t.id !== "basic-deposit" && t.id !== selectedTier)
                .map((tier) => (
                  <OfferUpgradeCard
                    key={tier.id}
                    tier={tier}
                    isActive={selectedTier === tier.id}
                    onUpgrade={() => setSelectedTier(tier.id)}
                  />
                ))}
              {selectedTier !== "basic-deposit" && (
                <OfferUpgradeCard
                  tier={TIERS["basic-deposit"]}
                  isActive={false}
                  onUpgrade={() => setSelectedTier("basic-deposit")}
                  label="Switch back"
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Social Proof */}
        <SocialProofSection />
      </div>
    </div>
  );
};

export default Offer;
