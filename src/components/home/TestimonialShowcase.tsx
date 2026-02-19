import { useHomepageTestimonials } from "@/hooks/useTestimonials";

export function TestimonialShowcase() {
  const { data: testimonials, isLoading } = useHomepageTestimonials();

  if (isLoading || !testimonials?.length) return null;

  // Pick the first homepage testimonial with a website_url
  const featured = testimonials.find((t) => t.website_url) || testimonials[0];
  if (!featured) return null;

  return (
    <div className="mt-10 sm:mt-14 max-w-3xl mx-auto">
      <p className="text-xs font-semibold tracking-widest text-center text-muted-foreground mb-4 uppercase">
        Featured Client
      </p>

      {/* Browser mockup showing client site */}
      {featured.website_url && (
        <div className="relative bg-card border border-border rounded-2xl shadow-elevated overflow-hidden">
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/60 border-b border-border">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-gold" />
            <div className="w-2.5 h-2.5 rounded-full bg-accent/50" />
            <div className="ml-3 flex-1 h-5 bg-background rounded-md flex items-center px-3">
              <span className="text-[10px] text-muted-foreground truncate">{featured.website_url}</span>
            </div>
          </div>
          <div className="relative aspect-[16/10] bg-background overflow-hidden">
            <iframe
              src={featured.website_url}
              title={featured.business_name}
              className="w-full h-full border-0 pointer-events-none"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
            />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
          </div>
        </div>
      )}

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
