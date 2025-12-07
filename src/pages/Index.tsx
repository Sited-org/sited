import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Sparkles, Zap, Smartphone, Globe } from "lucide-react";
import { ChatSection } from "@/components/ChatSection";

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-elevated to-background" />
      
      {/* Floating elements */}
      <motion.div
        className="absolute top-1/4 left-[15%] w-64 h-64 bg-accent/20 rounded-full blur-3xl"
        animate={{ y: [-20, 20, -20] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-[15%] w-48 h-48 bg-accent/30 rounded-full blur-3xl"
        animate={{ y: [20, -20, 20] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        style={{ opacity, scale, y }}
        className="relative z-10 container-tight pt-32 pb-20 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-secondary rounded-full px-4 py-2 mb-8"
        >
          <Sparkles size={16} className="text-accent-foreground" />
          <span className="text-sm font-medium">AI-Powered Design</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] mb-6"
        >
          We build websites
          <br />
          <span className="text-muted-foreground">& apps that convert.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Sited combines AI precision with creative excellence to deliver stunning 
          digital experiences for small and medium businesses.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button variant="hero" size="xl" asChild>
            <Link to="/contact">
              Start Your Project <ArrowRight size={20} />
            </Link>
          </Button>
          <Button variant="hero-outline" size="xl" asChild>
            <Link to="/work">View Our Work</Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center"
        >
          <motion.div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full mt-2" />
        </motion.div>
      </motion.div>
    </section>
  );
};

const services = [
  {
    icon: Globe,
    title: "Website Design & Development",
    description: "Custom-designed, responsive websites that capture your brand and convert visitors into customers.",
  },
  {
    icon: Smartphone,
    title: "App Building",
    description: "Native and cross-platform applications designed for seamless user experiences across all devices.",
  },
  {
    icon: Zap,
    title: "AI Integrations",
    description: "Smart automation and AI features that give your business a competitive edge.",
  },
];

const Services = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-tight">
        <SectionHeading
          eyebrow="What We Do"
          title="Everything you need to succeed online"
          description="From concept to launch, we handle every aspect of your digital presence with precision and care."
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <ScrollReveal key={service.title} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                className="group p-8 rounded-2xl border border-border bg-card hover:shadow-elevated transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-6">
                  <service.icon size={24} className="text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{service.description}</p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.4} className="mt-12 text-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/services">
              Explore All Services <ArrowRight size={18} />
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
};

const Process = () => {
  const steps = [
    { number: "01", title: "Discovery", description: "We learn about your business, goals, and vision through our detailed onboarding process." },
    { number: "02", title: "Design", description: "Our AI-assisted design process creates stunning visuals tailored to your brand." },
    { number: "03", title: "Develop", description: "We build your project using cutting-edge technology for speed and reliability." },
    { number: "04", title: "Launch", description: "Your project goes live with full support and optimization." },
  ];

  return (
    <section className="section-padding bg-surface-elevated">
      <div className="container-tight">
        <SectionHeading
          eyebrow="Our Process"
          title="From idea to launch in weeks, not months"
          description="Our streamlined process ensures quality delivery without unnecessary delays."
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 0.1}>
              <div className="relative">
                <span className="text-7xl font-bold text-muted/50">{step.number}</span>
                <h3 className="text-xl font-semibold mt-4 mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTA = () => {
  return (
    <section className="section-padding bg-foreground text-background">
      <div className="container-tight text-center">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6">
            Ready to transform your online presence?
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <p className="text-background/70 text-lg max-w-2xl mx-auto mb-10">
            Let's discuss your project and create something extraordinary together.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <Link to="/contact">
                Get Started <ArrowRight size={20} />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

const Index = () => {
  return (
    <Layout>
      <Hero />
      <ChatSection />
      <Services />
      <Process />
      <CTA />
    </Layout>
  );
};

export default Index;