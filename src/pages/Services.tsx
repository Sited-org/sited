import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Check } from "lucide-react";

const services = [
  {
    title: "Website Design & Development",
    category: "Digital Presence",
    description: "We craft bespoke websites that don't just look beautiful—they perform. Every pixel is purposeful, every interaction meaningful.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop",
    features: [
      "Custom design tailored to your brand",
      "Mobile-first responsive development",
      "SEO-optimized structure",
      "Lightning-fast performance",
    ],
    results: [
      { metric: "3x", label: "Avg. Conversion Lift" },
      { metric: "2 weeks", label: "Delivery Time" },
    ],
  },
  {
    title: "App Building",
    category: "Mobile Solutions",
    description: "Transform your ideas into powerful mobile applications. We build apps that users love to open, day after day.",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=800&fit=crop",
    features: [
      "Native iOS & Android apps",
      "Cross-platform development",
      "Intuitive user interfaces",
      "App Store optimization",
    ],
    results: [
      { metric: "50+", label: "Apps Launched" },
      { metric: "4.8", label: "Avg. Rating" },
    ],
  },
  {
    title: "AI Integrations",
    category: "Intelligent Automation",
    description: "Harness the power of artificial intelligence to automate workflows, personalize experiences, and unlock insights.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&fit=crop",
    features: [
      "Custom AI chatbots",
      "Intelligent automation",
      "Personalization engines",
      "Content generation",
    ],
    results: [
      { metric: "60%", label: "Time Saved" },
      { metric: "95%", label: "Accuracy Rate" },
    ],
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
        <div className={`grid lg:grid-cols-2 gap-16 lg:gap-24 items-center`}>
          {/* Content */}
          <div className={!isEven ? "lg:order-2" : ""}>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {service.category}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mt-4">
              {service.title}
            </h2>
            <p className="text-lg text-muted-foreground mt-6 leading-relaxed max-w-lg">
              {service.description}
            </p>

            {/* Results */}
            <div className="flex gap-12 mt-10">
              {service.results.map((result) => (
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

            {/* Features */}
            <ul className="space-y-3 mt-10">
              {service.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-accent-foreground" />
                  </div>
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Image */}
          <div className={!isEven ? "lg:order-1" : ""}>
            <motion.div
              className="overflow-hidden rounded-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4 }}
            >
              <motion.img
                style={{ scale: imageScale }}
                src={service.image}
                alt={service.title}
                className="w-full h-80 md:h-[32rem] object-cover"
              />
            </motion.div>
          </div>
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
            What We Do
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight mt-6"
          >
            Three capabilities.
            <br />
            <span className="text-muted-foreground">Infinite possibilities.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mt-8"
          >
            We specialize in what matters most for your digital success.
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

      {/* Services */}
      <div className="bg-surface-elevated">
        {services.map((service, index) => (
          <ServiceSection key={service.title} service={service} index={index} />
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
            Ready to start building?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-background/60 text-lg max-w-md mx-auto mt-6"
          >
            Tell us about your project and let's create something extraordinary.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Button
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <Link to="/onboarding/website">
                Website Project <ArrowRight size={20} />
              </Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="border-background/30 text-background hover:bg-background/10"
              asChild
            >
              <Link to="/onboarding/app">
                App Project <ArrowRight size={20} />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
