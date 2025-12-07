import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, ExternalLink, Play, ChevronDown } from "lucide-react";

const allProjects = [
  // Initial 3
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
  // Batch 2 (6 more)
  {
    company: "Luxe Interiors",
    category: "Website Design",
    description: "A stunning portfolio site that elevated their brand and attracted high-end clients.",
    testimonial: "Our new website perfectly captures the sophistication of our work. Client inquiries increased by 200% in the first quarter.",
    author: "Amanda Foster",
    role: "Creative Director",
    videoThumbnail: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&h=800&fit=crop",
    websiteUrl: "https://luxeinteriors.com",
    results: [
      { metric: "200%", label: "More Inquiries" },
      { metric: "45%", label: "Higher Bookings" },
    ],
  },
  {
    company: "Nomad Travel",
    category: "App Development",
    description: "A travel companion app that makes trip planning effortless and enjoyable.",
    testimonial: "Sited built exactly what we envisioned. The app is intuitive, beautiful, and our users absolutely love it.",
    author: "James Park",
    role: "Co-Founder",
    videoThumbnail: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=800&fit=crop",
    websiteUrl: "https://nomadtravel.app",
    results: [
      { metric: "100k+", label: "Downloads" },
      { metric: "4.8", label: "App Rating" },
    ],
  },
  {
    company: "GreenLeaf Organic",
    category: "Website Design",
    description: "An e-commerce platform that doubled their online sales and expanded their reach.",
    testimonial: "The website Sited built for us isn't just beautiful—it's a revenue machine. Best investment we've made.",
    author: "Lisa Chen",
    role: "Owner",
    videoThumbnail: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=800&fit=crop",
    websiteUrl: "https://greenleaforganic.com",
    results: [
      { metric: "2x", label: "Online Sales" },
      { metric: "35%", label: "Cart Conversion" },
    ],
  },
  {
    company: "FinanceHub",
    category: "AI Integration",
    description: "An AI-powered financial advisor that provides personalized recommendations.",
    testimonial: "The AI system understands complex financial scenarios and provides advice our customers trust completely.",
    author: "Robert Williams",
    role: "CTO",
    videoThumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop",
    websiteUrl: "https://financehub.io",
    results: [
      { metric: "40%", label: "Time Saved" },
      { metric: "98%", label: "Accuracy Rate" },
    ],
  },
  {
    company: "PetPal",
    category: "App Development",
    description: "A pet care app connecting owners with trusted sitters and vets in their area.",
    testimonial: "From concept to launch, Sited was incredible. They thought of features we hadn't even considered.",
    author: "Sophie Adams",
    role: "Founder",
    videoThumbnail: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=800&fit=crop",
    websiteUrl: "https://petpal.app",
    results: [
      { metric: "75k", label: "Active Users" },
      { metric: "15k", label: "Bookings/Month" },
    ],
  },
  {
    company: "Artisan Coffee Co",
    category: "Website Design",
    description: "A brand refresh and website that captures the craft behind every cup.",
    testimonial: "Sited understood our brand story and translated it into a digital experience that resonates with coffee lovers.",
    author: "Michael Torres",
    role: "Brand Manager",
    videoThumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=800&fit=crop",
    websiteUrl: "https://artisancoffee.co",
    results: [
      { metric: "150%", label: "Online Orders" },
      { metric: "80%", label: "Return Visitors" },
    ],
  },
  // Batch 3 (6 more)
  {
    company: "TechStart Academy",
    category: "AI Integration",
    description: "An AI tutor that adapts to each student's learning pace and style.",
    testimonial: "Student engagement skyrocketed. The AI tutor provides personalized help 24/7 that we simply couldn't offer before.",
    author: "Dr. Emily Watson",
    role: "Academic Director",
    videoThumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=800&fit=crop",
    websiteUrl: "https://techstartacademy.com",
    results: [
      { metric: "85%", label: "Pass Rate" },
      { metric: "3x", label: "Engagement" },
    ],
  },
  {
    company: "Urban Eats",
    category: "App Development",
    description: "A food delivery app focused on local restaurants and sustainable practices.",
    testimonial: "The app perfectly balances user experience with restaurant needs. It's become the go-to platform in our city.",
    author: "David Kim",
    role: "CEO",
    videoThumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop",
    websiteUrl: "https://urbaneats.app",
    results: [
      { metric: "500+", label: "Restaurants" },
      { metric: "50k", label: "Daily Orders" },
    ],
  },
  {
    company: "Wellness360",
    category: "Website Design",
    description: "A holistic wellness platform that books classes, tracks progress, and builds community.",
    testimonial: "Sited created more than a website—they built a complete digital ecosystem for our wellness community.",
    author: "Jennifer Lee",
    role: "Founder",
    videoThumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=800&fit=crop",
    websiteUrl: "https://wellness360.com",
    results: [
      { metric: "10k+", label: "Members" },
      { metric: "92%", label: "Retention" },
    ],
  },
  {
    company: "LegalEase",
    category: "AI Integration",
    description: "An AI assistant that streamlines legal document review and contract analysis.",
    testimonial: "What used to take our team days now takes hours. The accuracy is remarkable.",
    author: "Thomas Baker",
    role: "Managing Partner",
    videoThumbnail: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=800&fit=crop",
    websiteUrl: "https://legalease.ai",
    results: [
      { metric: "70%", label: "Time Saved" },
      { metric: "99.5%", label: "Accuracy" },
    ],
  },
  {
    company: "HomeStyle Design",
    category: "App Development",
    description: "An AR app that lets users visualize furniture in their space before buying.",
    testimonial: "Returns dropped dramatically since launch. Customers love being able to 'see' products in their homes first.",
    author: "Rachel Green",
    role: "Product Lead",
    videoThumbnail: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=800&fit=crop",
    websiteUrl: "https://homestyledesign.app",
    results: [
      { metric: "60%", label: "Fewer Returns" },
      { metric: "4.7", label: "App Rating" },
    ],
  },
  {
    company: "CloudSync Pro",
    category: "Website Design",
    description: "A SaaS marketing site that clearly communicates complex features and drives signups.",
    testimonial: "Trial signups increased 180% after launch. Sited knows how to convert visitors into customers.",
    author: "Andrew Martinez",
    role: "VP Marketing",
    videoThumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop",
    websiteUrl: "https://cloudsyncpro.io",
    results: [
      { metric: "180%", label: "More Signups" },
      { metric: "45%", label: "Trial to Paid" },
    ],
  },
];

const INITIAL_COUNT = 3;
const LOAD_MORE_COUNT = 6;

const ProjectSection = ({
  project,
  index,
}: {
  project: typeof allProjects[0];
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
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

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
