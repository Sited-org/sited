import { motion } from "framer-motion";

/* 12 real client websites in 4 rows of 3 */
const clientSites = [
  { name: "Hunter Insight", url: "https://hunterinsight.com.au" },
  { name: "Ingle & Brown", url: "https://inglebrown.com.au" },
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

const SiteCard = ({ site }: { site: (typeof clientSites)[0] }) => (
  <div className="group relative rounded-xl overflow-hidden border border-border bg-card shadow-soft hover:shadow-elevated transition-all duration-500">
    {/* Auto-scrolling iframe container */}
    <div className="relative w-full aspect-[4/3] overflow-hidden">
      <div className="absolute inset-0 w-full h-[300%] animate-[scrollSite_20s_linear_infinite] group-hover:[animation-play-state:paused]">
        <iframe
          src={site.url}
          title={`${site.name} website`}
          className="w-full h-full pointer-events-none"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          style={{ transform: "scale(0.5)", transformOrigin: "top left", width: "200%", height: "200%" }}
        />
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/60 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
          <p className="text-white font-black text-lg uppercase tracking-tight">{site.name}</p>
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
);

export const WebsiteShowcaseGrid = () => (
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
        {clientSites.map((site, i) => (
          <motion.div
            key={site.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
          >
            <SiteCard site={site} />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
