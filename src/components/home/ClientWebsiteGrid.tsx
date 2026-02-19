import { useState, useEffect, useRef } from "react";

const SITES = [
  { name: "Hunter Insight", url: "https://hunterinsight.com.au", screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/hunterinsight-full.png" },
  { name: "Ingle & Brown", url: "https://inglebrown.sited.co", screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/inglebrown-full.png" },
  { name: "Wisdom Education", url: "https://wisdomeducation.org", screenshot: "https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/wisdomeducation-full.png" },
  { name: "Bloom Floristry", url: "https://bloomfloristry.com" },
  { name: "Urban Fitness", url: "https://urbanfitness.com" },
  { name: "Coastal Realty", url: "https://coastalrealty.com" },
];

const HomeMacBookCard = ({ site, index }: { site: (typeof SITES)[0]; index: number }) => {
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
    const timer = setTimeout(() => setScrollActive(true), index * 800 + 1200);
    return () => clearTimeout(timer);
  }, [loaded, index]);

  const screenshotUrl = site.screenshot
    ? site.screenshot
    : `https://image.thum.io/get/width/1440/fullpage/noanimate/${site.url}`;

  return (
    <div
      ref={cardRef}
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative bg-card border border-border rounded-xl overflow-hidden shadow-soft hover:shadow-elevated transition-shadow duration-500">
        {/* MacBook chrome */}
        <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/40 border-b border-border">
          <div className="w-1.5 h-1.5 rounded-full bg-destructive/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
          <div className="ml-2 flex-1 h-3.5 bg-background rounded-md flex items-center px-2">
            <span className="text-[7px] text-muted-foreground truncate">{site.url}</span>
          </div>
        </div>

        {/* 4:3 viewport with scroll animation */}
        <div
          ref={viewportRef}
          className="relative w-full overflow-hidden bg-background"
          style={{ aspectRatio: "4 / 3" }}
        >
          {shouldLoad ? (
            <div
              className="absolute top-0 left-0 w-full will-change-transform"
              style={{
                animation: scrollActive && !hovered && scrollDistance > 0
                  ? `scrollIframe 20s ease-in-out infinite`
                  : "none",
                ["--scroll-distance" as string]: `-${scrollDistance}px`,
              }}
            >
              <img
                src={screenshotUrl}
                alt={`${site.name} website`}
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

          {/* Loading skeleton */}
          {shouldLoad && !loaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}

          {/* Hover overlay - name only, no link */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/50 transition-all duration-300 flex items-center justify-center z-10">
            <p className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-black text-xs sm:text-sm uppercase tracking-tight">
              {site.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export function ClientWebsiteGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
      {SITES.map((site, i) => (
        <HomeMacBookCard key={site.name + i} site={site} index={i} />
      ))}
    </div>
  );
}
