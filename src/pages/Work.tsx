import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, ExternalLink, Play, ChevronDown } from "lucide-react";
import { usePublicTestimonials, Testimonial } from "@/hooks/useTestimonials";

// Fallback data for when database is empty
const fallbackProjects = [
  {
    company: "Bloom Floristry",
    category: "Website Design",
    description: "A complete digital transformation that tripled conversion rates within the first month.",
    testimonial: "Sited transformed our entire digital presence. The website they built doesn't just look incredible—it's become our most effective sales tool.",
    author: "Sarah Mitchell",
    role: "Founder",
    videoThumbnail: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=800&fit=crop",
    websiteUrl: "https://bloomfloristry.com",
    results: [
      { metric: "3x", label: "Conversion Rate" },
      { metric: "2 weeks", label: "Delivery Time" },
    ],
  },
  {
    company: "Urban Fitness",
    category: "Website Design",
    description: "A modern fitness studio website that captures the energy of the brand and drives memberships.",
    testimonial: "Working with Sited felt like having a world-class design team in-house. They understood our vision immediately.",
    author: "Marcus Chen",
    role: "CEO",
    videoThumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=800&fit=crop",
    websiteUrl: "https://urbanfitness.com",
    results: [
      { metric: "200%", label: "More Leads" },
      { metric: "10 days", label: "Delivery Time" },
    ],
  },
  {
    company: "Coastal Realty",
    category: "Website Design",
    description: "A premium real estate platform that showcases properties beautifully and generates qualified leads.",
    testimonial: "The website they built isn't just beautiful—it's become our most effective sales tool. Inquiries have quadrupled.",
    author: "Elena Rodriguez",
    role: "Director",
    videoThumbnail: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=800&fit=crop",
    websiteUrl: "https://coastalrealty.com",
    results: [
      { metric: "4x", label: "Online Sales" },
      { metric: "95%", label: "Satisfaction Score" },
    ],
  },
];

// Transform database testimonial to display format
const transformTestimonial = (t: Testimonial) => ({
  company: t.business_name,
  category: t.project_type,
  description: t.short_description,
  testimonial: t.testimonial_text,
  author: t.testimonial_author,
  role: t.testimonial_role,
  videoThumbnail: t.video_thumbnail || "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=800&fit=crop",
  videoUrl: t.video_url,
  websiteUrl: t.website_url || "#",
  results: [
    ...(t.metric_1_value && t.metric_1_label ? [{ metric: t.metric_1_value, label: t.metric_1_label }] : []),
    ...(t.metric_2_value && t.metric_2_label ? [{ metric: t.metric_2_value, label: t.metric_2_label }] : []),
  ],
});

const INITIAL_COUNT = 3;
const LOAD_MORE_COUNT = 6;

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
  results: { metric: string; label: string }[];
};

const ProjectSection = ({
  project,
  index,
}: {
  project: ProjectDisplay;
  index: number;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [80, 0, 0, -80]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);

  const isEven = index % 2 === 0;

  return (
    <section
      ref={ref}
      className="flex items-center py-12 sm:py-16 lg:py-20"
    >
      <motion.div
        style={{ opacity, y }}
        className="container-tight"
      >
        <div className={`grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center ${!isEven ? 'lg:flex-row-reverse' : ''}`}>
          {/* Content */}
          <div className={`space-y-4 sm:space-y-5 lg:space-y-6 ${!isEven ? 'lg:order-2' : ''}`}>
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {project.category}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-semibold tracking-tight mt-2 sm:mt-3">
                {project.company}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-3 sm:mt-4 leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Results */}
            {project.results.length > 0 && (
              <div className="flex gap-6 sm:gap-8 lg:gap-10">
                {project.results.map((result) => (
                  <div key={result.label}>
                    <span className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">
                      {result.metric}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                      {result.label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Testimonial */}
            <blockquote className="border-l-2 border-accent pl-4 py-1">
              <p className="text-sm sm:text-base text-muted-foreground italic leading-relaxed">
                "{project.testimonial}"
              </p>
              <cite className="text-xs text-muted-foreground/80 mt-2 block not-italic font-medium">
                {project.author}, <span className="font-normal">{project.role}</span>
              </cite>
            </blockquote>

            {/* CTA */}
            <Button variant="outline" size="default" className="group" asChild>
              <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer">
                View Project
                <ExternalLink size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>

          {/* Media - Video only */}
          <div className={`${!isEven ? 'lg:order-1' : ''}`}>
            {/* Video thumbnail */}
            <motion.div
              className="overflow-hidden rounded-3xl relative cursor-pointer group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4 }}
            >
              <motion.img
                style={{ scale: imageScale }}
                src={project.videoThumbnail}
                alt={`${project.company} testimonial video`}
                className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover"
              />
              <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/20 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-background/90 backdrop-blur flex items-center justify-center"
                >
                  <Play size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7 ml-0.5 sm:ml-1" fill="currentColor" />
                </motion.div>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-sm text-background/80 bg-foreground/60 backdrop-blur px-3 py-1.5 rounded-full">
                  Watch Testimonial
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

const Work = () => {
  const heroRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const { data: dbTestimonials, isLoading } = usePublicTestimonials();
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  // Use database testimonials if available, otherwise fallback
  const allProjects: ProjectDisplay[] = dbTestimonials && dbTestimonials.length > 0
    ? dbTestimonials.map(transformTestimonial)
    : fallbackProjects;

  const visibleProjects = allProjects.slice(0, visibleCount);
  const canLoadMore = visibleCount < allProjects.length;
  const loadMoreCount = Math.ceil((visibleCount - INITIAL_COUNT) / LOAD_MORE_COUNT);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, allProjects.length));
  };

  return (
    <Layout>
      {/* Hero */}
      <section
        ref={heroRef}
        className="min-h-[50vh] sm:min-h-[55vh] lg:min-h-[60vh] flex items-center justify-center relative pt-16"
      >
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="container-tight text-center"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Selected Work
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mt-4 sm:mt-5"
          >
            Results that matter.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-lg mx-auto mt-4 sm:mt-5 px-2"
          >
            Every project is a partnership. Here's what we've built together.
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-px h-16 bg-gradient-to-b from-foreground/30 to-transparent"
          />
        </motion.div>
      </section>

      {/* Projects */}
      <div className="bg-surface-elevated">
        {visibleProjects.map((project, index) => (
          <ProjectSection key={project.company} project={project} index={index} />
        ))}

        {/* Load More Button */}
        {canLoadMore && loadMoreCount < 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="py-20 flex justify-center"
          >
            <Button
              variant="outline"
              size="xl"
              onClick={handleLoadMore}
              className="gap-3"
            >
              Load More Projects
              <ChevronDown size={20} />
            </Button>
          </motion.div>
        )}
      </div>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-28 bg-foreground text-background">
        <div className="container-tight text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight"
          >
            Your project could be next.
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-background/60 text-sm sm:text-base md:text-lg max-w-md mx-auto mt-4 sm:mt-6 px-2"
          >
            Let's discuss how we can help you achieve similar results.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-8 sm:mt-10"
          >
            <Button
              size="xl"
              className="bg-background text-foreground hover:bg-background/90 w-full sm:w-auto"
              asChild
            >
              <Link to="/contact">
                Start a Project <ArrowRight size={20} />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Work;
