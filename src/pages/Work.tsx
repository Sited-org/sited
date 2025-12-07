import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, ExternalLink, Play } from "lucide-react";

const projects = [
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
    company: "FitTrack Pro",
    category: "App Development",
    description: "A fitness app that users genuinely love, with attention to detail that sets it apart.",
    testimonial: "Working with Sited felt like having a world-class design team in-house. They understood our vision immediately.",
    author: "Marcus Chen",
    role: "CEO",
    videoThumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=800&fit=crop",
    websiteUrl: "https://fittrackpro.com",
    results: [
      { metric: "50k+", label: "Active Users" },
      { metric: "4.9", label: "App Store Rating" },
    ],
  },
  {
    company: "MediCare Connect",
    category: "AI Integration",
    description: "An intelligent system that automated 60% of customer service while improving satisfaction.",
    testimonial: "The AI integration they implemented is not just a chatbot—it's an intelligent system that actually understands context.",
    author: "Elena Rodriguez",
    role: "Operations Director",
    videoThumbnail: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=800&fit=crop",
    websiteUrl: "https://medicareconnect.com",
    results: [
      { metric: "60%", label: "Automation Rate" },
      { metric: "95%", label: "Satisfaction Score" },
    ],
  },
];

const ProjectSection = ({
  project,
  index,
}: {
  project: typeof projects[0];
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
      className="min-h-screen flex items-center py-32"
    >
      <motion.div
        style={{ opacity, y }}
        className="container-tight"
      >
        <div className={`grid lg:grid-cols-2 gap-16 lg:gap-24 items-center ${!isEven ? 'lg:flex-row-reverse' : ''}`}>
          {/* Content */}
          <div className={`space-y-8 ${!isEven ? 'lg:order-2' : ''}`}>
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {project.category}
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mt-4">
                {project.company}
              </h2>
              <p className="text-lg text-muted-foreground mt-6 leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Results */}
            <div className="flex gap-12">
              {project.results.map((result) => (
                <div key={result.label}>
                  <span className="text-4xl md:text-5xl font-semibold tracking-tight">
                    {result.metric}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider">
                    {result.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <blockquote className="border-l-2 border-accent pl-6">
              <p className="text-muted-foreground italic">
                "{project.testimonial}"
              </p>
              <cite className="text-sm mt-3 block not-italic">
                {project.author}, {project.role}
              </cite>
            </blockquote>

            {/* CTA */}
            <Button variant="outline" size="lg" className="group" asChild>
              <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer">
                View Project
                <ExternalLink size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
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
                className="w-full h-80 md:h-[28rem] object-cover"
              />
              <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/20 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-20 h-20 rounded-full bg-background/90 backdrop-blur flex items-center justify-center"
                >
                  <Play size={28} className="ml-1" fill="currentColor" />
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
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <Layout>
      {/* Hero */}
      <section
        ref={heroRef}
        className="min-h-[80vh] flex items-center justify-center relative"
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
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight mt-6"
          >
            Results that matter.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mt-8"
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
        {projects.map((project, index) => (
          <ProjectSection key={project.company} project={project} index={index} />
        ))}
      </div>

      {/* CTA Section */}
      <section className="py-40 bg-foreground text-background">
        <div className="container-tight text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight"
          >
            Your project could be next.
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-background/60 text-lg max-w-md mx-auto mt-6"
          >
            Let's discuss how we can help you achieve similar results.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-10"
          >
            <Button
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
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
