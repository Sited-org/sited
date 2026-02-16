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
    "Monthly site integrity check — we compare your site against its last known state and flag anything that has changed without your knowledge.",
    "AI-powered performance overview — a clear report covering your site's speed, usability, SEO health, and conversion opportunities.",
    "Prioritised improvement recommendations — a ranked list of the changes that will have the biggest impact on your business.",
    "Implemented updates — a set number of changes made directly to your site each month as part of your plan.",
    "Direct access to your Sited team — one point of contact who knows your site and responds quickly.",
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
            The Sited Care Plan — Your Site, Monitored and Improved Every Month
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 sm:mb-10">
            Most web agencies disappear the moment your site goes live. Sited stays. The Care Plan is a monthly service that keeps your site healthy, up to date, and always improving. Every month, our team reviews your site, checks for any platform-level changes, runs a performance analysis, and delivers a prioritised list of improvements — with the most important ones implemented as part of your plan. You will never have to wonder if your site is still performing. We will tell you.
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
            Book a free 20-minute call with the Sited team. We will listen to what your business actually needs, tell you what we would build, and give you a clear quote — with no pressure and no obligation.
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
            Everything Your Business Needs Online
            <br />
            <span className="text-muted-foreground">— Built, Managed, and Always Improving</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mt-8 mb-12"
          >
            Sited delivers professional websites, digital tools, and business systems for growing companies. We build fast. We build well. And through our Care Plan, we ensure what we build keeps performing long after launch day.
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
        title="Websites That Work — For Your Business and Your Clients"
        description="Your website is the first place a potential client goes to decide whether to trust you. We build sites that make that decision easy — clean design, clear messaging, fast loading, and built to convert visitors into enquiries. Every site is custom-built for your brand and your audience, delivered in days, and connected to a version-controlled system so every change is tracked and every previous state can be restored."
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
        title="A CRM That Fits Your Business — Not the Other Way Around"
        description="Off-the-shelf CRMs force your team to adapt to their way of working. We build CRM systems around your actual processes — your pipeline stages, your client categories, your reporting needs. The result is a system your team will actually use, because it makes their job easier rather than adding complexity. We also build in the integrations you need from day one, so your CRM talks to your other tools without manual data entry."
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
        title="See the Numbers That Matter — At a Glance"
        description="Most businesses are sitting on data they cannot easily read. We build admin dashboards that surface the information you actually need — revenue, leads, pipeline, performance — in a format that is clear, fast, and accessible from any device. No spreadsheet exports. No waiting for a report. Just your business data, presented usefully."
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
        title="Give Your Clients a Professional Home — Branded to You"
        description="A client portal tells your clients that you take your service seriously. It gives them a dedicated, branded space to access their documents, sign off on deliverables, track progress, and communicate with your team — all without the clutter of email chains. We build portals that feel like a premium extension of your brand, and they are ready to use within days."
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
