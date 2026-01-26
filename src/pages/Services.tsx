import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Calendar, Users, Receipt } from "lucide-react";
import CalendarMockup from "@/components/services/CalendarMockup";
import CRMMockup from "@/components/services/CRMMockup";
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
    <section ref={ref} className="py-32 sm:py-40 relative">
      <div className="container-tight">
        <div className={`grid lg:grid-cols-2 gap-16 lg:gap-24 items-center ${reversed ? "lg:grid-flow-dense" : ""}`}>
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: reversed ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={reversed ? "lg:col-start-2" : ""}
          >
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mt-4 mb-6">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {description}
            </p>
            <Button variant="outline" size="lg" asChild>
              <Link to="/onboarding/website" className="gap-2">
                Learn More
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

// Final CTA section
const CTASection = () => {
  return (
    <section className="py-32 sm:py-40 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="container-tight relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-8">
            Ready to build
            <br />
            <span className="text-muted-foreground">something real?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-12">
            Your website should work as hard as you do. Let's create something that actually moves the needle.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" variant="hero" asChild>
              <Link to="/onboarding/website" className="gap-2">
                Start Your Project
                <ArrowRight size={20} />
              </Link>
            </Button>
            <Button size="xl" variant="ghost" asChild>
              <Link to="/work">See Our Work</Link>
            </Button>
          </div>
        </motion.div>
      </div>
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
            One thing
            <br />
            <span className="text-muted-foreground">done right.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mt-8 mb-12"
          >
            We build websites that do more than look good—they book appointments, 
            manage customers, and accept payments. All in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="xl" variant="hero" asChild>
              <Link to="/onboarding/website" className="gap-2">
                Start Your Project
                <ArrowRight size={20} />
              </Link>
            </Button>
            <Button size="xl" variant="ghost" asChild>
              <Link to="/work">See What We Build</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Icons */}
      <section className="py-20 border-y border-border/50 bg-surface-elevated">
        <div className="container-tight">
          <div className="grid grid-cols-3 gap-8 sm:gap-12">
            {[
              { icon: Calendar, label: "Booking Systems" },
              { icon: Users, label: "Customer Management" },
              { icon: Receipt, label: "Invoicing & Payments" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4"
                >
                  <item.icon size={24} className="text-foreground" />
                </motion.div>
                <p className="text-sm font-medium">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Calendar Booking Showcase */}
      <ShowcaseSection
        label="Scheduling"
        title="Let clients book themselves"
        description="No more back-and-forth emails. Your website becomes a 24/7 booking assistant that syncs with your calendar and sends automatic reminders."
      >
        <CalendarMockup />
      </ShowcaseSection>

      {/* Divider */}
      <div className="container-tight">
        <div className="h-px bg-border/50" />
      </div>

      {/* CRM Showcase */}
      <ShowcaseSection
        label="Customer Management"
        title="Know your customers"
        description="A CRM built into your website means every lead, every conversation, and every sale is tracked. No separate tools, no lost opportunities."
        reversed
      >
        <CRMMockup />
      </ShowcaseSection>

      {/* Divider */}
      <div className="container-tight">
        <div className="h-px bg-border/50" />
      </div>

      {/* Invoice Showcase */}
      <ShowcaseSection
        label="Payments"
        title="Get paid faster"
        description="Send professional invoices, accept payments online, and track everything in one place. Your website becomes your billing department."
      >
        <InvoiceMockup />
      </ShowcaseSection>

      {/* CTA */}
      <CTASection />
    </Layout>
  );
};

export default Services;
