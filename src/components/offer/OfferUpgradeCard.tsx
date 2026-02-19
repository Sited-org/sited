import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import type { TierConfig } from "@/pages/Offer";

interface OfferUpgradeCardProps {
  tier: TierConfig;
  isActive: boolean;
  onUpgrade: () => void;
  label?: string;
}

const OfferUpgradeCard = ({ tier, isActive, onUpgrade, label }: OfferUpgradeCardProps) => {
  const Icon = tier.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`rounded-xl border p-5 cursor-pointer transition-all ${tier.accentClass} hover:shadow-md`}
      onClick={onUpgrade}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-1.5 rounded-lg bg-background/80">
          <Icon size={18} className="text-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-black text-foreground">{tier.name}</h3>
          <p className="text-xs text-muted-foreground">{tier.totalPrice} total</p>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {tier.features.slice(0, 3).map((feature, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check size={12} className="text-sited-blue flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </div>
        ))}
        {tier.features.length > 3 && (
          <p className="text-xs text-muted-foreground pl-5">
            +{tier.features.length - 3} more features
          </p>
        )}
      </div>

      <button className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-border bg-background hover:bg-secondary text-foreground text-xs font-bold uppercase tracking-wider transition-colors">
        {label || "Upgrade"}
        <ArrowRight size={12} />
      </button>
    </motion.div>
  );
};

export default OfferUpgradeCard;
