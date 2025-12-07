import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, ExternalLink, Play, Quote, Star } from "lucide-react";

const projects = [
  {
    company: "Bloom Floristry",
    author: "Sarah Mitchell",
    role: "Founder",
    testimonial: "Sited transformed our entire digital presence. The website they built doesn't just look incredible—it's become our most effective sales tool. Conversion rates tripled within the first month.",
    rating: 5,
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&h=600&fit=crop",
    ],
    videoThumbnail: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=500&fit=crop",
    websiteUrl: "https://bloomfloristry.com",
    gradient: "from-rose-500/10 via-transparent to-pink-500/10",
  },
  {
    company: "FitTrack Pro",
    author: "Marcus Chen",
    role: "CEO",
    testimonial: "Working with Sited felt like having a world-class design team in-house. They understood our vision immediately and delivered an app that our users genuinely love. The attention to detail is unmatched.",
    rating: 5,
    images: [
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    ],
    videoThumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop",
    websiteUrl: "https://fittrackpro.com",
    gradient: "from-blue-500/10 via-transparent to-cyan-500/10",
  },
  {
    company: "MediCare Connect",
    author: "Elena Rodriguez",
    role: "Operations Director",
    testimonial: "The AI integration they implemented has automated 60% of our customer service. It's not just a chatbot—it's an intelligent system that actually understands context and delivers real value.",
    rating: 5,
    images: [
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=600&fit=crop",
    ],
    videoThumbnail: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=500&fit=crop",
    websiteUrl: "https://medicareconnect.com",
    gradient: "from-emerald-500/10 via-transparent to-teal-500/10",
  },
  {
    company: "Urban Estates",
    author: "James Okonkwo",
    role: "Managing Director",
    testimonial: "From our first conversation to launch, the experience was seamless. Sited doesn't just build websites—they craft experiences. Our brand has never looked more professional.",
    rating: 5,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    ],
    videoThumbnail: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop",
    websiteUrl: "https://urbanestates.com",
    gradient: "from-amber-500/10 via-transparent to-orange-500/10",
  },
];

const ProjectBlock = ({
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

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.95, 1, 1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [100, 0, 0, -100]);
  const imageY = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  const isEven = index % 2 === 0;

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center relative overflow-hidden py-24"
    >
      {/* Parallax textured background */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 -top-[20%] -bottom-[20%]"
      >
        <div 
          className={`absolute inset-0 ${isEven ? 'bg-background' : 'bg-surface-elevated'}`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
          }}
        />
        {/* Subtle grain overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
      </motion.div>

      {/* Ambient gradient */}
      <motion.div
        style={{ opacity }}
        className={`absolute inset-0 bg-gradient-to-br ${project.gradient}`}
      />

      <motion.div
        style={{ opacity, scale, y }}
        className="container-tight relative z-10"
      >
        {/* Company name header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 block">
            Case Study {String(index + 1).padStart(2, '0')}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
            {project.company}
          </h2>
        </motion.div>

        {/* Gallery - paintings on wall style */}
        <div className="flex flex-wrap items-end justify-center gap-8 md:gap-12 mb-12">
          {/* Images styled as framed paintings */}
          {project.images.map((image, i) => (
            <motion.div
              key={i}
              style={{ y: imageY, rotate: i === 0 ? -2 : 2 }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="relative group"
            >
              {/* Frame shadow */}
              <div className="absolute -inset-3 bg-foreground/5 rounded-sm blur-xl group-hover:bg-foreground/10 transition-all duration-500" />
              {/* Frame border */}
              <div className="relative bg-background p-2 md:p-3 shadow-2xl rounded-sm">
                <div className="relative overflow-hidden">
                  <img
                    src={image}
                    alt={`${project.company} project screenshot ${i + 1}`}
                    className="w-48 h-36 md:w-64 md:h-48 object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Video - centered, framed style */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex justify-center mb-16"
        >
          <div className="relative group">
            {/* Frame shadow */}
            <div className="absolute -inset-4 bg-foreground/5 rounded-sm blur-2xl group-hover:bg-foreground/10 transition-all duration-500" />
            {/* Frame border */}
            <div className="relative bg-background p-2 md:p-3 shadow-2xl rounded-sm">
              <div className="relative overflow-hidden cursor-pointer w-80 md:w-[28rem]">
                <img
                  src={project.videoThumbnail}
                  alt={`${project.company} video testimonial`}
                  className="w-full h-52 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-foreground/5 group-hover:bg-foreground/10 transition-colors duration-300" />
                
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 rounded-full bg-background/95 backdrop-blur-sm flex items-center justify-center shadow-xl"
                  >
                    <Play size={24} className="text-foreground ml-0.5" fill="currentColor" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Testimonial & Info */}
        <div className="max-w-2xl mx-auto text-center">
          {/* Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Quote size={28} className="text-accent/40 mx-auto mb-4" />
            <blockquote className="text-lg md:text-xl font-medium leading-relaxed tracking-tight mb-6 text-muted-foreground">
              "{project.testimonial}"
            </blockquote>
            
            {/* Rating */}
            <div className="flex items-center justify-center gap-1 mb-4">
              {Array.from({ length: project.rating }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className="fill-accent text-accent"
                />
              ))}
            </div>

            {/* Author */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <span className="text-sm font-semibold text-muted-foreground">
                  {project.author.charAt(0)}
                </span>
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{project.author}</p>
                <p className="text-muted-foreground text-xs">{project.role}, {project.company}</p>
              </div>
            </div>

            {/* Visit site button */}
            <Button
              variant="ghost"
              size="sm"
              className="group text-muted-foreground hover:text-foreground"
              asChild
            >
              <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer">
                Visit Website
                <ExternalLink size={14} className="ml-1.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Progress indicator */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3">
        {projects.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === index ? "bg-foreground scale-125" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

const Work = () => {
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(heroProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(heroProgress, [0, 0.5], [0, 100]);

  return (
    <Layout>
      {/* Hero */}
      <section
        ref={heroRef}
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-elevated via-background to-background" />

        {/* Floating elements */}
        <motion.div
          className="absolute top-1/4 left-[15%] w-80 h-80 bg-accent/15 rounded-full blur-3xl"
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-[15%] w-64 h-64 bg-accent/20 rounded-full blur-3xl"
          animate={{ y: [20, -20, 20] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 container-tight text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-secondary rounded-full px-5 py-2 mb-8"
          >
            <span className="text-sm font-medium uppercase tracking-wider">Our Work</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight leading-[1.05] mb-8"
          >
            Projects that
            <br />
            <span className="text-muted-foreground">speak for themselves</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Explore our portfolio of transformative digital experiences
            <br />
            and the stories behind them.
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-3"
          >
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Explore</span>
            <div className="w-px h-12 bg-gradient-to-b from-muted-foreground/50 to-transparent" />
          </motion.div>
        </motion.div>
      </section>

      {/* Project Sections */}
      {projects.map((project, index) => (
        <ProjectBlock
          key={project.company}
          project={project}
          index={index}
        />
      ))}

      {/* Stats */}
      <section className="py-32 bg-surface-elevated relative overflow-hidden">
        <div className="container-tight">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {[
              { value: "50+", label: "Projects Delivered" },
              { value: "98%", label: "Client Satisfaction" },
              { value: "3x", label: "Average ROI" },
              { value: "2 weeks", label: "Average Delivery" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <span className="text-5xl md:text-6xl font-semibold tracking-tight">{stat.value}</span>
                <p className="text-muted-foreground mt-3 text-sm uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="min-h-[80vh] flex items-center justify-center bg-foreground text-background relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }} />
        </div>

        <div className="container-tight text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-8"
          >
            Ready to join
            <br />
            our success stories?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-background/60 text-lg max-w-xl mx-auto mb-12"
          >
            Let's create something extraordinary together.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Button
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <Link to="/contact">
                Start Your Project <ArrowRight size={20} />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Work;
