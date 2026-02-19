import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const clientSites = [
  { name: "Hunter Insight", url: "https://hunterinsight.com.au" },
  { name: "Ingle & Brown", url: "https://inglebrown.sited.co" },
  { name: "Wisdom Education", url: "https://wisdomeducation.org" },
  { name: "Bloom Floristry", url: "https://bloomfloristry.com" },
  { name: "Urban Fitness", url: "https://urbanfitness.com" },
  { name: "Coastal Realty", url: "https://coastalrealty.com" },
  { name: "Summit Builders", url: "https://summitbuilders.com.au" },
  { name: "Paws & Claws", url: "https://pawsandclaws.com.au" },
  { name: "Horizon Travel", url: "https://horizontravel.com.au" },
  { name: "Brew Culture", url: "https://brewculture.com.au" },
  { name: "Peak Performance", url: "https://peakperformance.com.au" },
  { name: "Silver Lining Co", url: "https://silverliningco.com.au" },
];

function useDeviceTier() {
  const [tier, setTier] = useState<"mobile" | "tablet" | "laptop" | "desktop">("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setTier("mobile");
      else if (w < 1024) setTier("tablet");
      else if (w < 1440) setTier("laptop");
      else setTier("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return tier;
}

const SITE_COUNTS = { mobile: 4, tablet: 6, laptop: 6, desktop: 12 };

const MacBookCard = ({ site, index }: { site: (typeof clientSites)[0]; index: number }) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [scrollActive, setScrollActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Lazy load iframe when card is near viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShouldLoad(true); obs.disconnect(); } },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Stagger scroll start: each card starts 1s after the previous
  useEffect(() => {
    if (!shouldLoad) return;
    const timer = setTimeout(() => setScrollActive(true), index * 1000);
    return () => clearTimeout(timer);
  }, [shouldLoad, index]);

  return (
    <div ref={ref} className="group" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="relative bg-card border border-border rounded-2xl shadow-elevated overflow-hidden transition-shadow duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--foreground)/0.15)]">
        {/* MacBook chrome bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-muted/60 border-b border-border">
          <div className="w-2 h-2 rounded-full bg-destructive/50" />
          <div className="w-2 h-2 rounded-full bg-gold" />
          <div className="w-2 h-2 rounded-full bg-accent/50" />
          <div className="ml-3 flex-1 h-5 bg-background rounded-md flex items-center px-3">
            <span className="text-[9px] text-muted-foreground truncate">{site.url}</span>
          </div>
        </div>

        {/* Scrolling website viewport */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-background">
          {shouldLoad ? (
            <div
              className="absolute inset-0 w-full"
              style={{
                height: "400%",
                animation: scrollActive && !hovered
                  ? "scrollSiteFull 16s linear infinite"
                  : "none",
              }}
            >
              <iframe
                src={site.url}
                title={`${site.name} website`}
                className="w-full h-full pointer-events-none border-0"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
                style={{
                  transform: "scale(0.25)",
                  transformOrigin: "top left",
                  width: "400%",
                  height: "400%",
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/60 transition-all duration-300 flex items-center justify-center z-10">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
              <p className="text-white font-black text-base sm:text-lg uppercase tracking-tight">{site.name}</p>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block px-4 py-1.5 bg-sited-blue text-white text-xs font-bold rounded-full hover:bg-sited-blue-hover transition-colors"
              >
                Visit Site →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WebsiteShowcaseGrid = () => {
  const tier = useDeviceTier();
  const count = SITE_COUNTS[tier];
  const visibleSites = clientSites.slice(0, count);

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="w-[92%] max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">
            Live Client Websites
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase">
            Built by <span className="text-sited-blue">Sited.</span> Loved by clients.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Every one of these is a real business, live right now. Hover to explore.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {visibleSites.map((site, i) => (
            <motion.div
              key={site.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
            >
              <MacBookCard site={site} index={i} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
