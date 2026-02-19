import { useState, useEffect } from "react";

const SITES = [
  { url: "https://hunterinsight.com.au", name: "Hunter Insight Property" },
  { url: "https://inglebrown.sited.co", name: "Ingle & Brown" },
  { url: "https://sited.co", name: "Sited" },
  { url: "https://wetr.sited.co", name: "WETR" },
  { url: "https://hunterinsight.com.au", name: "Hunter Insight" },
  { url: "https://inglebrown.sited.co", name: "Ingle & Brown" },
];

export function ClientWebsiteGrid() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
      {SITES.map((site, i) => (
        <div
          key={i}
          className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-soft hover:shadow-elevated transition-shadow duration-300"
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Mini browser chrome */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/40 border-b border-border">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
          </div>
          <div className="aspect-[4/3] relative overflow-hidden bg-background">
            <iframe
              src={site.url}
              title={site.name}
              className="w-[400%] h-[400%] border-0 pointer-events-none origin-top-left"
              style={{ transform: "scale(0.25)" }}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-transparent" />
          </div>
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground truncate">{site.name}</span>
            <span className="text-[10px] text-sited-blue font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Sited ↗
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
