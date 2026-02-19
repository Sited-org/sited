import { motion } from "framer-motion";
import { Check, ArrowRight, Shield, Zap, Clock, Loader2, Star, Crown } from "lucide-react";
import { useOfferContent } from "@/hooks/useOfferContent";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import BookingDialog from "@/components/booking/BookingDialog";

const TIERS = [
  {
    id: "basic-deposit",
    name: "Basic Blue",
    tagline: "Start with a $49 deposit",
    price: "$49",
    priceNote: "deposit (fully refundable)",
    fullPrice: "$549 total",
    icon: Zap,
    features: [
      "Professional frontend website",
      "Mobile responsive design",
      "Contact forms",
      "SEO foundations",
      "Email integration",
      "Calendar integration",
    ],
    accent: "border-sited-blue/40 bg-sited-blue/5",
    accentButton: "bg-sited-blue hover:bg-sited-blue-hover",
    popular: false,
  },
  {
    id: "gold",
    name: "Gold Package",
    tagline: "Most popular choice",
    price: "$649",
    priceNote: "one-time payment",
    fullPrice: null,
    icon: Star,
    features: [
      "High-converting website",
      "Admin dashboard",
      "Lead management CRM",
      "Basic SEO package",
      "All integrations included",
      "Client portal access",
    ],
    accent: "border-yellow-500/40 bg-yellow-500/5",
    accentButton: "bg-yellow-600 hover:bg-yellow-700",
    popular: true,
  },
  {
    id: "platinum",
    name: "Platinum Package",
    tagline: "The full premium experience",
    price: "$1,199",
    priceNote: "one-time payment",
    fullPrice: null,
    icon: Crown,
    features: [
      "Highest quality design",
      "Premium SEO package",
      "Admin dashboard & CRM",
      "Client portal",
      "All integrations & APIs",
      "Priority support & delivery",
    ],
    accent: "border-purple-500/40 bg-purple-500/5",
    accentButton: "bg-purple-600 hover:bg-purple-700",
    popular: false,
  },
];

const Offer = () => {
  const { content, loading } = useOfferContent();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  usePageSEO({
    title: "Exclusive Offer | Sited — Don't Miss This",
    description: "A limited-time offer on a fully custom website. Claim yours before it's gone.",
  });

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast.success("Payment successful! We'll be in touch shortly to get started.");
    } else if (payment === "cancelled") {
      toast.info("Payment was cancelled. No charges were made.");
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-sited-blue" />
      </div>
    );
  }

  const handleCheckout = async (tierId: string) => {
    setCheckingOut(tierId);
    try {
      const { data, error } = await supabase.functions.invoke("create-offer-checkout", {
        body: { tier: tierId },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Something went wrong. Please try again.");
      setCheckingOut(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Urgency banner */}
      <div className="bg-sited-blue text-white text-center py-3 px-4">
        <p className="text-sm font-bold uppercase tracking-wider animate-pulse">
          {content.urgency_text}
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
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
          className="text-center"
        >
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">
            {content.subheadline}
          </p>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-foreground uppercase leading-[0.9]">
            {content.headline}
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {content.description}
          </p>
        </motion.div>

        {/* Tier Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier, i) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 * i }}
                className={`relative rounded-2xl border-2 p-6 sm:p-8 flex flex-col ${tier.accent} ${
                  tier.popular ? "md:scale-105 md:shadow-xl" : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-yellow-500 text-black text-xs font-black uppercase tracking-wider px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-background/80">
                    <Icon size={22} className="text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">{tier.name}</h3>
                    <p className="text-xs text-muted-foreground">{tier.tagline}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl sm:text-5xl font-black text-foreground">{tier.price}</span>
                  <p className="text-xs text-muted-foreground mt-1">{tier.priceNote}</p>
                  {tier.fullPrice && (
                    <p className="text-sm text-muted-foreground mt-0.5 font-medium">{tier.fullPrice}</p>
                  )}
                </div>

                <div className="space-y-2.5 mb-8 flex-1">
                  {tier.features.map((feature, fi) => (
                    <div key={fi} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check size={16} className="text-sited-blue flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleCheckout(tier.id)}
                  disabled={checkingOut !== null}
                  className={`w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${tier.accentButton}`}
                >
                  {checkingOut === tier.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {tier.id === "basic-deposit" ? "Pay $49 Deposit" : `Get Started — ${tier.price}`}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Guarantee */}
        {content.guarantee_text && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Shield size={16} className="text-sited-blue" />
              <span>{content.guarantee_text}</span>
            </div>
          </motion.div>
        )}

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-sited-blue" />
            <span>Live in 2 weeks</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-sited-blue" />
            <span>No lock-in contracts</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-sited-blue" />
            <span>500+ websites delivered</span>
          </div>
        </motion.div>
      </div>

      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </div>
  );
};

export default Offer;
