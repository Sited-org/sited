import { useState, useEffect, useRef } from "react";

interface ShowcaseSite {
  url: string;
  name: string;
}

const SHOWCASE_SITES: ShowcaseSite[] = [
  { url: "https://hunterinsight.com.au", name: "Hunter Insight Property" },
  { url: "https://inglebrown.sited.co", name: "Ingle & Brown" },
  { url: "https://sited.co", name: "Sited" },
  { url: "https://wetr.sited.co", name: "WETR" },
  { url: "https://hunterinsight.com.au", name: "Hunter Insight" },
  { url: "https://inglebrown.sited.co", name: "Ingle & Brown" },
];

export function WebsiteShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SHOWCASE_SITES.length);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const site = SHOWCASE_SITES[activeIndex];

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Laptop frame */}
      <div className="relative bg-card border border-border rounded-2xl shadow-elevated overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/60 border-b border-border">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-gold" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent/50" />
          <div className="ml-3 flex-1 h-5 bg-background rounded-md flex items-center px-3">
            <span className="text-[10px] text-muted-foreground truncate">{site.url}</span>
          </div>
        </div>
        {/* Website iframe */}
        <div className="relative aspect-[16/10] bg-background overflow-hidden">
          <iframe
            key={site.url + activeIndex}
            src={site.url}
            title={site.name}
            className="w-full h-full border-0 pointer-events-none"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
            style={{ transform: "scale(1)", transformOrigin: "top left" }}
          />
          {/* Gradient overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
        </div>
      </div>

      {/* Site name badge */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">{site.name}</span>
        <span className="text-xs text-muted-foreground/60">·</span>
        <span className="text-xs text-sited-blue font-medium">Built by Sited</span>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {SHOWCASE_SITES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? "bg-sited-blue w-6" : "bg-border hover:bg-muted-foreground/30"
            }`}
            aria-label={`View site ${i + 1}`}
          />
        ))}
      </div>

      {/* Gold accent */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-gold/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-sited-blue/15 rounded-full blur-xl pointer-events-none" />
    </div>
  );
}
