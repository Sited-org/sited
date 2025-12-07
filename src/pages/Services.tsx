import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Check, Globe, Smartphone, Zap } from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "Website Design & Development",
    category: "Digital Presence",
    tagline: "Your website should work as hard as you do.",
    description: "We don't just build websites—we engineer growth machines. Every element is designed with purpose: to capture attention, build trust, and convert visitors into customers.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop",
    features: [
      "Bespoke design that reflects your brand identity",
      "Mobile-first, responsive on every device",
      "SEO foundations built from day one",
      "Speed-optimized for instant load times",
      "Analytics integration for data-driven decisions",
    ],
    process: [
      { step: "01", title: "Discovery", desc: "We learn your business inside out" },
      { step: "02", title: "Design", desc: "Crafting your visual identity" },
      { step: "03", title: "Develop", desc: "Building with precision" },
      { step: "04", title: "Launch", desc: "Going live with confidence" },
    ],
    results: [
      { metric: "3x", label: "Avg. Conversion Lift" },
      { metric: "<2s", label: "Load Time" },
      { metric: "100%", label: "Mobile Optimized" },
    ],
    cta: { text: "Start Your Website", link: "/onboarding/website" },
  },
  {
    icon: Smartphone,
    title: "App Building",
    category: "Mobile Solutions",
    tagline: "Apps people actually want to use.",
    description: "In a world of 5 million apps, mediocrity gets deleted. We build applications that earn their place on the home screen—intuitive, fast, and genuinely useful.",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=800&fit=crop",
    features: [
      "Native performance on iOS and Android",
      "Intuitive UX that requires no manual",
      "Offline-first architecture",
      "Push notifications done right",
      "Seamless backend integration",
    ],
    process: [
      { step: "01", title: "Strategy", desc: "Defining your app's purpose" },
      { step: "02", title: "Prototype", desc: "Testing ideas before building" },
      { step: "03", title: "Build", desc: "Developing your vision" },
      { step: "04", title: "Iterate", desc: "Refining based on real feedback" },
    ],
    results: [
      { metric: "50+", label: "Apps Launched" },
      { metric: "4.8★", label: "Avg. Store Rating" },
      { metric: "2M+", label: "Total Downloads" },
    ],
    cta: { text: "Start Your App", link: "/onboarding/app" },
  },
  {
    icon: Zap,
    title: "AI Integrations",
    category: "Intelligent Automation",
    tagline: "Work smarter. Scale faster.",
    description: "AI isn't the future—it's now. We integrate intelligent systems that automate the mundane, personalize at scale, and give you insights your competitors can only dream of.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&fit=crop",
    features: [
      "Custom chatbots that actually help",
      "Workflow automation that saves hours daily",
      "Smart content generation",
      "Predictive analytics for better decisions",
      "Seamless integration with your existing tools",
    ],
    process: [
      { step: "01", title: "Audit", desc: "Finding automation opportunities" },
      { step: "02", title: "Design", desc: "Architecting the solution" },
      { step: "03", title: "Integrate", desc: "Connecting all the pieces" },
      { step: "04", title: "Optimize", desc: "Continuous improvement" },
    ],
    results: [
      { metric: "60%", label: "Time Saved" },
      { metric: "24/7", label: "Availability" },
      { metric: "95%", label: "Accuracy Rate" },
    ],
    cta: { text: "Explore AI Solutions", link: "/contact" },
  },
];

const ServiceSection = ({
  service,
  index,
}: {
  service: typeof services[0];
  index: number;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [60, 0, 0, -60]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1, 1.15]);

  const isEven = index % 2 === 0;
  const Icon = service.icon;

  return (
    <section
      ref={ref}
      className={`py-32 ${index % 2 === 0 ? 'bg-background' : 'bg-surface-elevated'}`}
    >
      <motion.div
        style={{ opacity, y }}
        className="container-tight"
      >
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-6">
            <Icon size={28} className="text-accent" />
          </div>
          <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            {service.category}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
            {service.title}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mt-4 max-w-2xl mx-auto">
            {service.tagline}
          </p>
        </div>

        {/* Main content grid */}
        <div className={`grid lg:grid-cols-2 gap-16 lg:gap-20 items-center mb-20`}>
          {/* Image */}
          <div className={!isEven ? "lg:order-2" : ""}>
            <motion.div
              className="overflow-hidden rounded-3xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4 }}
            >
              <motion.img
                style={{ scale: imageScale }}
                src={service.image}
                alt={service.title}
                className="w-full h-72 md:h-[28rem] object-cover"
              />
            </motion.div>
          </div>

          {/* Content */}
          <div className={!isEven ? "lg:order-1" : ""}>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {service.description}
            </p>

            {/* Features */}
            <ul className="space-y-4 mb-10">
              {service.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-accent-foreground" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Button size="lg" className="group" asChild>
              <Link to={service.cta.link}>
                {service.cta.text}
                <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Process */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {service.process.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl bg-card border border-border/50"
            >
              <span className="text-3xl font-semibold text-accent">{item.step}</span>
              <h4 className="font-semibold mt-2">{item.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Results */}
        <div className="flex flex-wrap justify-center gap-12 md:gap-20">
          {service.results.map((result) => (
            <div key={result.label} className="text-center">
              <span className="text-4xl md:text-5xl font-semibold tracking-tight">
                {result.metric}
              </span>
              <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
                {result.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
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
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 80]);

  return (
    <Layout>
      {/* Hero */}
      <section
        ref={heroRef}
        className="min-h-[85vh] flex items-center justify-center relative"
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
            Services
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight mt-6"
          >
            Everything you need.
            <br />
            <span className="text-muted-foreground">Nothing you don't.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-8 leading-relaxed"
          >
            We focus on three things and do them exceptionally well. 
            Websites that convert. Apps that engage. AI that transforms.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-10"
          >
            <Button size="lg" asChild>
              <Link to="/contact">
                Get Started <ArrowRight size={18} className="ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link to="/work">
                See Our Work
              </Link>
            </Button>
          </motion.div>
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

      {/* Services */}
      {services.map((service, index) => (
        <ServiceSection key={service.title} service={service} index={index} />
      ))}

      {/* Final CTA */}
      <section className="py-40 bg-foreground text-background">
        <div className="container-tight">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight"
              >
                Not sure where
                <br />
                to start?
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-background/60 text-lg mt-6 leading-relaxed"
              >
                That's okay. Most of our best projects started with a simple conversation. 
                Tell us where you are, where you want to be, and we'll map the journey together.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4"
            >
              <Button
                size="xl"
                className="w-full bg-background text-foreground hover:bg-background/90 justify-between"
                asChild
              >
                <Link to="/onboarding/website">
                  I need a website
                  <ArrowRight size={20} />
                </Link>
              </Button>
              <Button
                size="xl"
                className="w-full bg-background text-foreground hover:bg-background/90 justify-between"
                asChild
              >
                <Link to="/onboarding/app">
                  I need an app
                  <ArrowRight size={20} />
                </Link>
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="w-full border-background/30 text-background hover:bg-background/10 justify-between"
                asChild
              >
                <Link to="/contact">
                  I'm not sure yet
                  <ArrowRight size={20} />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
