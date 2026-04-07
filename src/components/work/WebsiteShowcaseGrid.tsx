import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { usePortfolioTestimonials } from "@/hooks/useTestimonials";
import { getScreenshotUrl } from "@/lib/screenshot-url";

interface SiteData {
  name: string;
  url: string;
  screenshot: string;
}

const MacBookCard = ({ site, index }: { site: SiteData; index: number }) => {
  const [loaded, setLoaded] = useState(false);
  const [scrollActive, setScrollActive] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setViewportH(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => setScrollActive(true), index * 500 + 750);
    return () => clearTimeout(timer);
  }, [loaded, index]);

  useEffect(() => {
    if (!imageHeight || !viewportH) return;
    setScrollDistance(Math.max(0, imageHeight - viewportH));
  }, [imageHeight, viewportH]);

  const showOverlay = hovered || tapped;

  return (
    <div ref={cardRef} className="group" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div
        className="relative bg-card border border-border rounded-2xl shadow-elevated overflow-hidden transition-shadow duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--foreground)/0.15)]"
        onClick={() => { if (window.matchMedia("(hover: none)").matches) setTapped((p) => !p); }}
      >
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-muted/60 border-b border-border">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-destructive/50" />
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gold" />
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent/50" />
          <div className="ml-2 sm:ml-3 flex-1 h-4 sm:h-5 bg-background rounded-md flex items-center px-2 sm:px-3">
            <span className="text-[8px] sm:text-[9px] text-muted-foreground truncate">{site.url}</span>
          </div>
        </div>

        <div ref={viewportRef} className="relative w-full overflow-hidden bg-background" style={{ aspectRatio: "16 / 10" }}>
          {shouldLoad ? (
            <div
              className="absolute top-0 left-0 w-full will-change-transform"
              style={{
                animation: scrollActive && !hovered && !tapped && scrollDistance > 0
                  ? `scrollIframe 20s ease-in-out infinite` : "none",
                ["--scroll-distance" as string]: `-${scrollDistance}px`,
              }}
            >
              <img
                src={site.screenshot}
                alt={`${site.name} website screenshot`}
                className="w-full h-auto block"
                loading="lazy"
                onLoad={(e) => { setImageHeight(e.currentTarget.offsetHeight); setLoaded(true); }}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}
          {shouldLoad && !loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
          <div className={`absolute inset-0 transition-all duration-300 flex items-center justify-center z-10 ${showOverlay ? "bg-foreground/60" : "bg-foreground/0"}`}>
            <div className={`transition-opacity duration-300 text-center ${showOverlay ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <p className="text-white font-black text-sm sm:text-lg uppercase tracking-tight">{site.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WebsiteShowcaseGrid = () => {
  const { data: testimonials, isLoading } = usePortfolioTestimonials();

  const sites: SiteData[] = testimonials?.flatMap((t) => {
    if (!t.website_url) return [];

    const screenshot = getScreenshotUrl((t as any).screenshot_slug, t.updated_at);
    if (!screenshot) return [];

    return [{
      name: t.business_name,
      url: t.website_url,
      screenshot,
    }];
  }) ?? [];

  if (isLoading) return <div className="py-24 text-center text-muted-foreground">Loading...</div>;
  if (!sites.length) return null;

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
          {sites.map((site, i) => (
            <motion.div
              key={site.url}
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
