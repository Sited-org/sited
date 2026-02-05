import { motion } from "framer-motion";
import { Monitor, Tablet, Smartphone } from "lucide-react";

const DeviceShowcaseMockup = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full"
    >
      <div className="flex flex-col lg:flex-row items-end justify-center gap-4 sm:gap-6 lg:gap-8">
        {/* Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative order-2 lg:order-2"
        >
          <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
            {/* Browser Chrome */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-border/50 bg-muted/30">
              <div className="flex gap-1 sm:gap-1.5">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 mx-2 sm:mx-4">
                <div className="bg-muted/50 rounded-md px-2 sm:px-3 py-1 text-[10px] sm:text-xs text-muted-foreground text-center">
                  sited.lovable.app
                </div>
              </div>
              <Monitor size={14} className="text-muted-foreground hidden sm:block" />
            </div>
            {/* Screen Content */}
            <div className="w-[280px] sm:w-[320px] lg:w-[400px] h-[160px] sm:h-[180px] lg:h-[220px] bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="w-12 sm:w-16 h-3 sm:h-4 bg-foreground/80 rounded" />
                <div className="w-full h-8 sm:h-12 bg-muted/40 rounded-lg flex items-center justify-center">
                  <span className="text-[8px] sm:text-xs text-muted-foreground font-medium">One thing, done right.</span>
                </div>
                <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
                  <div className="w-16 sm:w-20 h-5 sm:h-6 bg-foreground rounded-md" />
                  <div className="w-16 sm:w-20 h-5 sm:h-6 bg-muted/50 rounded-md border border-border/50" />
                </div>
              </div>
            </div>
          </div>
          {/* Stand */}
          <div className="hidden lg:block absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-3 bg-gradient-to-b from-muted to-muted-foreground/30 rounded-b-lg" />
          <div className="hidden lg:block absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-2 bg-muted/50 rounded-full blur-sm" />
        </motion.div>

        {/* Tablet */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative order-1 lg:order-1 hidden sm:block"
        >
          <div className="backdrop-blur-xl bg-card/80 border-2 border-border/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl p-1.5 sm:p-2">
            {/* Camera notch */}
            <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-muted-foreground/20" />
            {/* Screen */}
            <div className="w-[180px] sm:w-[200px] h-[130px] sm:h-[150px] bg-gradient-to-br from-background via-background to-muted/20 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="w-10 sm:w-12 h-2 sm:h-3 bg-foreground/80 rounded" />
                <div className="w-full h-6 sm:h-8 bg-muted/40 rounded-md flex items-center justify-center">
                  <span className="text-[6px] sm:text-[8px] text-muted-foreground font-medium">One thing, done right.</span>
                </div>
                <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                  <div className="w-10 sm:w-12 h-3 sm:h-4 bg-foreground rounded-sm" />
                  <div className="w-10 sm:w-12 h-3 sm:h-4 bg-muted/50 rounded-sm border border-border/50" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Phone */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative order-3 lg:order-3"
        >
          <div className="backdrop-blur-xl bg-card/80 border-2 border-border/50 rounded-[20px] sm:rounded-[28px] overflow-hidden shadow-2xl p-1 sm:p-1.5">
            {/* Dynamic Island */}
            <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-14 sm:w-16 h-4 sm:h-5 rounded-full bg-foreground/90" />
            {/* Screen */}
            <div className="w-[100px] sm:w-[120px] h-[180px] sm:h-[220px] bg-gradient-to-br from-background via-background to-muted/20 rounded-[16px] sm:rounded-[24px] pt-6 sm:pt-8 px-2 sm:px-3 pb-2 sm:pb-3">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="w-8 sm:w-10 h-2 sm:h-2.5 bg-foreground/80 rounded" />
                <div className="w-full h-10 sm:h-14 bg-muted/40 rounded-md flex items-center justify-center mt-1 sm:mt-2">
                  <span className="text-[5px] sm:text-[6px] text-muted-foreground font-medium text-center leading-tight px-1">One thing,<br />done right.</span>
                </div>
                <div className="flex flex-col gap-1 sm:gap-1.5 mt-2 sm:mt-3">
                  <div className="w-full h-4 sm:h-5 bg-foreground rounded-sm" />
                  <div className="w-full h-4 sm:h-5 bg-muted/50 rounded-sm border border-border/50" />
                </div>
              </div>
            </div>
            {/* Home indicator */}
            <div className="absolute bottom-1 sm:bottom-1.5 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-1 rounded-full bg-foreground/30" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DeviceShowcaseMockup;
