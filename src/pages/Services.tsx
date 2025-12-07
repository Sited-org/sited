import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Globe,
  Smartphone,
  Palette,
  Zap,
  Search,
  Shield,
  BarChart3,
  Headphones,
  ArrowRight,
  Check,
} from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "Website Design & Development",
    description:
      "Custom websites built from the ground up. Responsive, fast, and optimized for conversions.",
    features: [
      "Custom design tailored to your brand",
      "Mobile-first responsive development",
      "SEO-optimized structure",
      "Fast loading speeds",
      "CMS integration",
    ],
  },
  {
    icon: Smartphone,
    title: "Mobile App Development",
    description:
      "Native and cross-platform apps that deliver seamless experiences across iOS and Android.",
    features: [
      "iOS and Android development",
      "Cross-platform solutions",
      "App Store optimization",
      "Push notifications",
      "Analytics integration",
    ],
  },
  {
    icon: Palette,
    title: "Brand Identity Design",
    description:
      "Complete visual identity systems that make your business stand out and stay memorable.",
    features: [
      "Logo design",
      "Color palette & typography",
      "Brand guidelines",
      "Marketing collateral",
      "Social media assets",
    ],
  },
  {
    icon: Zap,
    title: "AI Integration",
    description:
      "Smart features and automation powered by AI to give your business a competitive advantage.",
    features: [
      "Chatbots & virtual assistants",
      "Personalization engines",
      "Predictive analytics",
      "Content generation",
      "Process automation",
    ],
  },
  {
    icon: Search,
    title: "SEO & Marketing",
    description:
      "Drive organic traffic and visibility with data-driven search engine optimization.",
    features: [
      "Keyword research & strategy",
      "On-page optimization",
      "Technical SEO audits",
      "Content strategy",
      "Performance tracking",
    ],
  },
  {
    icon: Shield,
    title: "Maintenance & Support",
    description:
      "Keep your digital assets running smoothly with ongoing maintenance and support.",
    features: [
      "Security updates",
      "Performance monitoring",
      "Bug fixes & improvements",
      "Content updates",
      "24/7 support available",
    ],
  },
];

const Services = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-surface-elevated to-background">
        <div className="container-tight text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
              Our Services
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6"
          >
            Everything you need to
            <br />
            <span className="text-muted-foreground">succeed online</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            From concept to launch, we provide comprehensive digital solutions
            tailored to your business needs.
          </motion.p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="space-y-24">
            {services.map((service, index) => (
              <ScrollReveal key={service.title} delay={0.1}>
                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-6">
                      <service.icon size={28} className="text-accent-foreground" />
                    </div>
                    <h2 className="text-3xl font-semibold mb-4">{service.title}</h2>
                    <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                      {service.description}
                    </p>
                    <ul className="space-y-3">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                            <Check size={12} className="text-accent-foreground" />
                          </div>
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                    <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <service.icon size={80} className="text-muted-foreground/30" />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-surface-elevated">
        <div className="container-tight text-center">
          <ScrollReveal>
            <SectionHeading
              eyebrow="Get Started"
              title="Ready to bring your vision to life?"
              description="Tell us about your project and we'll help you choose the right services."
            />
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/onboarding/website">
                  Start Website Project <ArrowRight size={20} />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/onboarding/app">
                  Start App Project <ArrowRight size={20} />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
