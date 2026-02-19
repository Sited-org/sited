import { motion } from "framer-motion";
import { Check, ArrowRight, Shield, Zap, Clock, Loader2 } from "lucide-react";
import { useOfferContent } from "@/hooks/useOfferContent";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useState } from "react";
import BookingDialog from "@/components/booking/BookingDialog";

const Offer = () => {
  const { content, loading } = useOfferContent();
  const [bookingOpen, setBookingOpen] = useState(false);

  usePageSEO({
    title: "Exclusive Offer | Sited — Don't Miss This",
    description: "A limited-time offer on a fully custom website. Claim yours before it's gone.",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-sited-blue" />
      </div>
    );
  }

  const handleCTA = () => {
    if (content.cta_link === "/contact" || content.cta_link === "/book") {
      setBookingOpen(true);
    } else {
      window.location.href = content.cta_link;
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
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

        {/* Price card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 sm:mt-14 bg-card border-2 border-sited-blue/30 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sited-blue via-sited-blue-hover to-sited-blue" />

          {/* Image */}
          {content.image_url && (
            <div className="mb-8">
              <img
                src={content.image_url}
                alt="Offer preview"
                className="max-h-64 mx-auto rounded-xl object-cover"
              />
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-2xl sm:text-3xl text-muted-foreground line-through font-medium">
              {content.original_price}
            </span>
            <span className="text-5xl sm:text-7xl font-black text-foreground">
              {content.sale_price}
            </span>
          </div>

          <div className="inline-block bg-sited-blue text-white px-5 py-2 rounded-full text-sm font-black uppercase tracking-wider mb-8">
            {content.discount_text}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto mb-10">
            {content.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                <Check size={18} className="text-sited-blue flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleCTA}
            className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-xl bg-sited-blue text-white font-black text-lg uppercase tracking-wider hover:bg-sited-blue-hover transition-all shadow-elevated hover:scale-[1.02] active:scale-[0.98]"
          >
            {content.cta_text}
            <ArrowRight size={20} />
          </button>

          {/* Guarantee */}
          {content.guarantee_text && (
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield size={14} />
              <span>{content.guarantee_text}</span>
            </div>
          )}
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm text-muted-foreground"
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
