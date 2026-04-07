import { useEffect, useRef, useState } from "react";
import { useHomepageTestimonials } from "@/hooks/useTestimonials";
import { deriveScreenshotSlug, getScreenshotUrl } from "@/lib/screenshot-url";

const FeaturedScreenshotCard = ({ site, index }: { site: { name: string; url: string; screenshot: string }; index: number }) => {
  const [loaded, setLoaded] = useState(false);
  const [scrollActive, setScrollActive] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setViewportH(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => setScrollActive(true), index * 500 + 700);
    return () => clearTimeout(timer);
  }, [loaded, index]);

  useEffect(() => {
    if (!imageHeight || !viewportH) return;
    setScrollDistance(Math.max(0, imageHeight - viewportH));
  }, [imageHeight, viewportH]);

  return (
    <div className="relative bg-card border border-border rounded-2xl shadow-elevated overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/60 border-b border-border">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-gold" />
        <div className="w-2.5 h-2.5 rounded-full bg-accent/50" />
        <div className="ml-3 flex-1 h-5 bg-background rounded-md flex items-center px-3">
          <span className="text-[10px] text-muted-foreground truncate">{site.url}</span>
        </div>
      </div>
      <div ref={viewportRef} className="relative aspect-[16/10] bg-background overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full will-change-transform"
          style={{
            animation: scrollActive && scrollDistance > 0 ? `scrollIframe 20s ease-in-out infinite` : "none",
            ["--scroll-distance" as string]: `-${scrollDistance}px`,
          }}
        >
          <img
            src={site.screenshot}
            alt={`${site.name} website screenshot`}
            className="w-full h-auto block"
            loading="lazy"
            onLoad={(e) => {
              setImageHeight(e.currentTarget.offsetHeight);
              setLoaded(true);
            }}
          />
        </div>
        {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
      </div>
    </div>
  );
};

export function TestimonialShowcase() {
  const { data: testimonials, isLoading } = useHomepageTestimonials();

  if (isLoading || !testimonials?.length) return null;

  // Pick the first homepage testimonial with a website_url
  const featured = testimonials.find((t) => t.website_url) || testimonials[0];
  if (!featured) return null;

  const screenshotSlug = (featured as any).screenshot_slug || deriveScreenshotSlug(featured.website_url);
  const screenshotUrl = getScreenshotUrl(screenshotSlug, featured.updated_at);

  return (
    <div className="mt-10 sm:mt-14 max-w-3xl mx-auto">
      <p className="text-xs font-semibold tracking-widest text-center text-muted-foreground mb-4 uppercase">
        Featured Client
      </p>

      {/* Browser mockup showing client site */}
      {featured.website_url && screenshotUrl && <FeaturedScreenshotCard site={{ name: featured.business_name, url: featured.website_url, screenshot: screenshotUrl }} index={0} />}

      {/* Testimonial quote */}
      <div className="mt-6 text-center">
        <p className="text-base text-foreground italic leading-relaxed max-w-lg mx-auto">
          "{featured.testimonial_text}"
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          — {featured.testimonial_author}, {featured.business_name}
        </p>
      </div>
    </div>
  );
}
