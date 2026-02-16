import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { usePageSEO } from "@/hooks/usePageSEO";

const tiers = [
  {
    name: "Starter — Landing Page",
    description: "A single, high-converting landing page for a campaign, product launch, or service offering. Designed to capture attention and drive one clear action. Delivered within 2–3 business days.",
  },
  {
    name: "Professional — Website",
    description: "A full business website with up to 6 pages, custom design, contact forms, and SEO foundations. This is your digital storefront — built professionally, connected to version control, and ready to represent your business from day one.",
  },
  {
    name: "Advanced — CRM / Portal / Dashboard",
    description: "Custom-built business systems — CRMs, client portals, or admin dashboards — designed around your specific workflows. Scope is agreed in detail before work begins. Every build includes full documentation and version-controlled code.",
  },
];

const carePlanFeatures = [
  "Monthly site integrity check",
  "AI-powered performance overview",
  "Prioritised improvement recommendations",
  "Implemented updates each month",
  "Direct access to your Sited team",
];

const Pricing = () => {
  usePageSEO({
    title: "Pricing | Sited — Transparent Build Fees & Monthly Care Plans",
    description: "Clear, fixed pricing for website builds, CRMs, portals, and dashboards — plus the Sited Care Plan for ongoing monthly monitoring and improvements. No hidden fees. No surprises.",
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 bg-gradient-to-b from-surface-elevated to-background">
        <div className="container-tight text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">
              Pricing
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight mb-4 sm:mb-6"
          >
            Clear Pricing. No Surprises.
            <br />
            <span className="text-muted-foreground">No Jargon.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2"
          >
            We believe in straightforward pricing that reflects the value we deliver. Every project starts with a fixed build fee — no hidden costs, no scope creep conversations. After launch, we recommend adding your site to a Care Plan so it continues to perform and improve every month.
          </motion.p>
        </div>
      </section>

      {/* Build Pricing */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          <ScrollReveal>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">One-Time Build</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mt-3 mb-4">
              Build Pricing — Pay Once, Own It Forever
            </h2>
          </ScrollReveal>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {tiers.map((tier, index) => (
              <ScrollReveal key={tier.name} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 sm:p-8 rounded-2xl border border-border bg-card hover:shadow-elevated transition-all duration-300 h-full flex flex-col"
                >
                  <h3 className="text-lg sm:text-xl font-semibold mb-3">{tier.name}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed flex-1">{tier.description}</p>
                  <Button variant="outline" size="lg" asChild className="mt-6 w-full">
                    <Link to="/contact" className="gap-2">
                      Book a Free Consultation
                      <ArrowRight size={18} />
                    </Link>
                  </Button>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Care Plan Pricing */}
      <section className="section-padding bg-surface-elevated">
        <div className="container-tight">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Monthly Retainer</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mt-3 mb-4">
                The Sited Care Plan — Monthly Retainer
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                Your website is not a finished product — it is a business asset that needs attention. The Care Plan keeps your site monitored, maintained, and continuously improving. Available to all Sited-built sites and to sites built elsewhere.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                Each month, your Sited team runs a full site integrity check, delivers an AI-powered performance overview, and implements a set of agreed improvements directly to your site. You receive a clear written report of what was checked, what changed, and what we recommend next.
              </p>
            </ScrollReveal>

            <div className="space-y-3 mb-8">
              {carePlanFeatures.map((feature, index) => (
                <ScrollReveal key={feature} delay={0.2 + index * 0.05}>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-accent flex-shrink-0" />
                    <p className="text-sm sm:text-base">{feature}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={0.4}>
              <Button variant="hero" size="lg" asChild>
                <Link to="/contact" className="gap-2">
                  Add Your Site to a Care Plan
                  <ArrowRight size={18} />
                </Link>
              </Button>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section-padding bg-foreground text-background">
        <div className="container-tight text-center">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4 sm:mb-6">
              Not sure what you need? That's what the consultation is for.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="text-background/70 text-base sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10">
              Book a free 20-minute call with the Sited team. We will listen to what your business actually needs, tell you what we would build, and give you a clear quote — with no pressure and no obligation.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <Button
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <Link to="/contact">
                Book a Free Consultation <ArrowRight size={20} />
              </Link>
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Pricing;
