import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, Globe, Smartphone, Zap, Play } from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "Websites",
    tagline: "Built to convert.",
    stat: "3x",
    statLabel: "More Conversions",
    features: ["Custom Design", "Lightning Fast", "SEO Ready", "Monthly Updates"],
    cta: { text: "Build My Website", link: "/onboarding/website" },
    gradient: "from-blue-500/20 to-cyan-500/20",
    accentColor: "text-blue-400",
  },
  {
    icon: Smartphone,
    title: "Apps",
    tagline: "People actually use.",
    stat: "4.8★",
    statLabel: "Avg. Rating",
    features: ["iOS & Android", "Your Idea", "Make Money", "User Friendly"],
    cta: { text: "Build My App", link: "/onboarding/app" },
    gradient: "from-purple-500/20 to-pink-500/20",
    accentColor: "text-purple-400",
  },
  {
    icon: Zap,
    title: "AI Automation",
    tagline: "That works for you.",
    stat: "60%",
    statLabel: "Time Saved",
    features: ["Smart Automation", "Remove Human Error", "24/7 Active", "Custom to Your Business"],
    cta: { text: "Add AI Power", link: "/onboarding/ai" },
    gradient: "from-amber-500/20 to-orange-500/20",
    accentColor: "text-amber-400",
  },
];

const ServiceCard = ({
  service,
  index,
}: {
  service: typeof services[0];
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = service.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${service.gradient} p-px`}>
        <div className="relative bg-card rounded-[23px] p-8 sm:p-10 md:p-12 h-full">
          {/* Background glow on hover */}
          <motion.div
            animate={{ opacity: isHovered ? 0.5 : 0 }}
            className={`absolute inset-0 bg-gradient-to-br ${service.gradient} blur-3xl`}
          />

          <div className="relative z-10">
            {/* Icon & Title */}
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 5 : 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center`}
              >
                <Icon size={26} className={service.accentColor} />
              </motion.div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">{service.title}</h3>
                <p className="text-muted-foreground">{service.tagline}</p>
              </div>
            </div>

            {/* Big Stat */}
            <div className="my-8 sm:my-10">
              <motion.span
                animate={{ scale: isHovered ? 1.05 : 1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter"
              >
                {service.stat}
              </motion.span>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 uppercase tracking-wider">
                {service.statLabel}
              </p>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-2 mb-8">
              {service.features.map((feature) => (
                <span
                  key={feature}
                  className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-background/50 border border-border/50"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* CTA */}
            <Button 
              size="lg" 
              className="w-full group/btn relative overflow-hidden" 
              asChild
            >
              <Link to={service.cta.link}>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {service.cta.text}
                  <motion.span
                    animate={{ x: isHovered ? 4 : 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <ArrowRight size={18} />
                  </motion.span>
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
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

  return (
    <Layout>
      {/* Hero */}
      <section
        ref={heroRef}
        className="min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center relative pt-20"
      >
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="container-tight text-center"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight"
          >
            Three things.
            <br />
            <span className="text-muted-foreground">Done right.</span>
          </motion.h1>
        </motion.div>
      </section>

      {/* Services Grid */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.map((service, index) => (
              <ServiceCard key={service.title} service={service} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 sm:py-32 md:py-40 bg-surface-elevated">
        <div className="container-tight text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
              Ready to start?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto mb-10">
              Tell us about your project. We'll handle the rest.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-base px-8 py-6" asChild>
                <Link to="/contact">
                  Start a Project
                  <ArrowRight size={20} className="ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-base" asChild>
                <Link to="/work" className="flex items-center gap-2">
                  <Play size={18} className="fill-current" />
                  Watch Success Stories
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
