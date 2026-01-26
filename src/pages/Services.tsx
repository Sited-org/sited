import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ArrowRight, Globe, Play, Check, Sparkles, Zap, Palette, Code, Shield, Rocket, MousePointer } from "lucide-react";

// Floating glass card component
const GlassCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`relative backdrop-blur-xl bg-card/60 border border-border/50 rounded-3xl overflow-hidden ${className}`}
    >
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
};

// Interactive mouse-following gradient
const InteractiveGradient = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: `radial-gradient(600px circle at ${springX}px ${springY}px, hsl(var(--accent) / 0.15), transparent 40%)`,
      }}
    />
  );
};

// Animated counter component
const AnimatedCounter = ({ value, suffix = "" }: { value: string; suffix?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (isInView) {
      const numericValue = parseInt(value.replace(/\D/g, ""));
      const duration = 2000;
      const steps = 60;
      const increment = numericValue / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current).toString());
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue}{suffix}
    </span>
  );
};

// Rolling text animation
const RollingText = ({ words }: { words: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <span className="relative inline-block h-[1.2em] overflow-hidden align-bottom">
      {words.map((word, i) => (
        <motion.span
          key={word}
          className="absolute left-0"
          initial={{ y: "100%" }}
          animate={{ y: i === index ? "0%" : i === (index - 1 + words.length) % words.length ? "-100%" : "100%" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

// Feature showcase with scroll-triggered reveal
const FeatureShowcase = () => {
  const features = [
    { icon: Palette, title: "Custom Design", description: "Every pixel crafted for your brand identity" },
    { icon: Code, title: "Clean Code", description: "Performance-optimized, maintainable architecture" },
    { icon: Shield, title: "Secure & Fast", description: "Enterprise-grade security, blazing speed" },
    { icon: Rocket, title: "SEO Ready", description: "Built to rank, designed to convert" },
    { icon: Zap, title: "Lightning Fast", description: "Sub-second load times, optimized delivery" },
    { icon: MousePointer, title: "Interactive", description: "Engaging experiences that captivate users" },
  ];

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="container-tight">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <GlassCard key={feature.title} delay={index * 0.1} className="p-8 group hover:bg-card/80 transition-colors duration-500">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-6"
              >
                <feature.icon size={26} className="text-accent-foreground" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

// Horizontal scrolling showcase
const ShowcaseScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const x1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const x2 = useTransform(scrollYProgress, [0, 1], [0, 200]);

  const row1 = ["E-Commerce", "Landing Pages", "SaaS Platforms", "Portfolio Sites", "Web Applications"];
  const row2 = ["Booking Systems", "Corporate Sites", "Blog Platforms", "Membership Sites", "Analytics Dashboards"];

  return (
    <section ref={containerRef} className="py-20 overflow-hidden">
      <div className="space-y-4">
        <motion.div style={{ x: x1 }} className="flex gap-4">
          {[...row1, ...row1].map((item, i) => (
            <div
              key={i}
              className="flex-shrink-0 px-8 py-4 rounded-full border border-border/50 bg-card/30 backdrop-blur-sm text-lg font-medium whitespace-nowrap"
            >
              {item}
            </div>
          ))}
        </motion.div>
        <motion.div style={{ x: x2 }} className="flex gap-4 -ml-40">
          {[...row2, ...row2].map((item, i) => (
            <div
              key={i}
              className="flex-shrink-0 px-8 py-4 rounded-full border border-accent/30 bg-accent/10 backdrop-blur-sm text-lg font-medium whitespace-nowrap"
            >
              {item}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// Process section with staggered animations
const ProcessSection = () => {
  const steps = [
    { number: "01", title: "Discovery", description: "We dive deep into your vision, goals, and target audience." },
    { number: "02", title: "Design", description: "Custom designs that reflect your brand and captivate users." },
    { number: "03", title: "Develop", description: "Clean, performant code built with modern technologies." },
    { number: "04", title: "Launch", description: "Rigorous testing, optimization, and seamless deployment." },
  ];

  return (
    <section className="py-24 sm:py-32 bg-surface-elevated">
      <div className="container-tight">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Our Process</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mt-4">
            From concept to launch
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2" />
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative"
              >
                <div className="text-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 mx-auto rounded-full bg-background border-2 border-accent flex items-center justify-center text-xl font-bold mb-6 relative z-10"
                  >
                    {step.number}
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Stats section with animated counters
const StatsSection = () => {
  const stats = [
    { value: "50", suffix: "+", label: "Projects Delivered" },
    { value: "98", suffix: "%", label: "Client Satisfaction" },
    { value: "2", suffix: " weeks", label: "Average Delivery" },
    { value: "3", suffix: "x", label: "Conversion Increase" },
  ];

  return (
    <section className="py-20 bg-foreground text-background">
      <div className="container-tight">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-2">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-background/60 text-sm uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// What's included section
const IncludedSection = () => {
  const included = [
    "Custom responsive design",
    "Mobile-first development",
    "SEO optimization",
    "Performance tuning",
    "Security hardening",
    "Analytics integration",
    "Content management system",
    "Hosting & deployment",
    "SSL certificate",
    "Monthly maintenance",
    "Priority support",
    "Training & documentation",
  ];

  return (
    <section className="py-24 sm:py-32">
      <div className="container-tight">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Everything You Need</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mt-4">
            What's included
          </h2>
        </motion.div>

        <GlassCard className="p-8 sm:p-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {included.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-accent-foreground" />
                </div>
                <span className="text-sm sm:text-base">{item}</span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  );
};

// CTA section with glass morphism
const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/30 rounded-full blur-3xl" />
      </div>

      <div className="container-tight relative z-10">
        <GlassCard className="p-8 sm:p-12 md:p-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <Sparkles className="w-12 h-12 mx-auto mb-8 text-accent-foreground" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
              Ready to stand out?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
              Let's create a website that captures your vision and drives real results.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="xl" variant="hero" asChild>
                <Link to="/onboarding/website" className="gap-2">
                  Start Your Project
                  <ArrowRight size={20} />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/work" className="gap-2">
                  <Play size={18} className="fill-current" />
                  View Our Work
                </Link>
              </Button>
            </div>
          </motion.div>
        </GlassCard>
      </div>
    </section>
  );
};

const Services = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <Layout>
      <InteractiveGradient />

      {/* Hero */}
      <section
        ref={heroRef}
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
      >
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              x: [0, -80, 0],
              y: [0, 80, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 container-tight text-center px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-xl border border-border/50 rounded-full px-5 py-2.5 mb-8"
          >
            <Globe size={18} className="text-accent-foreground" />
            <span className="text-sm font-medium">Website Design & Development</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight leading-[1.1]"
          >
            One thing.
            <br />
            <span className="text-muted-foreground">Done </span>
            <RollingText words={["right.", "beautifully.", "perfectly."]} />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mt-8 mb-12"
          >
            We craft stunning, high-performance websites that captivate visitors and convert them into customers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="xl" variant="hero" asChild>
              <Link to="/onboarding/website" className="gap-2">
                Start Your Project
                <ArrowRight size={20} />
              </Link>
            </Button>
            <Button size="xl" variant="ghost" asChild>
              <Link to="/work">See What We Build</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center"
          >
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full mt-2" />
          </motion.div>
        </motion.div>
      </section>

      {/* Horizontal scrolling showcase */}
      <ShowcaseScroll />

      {/* Features */}
      <FeatureShowcase />

      {/* Stats */}
      <StatsSection />

      {/* Process */}
      <ProcessSection />

      {/* What's included */}
      <IncludedSection />

      {/* CTA */}
      <CTASection />
    </Layout>
  );
};

export default Services;
