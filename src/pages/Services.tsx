import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { usePageSEO } from "@/hooks/usePageSEO";
import CalendarMockup from "@/components/services/CalendarMockup";
import CRMMockup from "@/components/services/CRMMockup";
import ClientProfileMockup from "@/components/services/ClientProfileMockup";
import InvoiceMockup from "@/components/services/InvoiceMockup";

// Section wrapper with consistent spacing
const ShowcaseSection = ({ 
  children, 
  label, 
  title, 
  description,
  reversed = false 
}: { 
  children: React.ReactNode; 
  label: string;
  title: string;
  description: string;
  reversed?: boolean;
}) => {
  const ref = useRef(null);
  
  return (
    <section ref={ref} className="py-20 sm:py-32 lg:py-40 relative">
      <div className="container-tight px-4 sm:px-6">
        <div className={`grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-20 items-center ${reversed ? "lg:grid-flow-dense" : ""}`}>
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: reversed ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={reversed ? "lg:col-start-2" : ""}
          >
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mt-3 sm:mt-4 mb-4 sm:mb-6">
              {title}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8">
              {description}
            </p>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <Link to="/contact" className="gap-2">
                Book a Free Consultation
                <ArrowRight size={18} />
              </Link>
            </Button>
          </motion.div>

          {/* Mockup */}
          <div className={reversed ? "lg:col-start-1" : ""}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

// Care Plan section
const CarePlanSection = () => {
  const features = [
    "Monthly integrity check — flagging any unexpected changes.",
    "Performance overview — speed, SEO, usability, and conversions.",
    "Prioritised recommendations — ranked by business impact.",
    "Implemented updates — changes made directly each month.",
    "Direct access — one point of contact who knows your site.",
  ];

  return (
    <section className="py-20 sm:py-32 lg:py-40 relative">
      <div className="container-tight px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Monthly Retainer</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mt-3 sm:mt-4 mb-4 sm:mb-6">
            The Sited Care Plan
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 sm:mb-10">
            Most agencies disappear after launch. We stay. Every month, we review your site, run a performance analysis, and implement improvements. You never have to wonder if your site is still performing.
          </p>
          <div className="space-y-4 mb-8 sm:mb-10">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <CheckCircle size={20} className="text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature}</p>
              </motion.div>
            ))}
          </div>
          <Button variant="hero" size="lg" asChild>
            <Link to="/contact" className="gap-2">
              Add Your Site to a Care Plan
              <ArrowRight size={18} />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

// Final CTA section
const CTASection = () => {
  return (
    <section className="py-20 sm:py-32 lg:py-40 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-64 h-48 sm:h-64 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="container-tight relative z-10 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight mb-6 sm:mb-8">
            Not sure what you need?
            <br />
            <span className="text-muted-foreground">That's what the consultation is for.</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-8 sm:mb-12">
            Free 20-minute call. We listen, advise, and give you a clear quote — no pressure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button size="xl" variant="hero" asChild className="w-full sm:w-auto">
              <Link to="/contact" className="gap-2">
                Book a Free Consultation
                <ArrowRight size={20} />
              </Link>
            </Button>
            <Button size="xl" variant="ghost" asChild className="w-full sm:w-auto">
              <Link to="/work">See Our Work</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Services = () => {
  usePageSEO({
    title: "What We Build | Sited — Websites, CRMs, Portals & Dashboards",
    description: "Sited builds professional websites, CRM systems, client portals, admin dashboards, and landing pages for growing businesses — with ongoing monthly care through the Sited Care Plan.",
  });

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <Layout>
      {/* Prevent horizontal scroll */}
      <div className="overflow-x-hidden w-full">
      {/* Hero */}
      <section
        ref={heroRef}
        className="min-h-[80vh] flex items-center justify-center relative overflow-hidden pt-20"
      >
        {/* Subtle animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 container-tight text-center px-4"
        >
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight leading-[1.1]"
          >
            One Thing Done Right.
            <br />
            <span className="text-muted-foreground">Built, Managed, Improved.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mt-8 mb-12"
          >
            Professional websites, portals, CRMs, and dashboards — built fast and kept running through our monthly Care Plan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="xl" variant="hero" asChild>
              <Link to="/contact" className="gap-2">
                Book a Free Consultation
                <ArrowRight size={20} />
              </Link>
            </Button>
            <Button size="xl" variant="ghost" asChild>
              <Link to="/work">See Our Work</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Website Design Showcase */}
      <ShowcaseSection
        label="Website Design & Development"
        title="Websites That Convert"
        description="Clean design, clear messaging, fast loading — built to turn visitors into enquiries. Custom-built for your brand, delivered in days."
      >
        <CalendarMockup />
      </ShowcaseSection>

      {/* Divider */}
      <div className="container-tight px-4 sm:px-6">
        <div className="h-px bg-border/50" />
      </div>

      {/* CRM Showcase */}
      <ShowcaseSection
        label="CRM Systems"
        title="A CRM Built Around You"
        description="We build CRMs around your actual processes — your pipeline, your categories, your reporting. A system your team will actually use."
        reversed
      >
        <CRMMockup />
      </ShowcaseSection>

      {/* Divider */}
      <div className="container-tight px-4 sm:px-6">
        <div className="h-px bg-border/50" />
      </div>

      {/* Admin Dashboard Showcase */}
      <ShowcaseSection
        label="Admin Dashboards"
        title="Your Numbers, At a Glance"
        description="Revenue, leads, pipeline, performance — surfaced clearly and accessible from any device. No spreadsheets, no waiting."
      >
        <ClientProfileMockup />
      </ShowcaseSection>

      {/* Divider */}
      <div className="container-tight px-4 sm:px-6">
        <div className="h-px bg-border/50" />
      </div>

      {/* Client Portal Showcase */}
      <ShowcaseSection
        label="Client Portals"
        title="Client Portals, Branded to You"
        description="A dedicated space for your clients to access documents, track progress, and communicate — without the email clutter. Ready in days."
        reversed
      >
        <InvoiceMockup />
      </ShowcaseSection>

      {/* Divider */}
      <div className="container-tight px-4 sm:px-6">
        <div className="h-px bg-border/50" />
      </div>

      {/* Care Plan */}
      <CarePlanSection />

      {/* CTA */}
      <CTASection />
      </div>
    </Layout>
  );
};

export default Services;
