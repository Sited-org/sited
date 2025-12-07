import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Globe, Smartphone, Zap, Check } from "lucide-react";

const ServiceSection = ({
  title,
  subtitle,
  description,
  features,
  icon: Icon,
  index,
  gradient,
}: {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: typeof Globe;
  index: number;
  gradient: string;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.9, 1, 1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [100, 0, 0, -100]);
  const textX = useTransform(
    scrollYProgress,
    [0, 0.3],
    [index % 2 === 0 ? -50 : 50, 0]
  );

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center relative overflow-hidden py-20"
    >
      {/* Ambient gradient background */}
      <motion.div
        style={{ opacity }}
        className={`absolute inset-0 ${gradient} opacity-30`}
      />
      
      {/* Floating orb */}
      <motion.div
        style={{ scale, y }}
        className="absolute w-[600px] h-[600px] rounded-full bg-accent/10 blur-3xl"
      />

      <div className="container-tight relative z-10">
        <motion.div
          style={{ opacity, y: textX }}
          className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${
            index % 2 === 1 ? "lg:flex-row-reverse" : ""
          }`}
        >
          {/* Content */}
          <div className={index % 2 === 1 ? "lg:order-2" : ""}>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4"
            >
              {subtitle}
            </motion.span>
            
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 leading-[1.1]"
            >
              {title}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-lg"
            >
              {description}
            </motion.p>

            <motion.ul
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-4"
            >
              {features.map((feature, i) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Check size={14} className="text-accent-foreground" />
                  </div>
                  <span className="text-foreground font-medium">{feature}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={index % 2 === 1 ? "lg:order-1" : ""}
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Glowing backdrop */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/5 rounded-3xl blur-xl" />
              
              {/* Main card */}
              <motion.div
                whileHover={{ scale: 1.02, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative h-full rounded-3xl bg-gradient-to-br from-card to-card/50 border border-border/50 backdrop-blur-sm flex items-center justify-center overflow-hidden"
              >
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="w-full h-full" style={{
                    backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                  }} />
                </div>
                
                {/* Icon */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Icon size={120} className="text-muted-foreground/20" strokeWidth={1} />
                </motion.div>
                
                {/* Corner accents */}
                <div className="absolute top-6 left-6 w-12 h-12 border-l-2 border-t-2 border-accent/30 rounded-tl-xl" />
                <div className="absolute bottom-6 right-6 w-12 h-12 border-r-2 border-b-2 border-accent/30 rounded-br-xl" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const services = [
  {
    icon: Globe,
    title: "Website Design & Development",
    subtitle: "Digital Presence",
    description:
      "We craft bespoke websites that don't just look beautiful—they perform. Every pixel is purposeful, every interaction meaningful. Your website becomes your most powerful sales tool.",
    features: [
      "Custom design tailored to your brand",
      "Mobile-first responsive development",
      "SEO-optimized structure",
      "Lightning-fast performance",
      "Conversion-focused UX",
    ],
    gradient: "bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10",
  },
  {
    icon: Smartphone,
    title: "App Building",
    subtitle: "Mobile Solutions",
    description:
      "Transform your ideas into powerful mobile applications. We build native and cross-platform apps that users love to open, day after day. Seamless experiences across iOS and Android.",
    features: [
      "Native iOS & Android apps",
      "Cross-platform development",
      "Intuitive user interfaces",
      "Push notifications & analytics",
      "App Store optimization",
    ],
    gradient: "bg-gradient-to-br from-violet-500/10 via-transparent to-purple-500/10",
  },
  {
    icon: Zap,
    title: "AI Integrations",
    subtitle: "Intelligent Automation",
    description:
      "Harness the power of artificial intelligence to automate workflows, personalize experiences, and unlock insights. Give your business an unfair advantage with smart technology.",
    features: [
      "Custom AI chatbots",
      "Intelligent automation",
      "Personalization engines",
      "Predictive analytics",
      "Content generation",
    ],
    gradient: "bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10",
  },
];

const Services = () => {
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
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-surface-elevated via-background to-background"
          style={{ opacity: heroOpacity }}
        />
        
        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/3 left-[10%] w-96 h-96 bg-accent/20 rounded-full blur-3xl"
          animate={{ y: [-30, 30, -30], x: [-10, 10, -10] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 right-[10%] w-72 h-72 bg-accent/30 rounded-full blur-3xl"
          animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 container-tight text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-secondary rounded-full px-5 py-2 mb-8"
          >
            <span className="text-sm font-medium uppercase tracking-wider">Our Services</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight leading-[1.05] mb-8"
          >
            Crafting digital
            <br />
            <span className="text-muted-foreground">experiences</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Three core capabilities. Infinite possibilities.
            <br />
            Every project is a journey of precision and craft.
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
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-muted-foreground/50 to-transparent" />
          </motion.div>
        </motion.div>
      </section>

      {/* Service Sections */}
      {services.map((service, index) => (
        <ServiceSection
          key={service.title}
          {...service}
          index={index}
        />
      ))}

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
            Ready to begin
            <br />
            your journey?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-background/60 text-lg max-w-xl mx-auto mb-12"
          >
            Tell us about your vision and let's create something extraordinary.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <Link to="/onboarding/website">
                Start Website Project <ArrowRight size={20} />
              </Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="border-background/30 text-background hover:bg-background/10"
              asChild
            >
              <Link to="/onboarding/app">
                Start App Project <ArrowRight size={20} />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
