import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

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

/*
 * Each card renders the client website at 1440px native width inside an iframe,
 * then CSS-scales it to fit the card. The iframe is 3× viewport height to capture
 * the full homepage. A CSS animation scrolls the content top-to-bottom.
 *
 * Key: the iframe wrapper has explicit pixel dimensions calculated from the card
 * width, preventing any layout collapse.
 */
const MacBookCard = ({ site, index }: { site: (typeof clientSites)[0]; index: number }) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [scrollActive, setScrollActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [cardWidth, setCardWidth] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Measure viewport width for scale calculation
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setCardWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Lazy load when near viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShouldLoad(true); obs.disconnect(); } },
      { rootMargin: "400px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Stagger scroll: each card starts 1s after previous
  useEffect(() => {
    if (!shouldLoad) return;
    const timer = setTimeout(() => setScrollActive(true), index * 1000);
    return () => clearTimeout(timer);
  }, [shouldLoad, index]);

  const NATIVE_W = 1440;
  const scale = cardWidth > 0 ? cardWidth / NATIVE_W : 0.3;
  // Viewport height at laptop ratio (16:10)
  const viewportH = cardWidth * (10 / 16);
  // iframe height = full homepage length at native width
  const iframeH = 8000; // 8000px captures most full homepages

  return (
    <div ref={cardRef} className="group" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="relative bg-card border border-border rounded-2xl shadow-elevated overflow-hidden transition-shadow duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--foreground)/0.15)]">
        {/* MacBook chrome */}
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-muted/60 border-b border-border">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-destructive/50" />
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gold" />
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent/50" />
          <div className="ml-2 sm:ml-3 flex-1 h-4 sm:h-5 bg-background rounded-md flex items-center px-2 sm:px-3">
            <span className="text-[8px] sm:text-[9px] text-muted-foreground truncate">{site.url}</span>
          </div>
        </div>

        {/* 16:10 laptop viewport */}
        <div
          ref={viewportRef}
          className="relative w-full overflow-hidden bg-background"
          style={{ aspectRatio: "16 / 10" }}
        >
          {shouldLoad && cardWidth > 0 ? (
            <div
              className="absolute top-0 left-0"
              style={{
                width: `${cardWidth}px`,
                height: `${iframeH * scale}px`,
                animation: scrollActive && !hovered
                  ? `scrollIframe 16s ease-in-out infinite`
                  : "none",
                /* The animation scrolls from 0 to -(totalHeight - viewportHeight) */
                ["--scroll-distance" as any]: `-${iframeH * scale - viewportH}px`,
              }}
            >
              <iframe
                src={site.url}
                title={`${site.name} website`}
                className="pointer-events-none border-0 block origin-top-left"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
                style={{
                  width: `${NATIVE_W}px`,
                  height: `${iframeH}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/60 transition-all duration-300 flex items-center justify-center z-10">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
              <p className="text-white font-black text-sm sm:text-lg uppercase tracking-tight">{site.name}</p>
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "100px" }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
            >
              <MacBookCard site={site} index={i} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
