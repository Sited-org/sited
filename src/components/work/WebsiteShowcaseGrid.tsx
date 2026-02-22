import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const clientSites = [
  { name: "Hunter Insight", url: "https://hunterinsight.com.au", screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/hunterinsight-full.png" },
  { name: "Ingle & Brown", url: "https://inglebrown.sited.co", screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/inglebrown-full.png" },
  { name: "Wisdom Education", url: "https://wisdomeducation.org", screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/wisdomeducation-full.png" },
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
  const [loaded, setLoaded] = useState(false);
  const [scrollActive, setScrollActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Measure viewport height
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setViewportH(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Lazy load when near viewport
  const [shouldLoad, setShouldLoad] = useState(false);
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

  // Stagger scroll start after image loads
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => setScrollActive(true), index * 1000 + 1500);
    return () => clearTimeout(timer);
  }, [loaded, index]);

  const screenshotUrl = site.screenshot
    ? site.screenshot
    : `https://image.thum.io/get/width/1440/fullpage/noanimate/${site.url}`;

  const [tapped, setTapped] = useState(false);

  const handleCardClick = () => {
    // On mobile/touch: toggle overlay on tap
    if (window.matchMedia("(hover: none)").matches) {
      setTapped((prev) => !prev);
    }
  };

  const showOverlay = hovered || tapped;

  return (
    <div ref={cardRef} className="group" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div
        className="relative bg-card border border-border rounded-2xl shadow-elevated overflow-hidden transition-shadow duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--foreground)/0.15)]"
        onClick={handleCardClick}
      >
        {/* MacBook chrome */}
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-muted/60 border-b border-border">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-destructive/50" />
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gold" />
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent/50" />
          <div className="ml-2 sm:ml-3 flex-1 h-4 sm:h-5 bg-background rounded-md flex items-center px-2 sm:px-3">
            <span className="text-[8px] sm:text-[9px] text-muted-foreground truncate">{site.url}</span>
          </div>
        </div>

        {/* 16:10 viewport */}
        <div
          ref={viewportRef}
          className="relative w-full overflow-hidden bg-background"
          style={{ aspectRatio: "16 / 10" }}
        >
          {shouldLoad ? (
            <div
              className="absolute top-0 left-0 w-full will-change-transform"
              style={{
                animation: scrollActive && !hovered && !tapped && scrollDistance > 0
                  ? `scrollIframe 20s ease-in-out infinite`
                  : "none",
                ["--scroll-distance" as string]: `-${scrollDistance}px`,
              }}
            >
              <img
                src={screenshotUrl}
                alt={`${site.name} website screenshot`}
                className="w-full h-auto block"
                loading="lazy"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  const dist = img.offsetHeight - viewportH;
                  setScrollDistance(dist > 0 ? dist : 0);
                  setLoaded(true);
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}

          {/* Loading skeleton until image ready */}
          {shouldLoad && !loaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}

          {/* Overlay — desktop: hover, mobile: tap */}
          <div
            className={`absolute inset-0 transition-all duration-300 flex items-center justify-center z-10 ${
              showOverlay ? "bg-foreground/60" : "bg-foreground/0"
            }`}
          >
            <div
              className={`transition-opacity duration-300 text-center ${
                showOverlay ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <p className="text-white font-black text-sm sm:text-lg uppercase tracking-tight">{site.name}</p>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
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
