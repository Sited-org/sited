import { motion } from "framer-motion";
import { Star, Globe, Users, Award, ShieldCheck } from "lucide-react";

const stats = [
  { value: "500+", label: "Websites Delivered", icon: Globe },
  { value: "7+", label: "Years in Business", icon: Award },
  { value: "4.9★", label: "Average Rating", icon: Star },
  { value: "12", label: "Countries Served", icon: Users },
];

const trustLogos = [
  { name: "Google", sub: "Partner" },
  { name: "Meta", sub: "Business Partner" },
  { name: "Stripe", sub: "Verified" },
  { name: "GitHub", sub: "Backed" },
];

const reviews = [
  {
    quote: "Best investment we ever made for our business. ROI within the first month.",
    author: "Sarah M.",
    role: "Founder, CleanPro Services",
    stars: 5,
  },
  {
    quote: "They delivered in 10 days what other agencies quoted 3 months for.",
    author: "James K.",
    role: "Owner, Elite Fitness",
    stars: 5,
  },
  {
    quote: "Our leads increased 340% in the first quarter after launch.",
    author: "Emily R.",
    role: "Director, Bright Dental",
    stars: 5,
  },
];

const SocialProofSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className="mt-20 space-y-14"
    >
      {/* Section Header */}
      <div className="text-center space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-sited-blue">
          WHY BUSINESSES TRUST US
        </p>
        <h3 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">
          Trusted Worldwide
        </h3>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="text-center p-4 rounded-xl border border-border bg-card"
            >
              <Icon size={20} className="mx-auto mb-2 text-sited-blue" />
              <p className="text-2xl sm:text-3xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Trusted By Logos */}
      <div className="space-y-4">
        <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Trusted & Certified By
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {trustLogos.map((logo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.05 }}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
            >
              <ShieldCheck size={18} className="text-sited-blue mb-1" />
              <p className="text-xs font-black text-foreground">{logo.name}</p>
              <p className="text-[10px] text-muted-foreground">{logo.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
          What Our Clients Say
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1 }}
              className="p-5 rounded-xl border border-border bg-card"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: review.stars }).map((_, s) => (
                  <Star key={s} size={14} className="fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-sm text-foreground font-medium mb-3 leading-relaxed">
                "{review.quote}"
              </p>
              <div>
                <p className="text-xs font-black text-foreground">{review.author}</p>
                <p className="text-xs text-muted-foreground">{review.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom trust bar */}
      <div className="text-center p-6 rounded-xl border border-sited-blue/20 bg-sited-blue/5">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck size={20} className="text-sited-blue" />
          <p className="text-sm font-black text-foreground uppercase tracking-wider">
            100% Satisfaction Guarantee
          </p>
        </div>
        <p className="text-xs text-muted-foreground max-w-lg mx-auto">
          If you're not completely happy with the final result, we'll refund your deposit in full. No questions asked. We've delivered 500+ websites and counting — your project is in safe hands.
        </p>
      </div>
    </motion.div>
  );
};

export default SocialProofSection;
