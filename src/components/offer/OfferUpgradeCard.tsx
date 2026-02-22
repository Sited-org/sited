import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import type { TierConfig } from "@/pages/Offer";

interface OfferUpgradeCardProps {
  tier: TierConfig;
  isActive: boolean;
  onUpgrade: () => void;
  label?: string;
}

const silverShimmer = "bg-[linear-gradient(110deg,hsl(0_0%_85%)_0%,hsl(0_0%_95%)_45%,hsl(0_0%_100%)_50%,hsl(0_0%_95%)_55%,hsl(0_0%_85%)_100%)] dark:bg-[linear-gradient(110deg,hsl(0_0%_35%)_0%,hsl(0_0%_50%)_45%,hsl(0_0%_65%)_50%,hsl(0_0%_50%)_55%,hsl(0_0%_35%)_100%)]";

const OfferUpgradeCard = ({ tier, isActive, onUpgrade, label }: OfferUpgradeCardProps) => {
  const Icon = tier.icon;
  const isPlatinum = tier.id === "platinum";
  const isGold = tier.id === "gold";

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`rounded-xl border p-5 cursor-pointer transition-all ${tier.accentClass} hover:shadow-md`}
      onClick={onUpgrade}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-1.5 rounded-lg ${
          isPlatinum ? "bg-gray-300/30 dark:bg-gray-500/20" :
          isGold ? "bg-gold/20" : "bg-sited-blue/10"
        }`}>
          <Icon size={18} className={
            isPlatinum ? "text-gray-500 dark:text-gray-300" :
            isGold ? "text-gold" : "text-sited-blue"
          } />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-foreground">{tier.name}</h3>
            {isPlatinum && <Sparkles size={12} className="text-gray-400" />}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-foreground">{tier.totalPrice}</p>
            <p className="text-xs text-muted-foreground line-through">{tier.usualPrice}</p>
          </div>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] font-black text-green-500">SAVE {tier.savings}</span>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {tier.features.slice(0, 3).map((feature, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check size={12} className={`flex-shrink-0 mt-0.5 ${
              isPlatinum ? "text-gray-500 dark:text-gray-300" :
              isGold ? "text-gold" : "text-sited-blue"
            }`} />
            <span>{feature}</span>
          </div>
        ))}
        {tier.features.length > 3 && (
          <p className="text-xs text-muted-foreground pl-5">
            +{tier.features.length - 3} more features
          </p>
        )}
      </div>

      <button className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
        isPlatinum
          ? `${silverShimmer} text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-500`
          : isGold
            ? "bg-gold hover:bg-gold-hover text-foreground"
            : "bg-sited-blue hover:bg-sited-blue-hover text-white"
      }`}>
        {label || "Select Package"}
        <ArrowRight size={12} />
      </button>
    </motion.div>
  );
};

export default OfferUpgradeCard;
