import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, ExternalLink, Quote, Star, ChevronDown } from "lucide-react";
import { usePublicTestimonials, Testimonial } from "@/hooks/useTestimonials";
import { useScrollBorders } from "@/hooks/useScrollBorders";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import BookingDialog from "@/components/booking/BookingDialog";
import { usePageSEO } from "@/hooks/usePageSEO";
import { extractVimeoId, getVimeoThumbnail } from "@/lib/vimeo";
import { WebsiteShowcaseGrid } from "@/components/work/WebsiteShowcaseGrid";
import { ScrollTextTestimonials } from "@/components/work/ScrollTextTestimonials";
import { VideoTestimonials } from "@/components/work/VideoTestimonials";
import { ScrollParallax, ScrollSlideIn, ScrollStaggerItem } from "@/components/common/ScrollAnimations";

/* ── Fallback data ── */
const fallbackProjects: ProjectDisplay[] = [
  {
    company: "Bloom Floristry",
    category: "Website Design",
    description: "A complete digital transformation that elevated their brand and drove real business growth.",
    testimonial: "Sited transformed our entire digital presence. The website they built doesn't just look incredible — it's become our most effective sales tool.",
    author: "Sarah Mitchell",
    role: "Founder",
    videoThumbnail: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=800&fit=crop&fm=webp&q=75",
    websiteUrl: "https://bloomfloristry.com",
  },
  {
    company: "Urban Fitness",
    category: "Website Design",
    description: "A modern fitness studio website that captures the energy of the brand and drives memberships.",
    testimonial: "Working with Sited felt like having a world-class design team in-house. They understood our vision immediately.",
    author: "Marcus Chen",
    role: "CEO",
    videoThumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=800&fit=crop&fm=webp&q=75",
    websiteUrl: "https://urbanfitness.com",
  },
  {
    company: "Coastal Realty",
    category: "Website Design",
    description: "A premium real estate platform that showcases properties beautifully and generates qualified leads.",
    testimonial: "The website they built isn't just beautiful — it's become our most effective sales tool. Inquiries have quadrupled.",
    author: "Elena Rodriguez",
    role: "Director",
    videoThumbnail: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=800&fit=crop&fm=webp&q=75",
    websiteUrl: "https://coastalrealty.com",
  },
];

type ProjectDisplay = {
  company: string;
  category: string;
  description: string;
  testimonial: string;
  author: string;
  role: string;
  videoThumbnail: string;
  videoUrl?: string | null;
  websiteUrl: string;
};

const transformTestimonial = (t: Testimonial): ProjectDisplay => ({
  company: t.business_name,
  category: t.project_type,
  description: t.short_description,
  testimonial: t.testimonial_text,
  author: t.testimonial_author,
  role: t.testimonial_role,
  videoThumbnail: t.video_thumbnail || "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=800&fit=crop&fm=webp&q=75",
  videoUrl: t.video_url,
  websiteUrl: t.website_url || "#",
});

/* ── Inline CTA Button ── */
const CTAButton = ({ onClick, label = "Get a Quote", variant = "blue" }: { onClick: () => void; label?: string; variant?: "blue" | "gold" | "outline" }) => {
  const styles = {
    blue: "bg-sited-blue text-white hover:bg-sited-blue-hover",
    gold: "bg-[hsl(var(--gold))] text-foreground hover:bg-[hsl(var(--gold-hover))]",
    outline: "border-2 border-white/30 text-white hover:bg-white/10",
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-bold text-base transition-colors ${styles[variant]}`}
    >
      {label} <ArrowRight size={18} />
    </button>
  );
};

/* ── Scrolling Quote Ticker ── */
const QuoteTicker = ({ quotes }: { quotes: { text: string; author: string }[] }) => {
  if (!quotes.length) return null;
  // Duplicate for infinite scroll
  const doubled = [...quotes, ...quotes];
  return (
    <div className="overflow-hidden py-6 bg-card border-y border-border">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: quotes.length * 6, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((q, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0 px-4">
            <Quote size={14} className="text-sited-blue shrink-0" />
            <span className="text-sm text-muted-foreground italic">"{q.text}"</span>
            <span className="text-xs text-foreground font-semibold">— {q.author}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

/* ── Project Card ── */
const ProjectCard = ({
  project,
  index,
  onCta,
}: {
  project: ProjectDisplay;
  index: number;
  onCta: () => void;
}) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const vimeoId = extractVimeoId(project.videoUrl || "");
  const thumbnail = vimeoId ? getVimeoThumbnail(vimeoId) : project.videoThumbnail;
  const isEven = index % 2 === 0;

  return (
    <ScrollSlideIn from={isEven ? "left" : "right"}>
      <div className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} rounded-2xl sm:rounded-3xl overflow-hidden border border-border bg-card shadow-soft scroll-border-blue hover:shadow-elevated transition-shadow duration-500`}>
        {/* Media */}
        <div className="relative w-full lg:w-[60%] aspect-video overflow-hidden flex-shrink-0 bg-muted">
          {vimeoId && showPlayer ? (
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div
              className="w-full h-full relative cursor-pointer group"
              onClick={() => vimeoId && setShowPlayer(true)}
            >
              <img
                src={thumbnail}
                alt={`${project.company} project`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-foreground/10 to-transparent" />
              {vimeoId && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-elevated"
                  >
                    <Play size={28} className="ml-1 text-foreground" fill="currentColor" />
                  </motion.div>
                </div>
              )}
              {/* Category badge */}
              <span className="absolute top-4 left-4 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-sited-blue text-white rounded-full">
                {project.category}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="w-full lg:w-[40%] p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground uppercase">
              {project.company}
            </h3>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {project.description}
            </p>

            <div className="mt-5 relative pl-5 border-l-2 border-sited-blue/40">
              <Quote className="absolute -top-0.5 -left-2.5 w-5 h-5 text-sited-blue/50 bg-card" />
              <p className="text-sm text-foreground/90 italic leading-relaxed">
                "{project.testimonial}"
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{project.author}</span> · {project.role}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onCta}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sited-blue text-white font-semibold text-sm hover:bg-sited-blue-hover transition-colors"
            >
              Get a Quote <ArrowRight size={14} />
            </button>
            {project.websiteUrl && project.websiteUrl !== "#" && (
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View Site <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </div>
    </ScrollSlideIn>
  );
};

/* ── Main Page ── */
const INITIAL_COUNT = 4;
const LOAD_MORE_COUNT = 6;

const Work = () => {
  usePageSEO({
    title: "Our Work | Sited — Real Results for Real Businesses",
    description: "See the websites, systems, and results we've delivered. Video testimonials, live sites, and proof that Sited delivers.",
  });

  const [ctaOpen, setCtaOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const { data: dbTestimonials, isLoading } = usePublicTestimonials();
  const heroRef = useRef(null);
  const pageRef = useRef<HTMLDivElement>(null);
  useScrollBorders(pageRef);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0.3, 0.85], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0.3, 0.85], [0, 60]);

  const allProjects: ProjectDisplay[] =
    dbTestimonials && dbTestimonials.length > 0
      ? dbTestimonials.map(transformTestimonial)
      : fallbackProjects;

  const visibleProjects = allProjects.slice(0, visibleCount);
  const canLoadMore = visibleCount < allProjects.length;
  const openCta = () => setCtaOpen(true);

  // Gather quotes for ticker
  const tickerQuotes = allProjects.map((p) => ({
    text: p.testimonial.length > 80 ? p.testimonial.slice(0, 80) + "…" : p.testimonial,
    author: p.author,
  }));

  return (
    <Layout>
      <LeadCaptureDialog open={ctaOpen} onOpenChange={setCtaOpen} />
      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />

      <div className="overflow-x-hidden w-full" ref={pageRef}>
        {/* ━━ HERO ━━ */}
        <section ref={heroRef} className="relative min-h-[calc(100vh-140px)] md:min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
          {/* Falling chevron particles background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 18 }).map((_, i) => {
              const left = `${5 + (i * 37 + i * i * 13) % 90}%`;
              const size = 16 + (i % 4) * 8;
              const duration = 6 + (i % 5) * 2;
              const delay = (i * 1.3) % 8;
              return (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ left, top: -40 }}
                  animate={{ y: ["0vh", "110vh"] }}
                  transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
                >
                  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="text-foreground/[0.04] dark:text-foreground/[0.06]" stroke="currentColor">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </motion.div>
              );
            })}
          </div>

          <motion.div style={{ opacity: heroOpacity, y: heroY }} className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-6xl lg:text-[7rem] font-black tracking-tighter leading-[0.85] text-foreground uppercase"
            >
              Showroom of
              <br />
              <span className="text-sited-blue">killer websites</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 sm:mt-12"
            >
              <CTAButton onClick={openCta} label="Get Started" />
            </motion.div>
          </motion.div>

          {/* Animated scroll prompt */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-8 sm:bottom-12 flex flex-col items-center gap-2 z-10"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown size={20} className="text-muted-foreground" />
            </motion.div>
          </motion.div>
        </section>

        {/* ━━ SOCIAL PROOF STRIP ━━ */}
        <section className="bg-sited-blue">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0 sm:divide-x sm:divide-white/20">
              {[
                { val: "500+", label: "Websites Delivered" },
                { val: "7 Years", label: "In The Industry" },
              ].map((s, i) => (
                <ScrollStaggerItem key={s.label} index={i}>
                  <div className="sm:px-8 text-center">
                    <p className="text-2xl sm:text-3xl font-black text-white">{s.val}</p>
                    <p className="text-xs text-white/70 font-semibold mt-0.5">{s.label}</p>
                  </div>
                </ScrollStaggerItem>
              ))}
              <ScrollStaggerItem index={2}>
                <div className="sm:px-8 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-white">5.0</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-white/70 font-semibold mt-0.5">Google Reviews</p>
                </div>
              </ScrollStaggerItem>
              <ScrollStaggerItem index={3}>
                <div className="sm:px-8 text-center">
                  <p className="text-2xl sm:text-3xl font-black text-white">100%</p>
                  <p className="text-xs text-white/70 font-semibold mt-0.5">Client Satisfaction</p>
                </div>
              </ScrollStaggerItem>
            </div>
          </div>
        </section>

        {/* ━━ SCROLLING QUOTE TICKER ━━ */}
        <QuoteTicker quotes={tickerQuotes} />

        {/* ━━ BLOCK 1: WEBSITE SHOWCASE GRID ━━ */}
        <WebsiteShowcaseGrid />

        {/* ━━ BLOCK 2: SCROLL-ANIMATED TEXT TESTIMONIALS ━━ */}
        <ScrollTextTestimonials />

        {/* ━━ BLOCK 3: VIDEO TESTIMONIALS ━━ */}
        <VideoTestimonials />

        {/* ━━ MID-PAGE CTA ━━ */}
        <section id="projects" className="py-16 sm:py-20 bg-background">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-lg sm:text-xl font-bold text-foreground mb-2">
                Like what you see?
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Every project starts with a free 20-minute consultation. No pressure, just honest advice.
              </p>
              <CTAButton onClick={() => setBookingOpen(true)} label="Free Consult" />
            </motion.div>
          </div>
        </section>

        {/* ━━ WHY SITED TRANSITION ━━ */}
        <section className="bg-card border-y border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <ScrollSlideIn from="left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase leading-tight">
                We don't just build it
                <br />
                <span className="text-sited-blue">and disappear.</span>
              </h2>
            </ScrollSlideIn>
            <ScrollSlideIn from="right">
              <p className="mt-4 text-base text-muted-foreground max-w-lg mx-auto">
                Every client gets ongoing monitoring, monthly improvements, and same-day support.
                That's why they stay — and that's why they refer us.
              </p>
            </ScrollSlideIn>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { val: "< 3 days", label: "Average delivery" },
                { val: "Same day", label: "Support response" },
                { val: "Monthly", label: "Improvements" },
                { val: "Unlimited", label: "Content updates" },
              ].map((s, i) => (
                <ScrollStaggerItem key={s.label} index={i}>
                  <div className="bg-background border border-border rounded-xl p-4">
                    <p className="text-xl sm:text-2xl font-black text-sited-blue">{s.val}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">{s.label}</p>
                  </div>
                </ScrollStaggerItem>
              ))}
            </div>
          </div>
        </section>

        {/* ━━ SCROLLING QUOTES (repeat for more social proof) ━━ */}
        <QuoteTicker quotes={tickerQuotes} />

        {/* ━━ FINAL CTA ━━ */}
        <section className="bg-sited-blue relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.1 }}
              viewport={{ once: true }}
              className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-white rounded-full blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.05 }}
              viewport={{ once: true }}
              className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] bg-white rounded-full blur-3xl"
            />
          </div>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-tight text-white uppercase"
            >
              Your project could
              <br />
              be next.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 text-base text-white/70 max-w-md mx-auto"
            >
              Free 20-minute consultation. We listen, advise, and give you a clear quote — zero pressure.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <CTAButton onClick={() => setBookingOpen(true)} label="Free Consult" variant="gold" />
              <CTAButton onClick={openCta} label="See What We Can Do" variant="outline" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 text-xs text-white/40"
            >
              No commitment. No hard sell. Just a conversation.
            </motion.p>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Work;
