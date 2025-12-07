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
      className={`py-16 sm:py-24 md:py-32 ${index % 2 === 0 ? 'bg-background' : 'bg-surface-elevated'}`}
    >
      <motion.div
        style={{ opacity, y }}
        className="container-tight"
      >
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16 md:mb-20">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-accent/10 mb-4 sm:mb-6">
            <Icon size={22} className="sm:w-6 sm:h-6 md:w-7 md:h-7 text-accent" />
          </div>
          <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 sm:mb-4">
            {service.category}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight">
            {service.title}
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mt-3 sm:mt-4 max-w-2xl mx-auto px-2">
            {service.tagline}
          </p>
        </div>

        {/* Main content grid */}
        <div className={`grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center mb-12 sm:mb-16 md:mb-20`}>
          {/* Image */}
          <div className={!isEven ? "lg:order-2" : ""}>
            <motion.div
              className="overflow-hidden rounded-2xl sm:rounded-3xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4 }}
            >
              <motion.img
                style={{ scale: imageScale }}
                src={service.image}
                alt={service.title}
                className="w-full h-48 sm:h-64 md:h-72 lg:h-[28rem] object-cover"
              />
            </motion.div>
          </div>

          {/* Content */}
          <div className={!isEven ? "lg:order-1" : ""}>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8">
              {service.description}
            </p>

            {/* Features */}
            <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
              {service.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 sm:gap-3">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={10} className="sm:w-3 sm:h-3 text-accent-foreground" />
                  </div>
                  <span className="text-sm sm:text-base text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Button size="lg" className="group w-full sm:w-auto" asChild>
              <Link to={service.cta.link}>
                {service.cta.text}
                <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Process */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-10 sm:mb-12 md:mb-16">
          {service.process.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card border border-border/50"
            >
              <span className="text-xl sm:text-2xl md:text-3xl font-semibold text-accent">{item.step}</span>
              <h4 className="font-semibold mt-1 sm:mt-2 text-sm sm:text-base">{item.title}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Results */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 md:gap-12 lg:gap-20">
          {service.results.map((result) => (
            <div key={result.label} className="text-center">
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
                {result.metric}
              </span>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 uppercase tracking-wider">
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
        className="min-h-[60vh] sm:min-h-[70vh] md:min-h-[85vh] flex items-center justify-center relative"
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
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-semibold tracking-tight mt-4 sm:mt-6"
          >
            Everything you need.
            <br />
            <span className="text-muted-foreground">Nothing you don't.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 sm:mt-8 leading-relaxed px-2"
          >
            We focus on three things and do them exceptionally well. 
            Websites that convert. Apps that engage. AI that transforms.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-10"
          >
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/contact">
                Get Started <ArrowRight size={18} className="ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild className="w-full sm:w-auto">
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

    </Layout>
  );
};

export default Services;
