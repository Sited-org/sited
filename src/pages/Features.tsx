import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Search, Clock, Sparkles } from "lucide-react";
import { usePageSEO } from "@/hooks/usePageSEO";
import CalendarMockup from "@/components/services/CalendarMockup";
import CRMMockup from "@/components/services/CRMMockup";
import ClientProfileMockup from "@/components/services/ClientProfileMockup";
import ClientPortalMockup from "@/components/services/ClientPortalMockup";
import InvoiceMockup from "@/components/services/InvoiceMockup";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";

const valueBlocks = [
  {
    icon: TrendingUp,
    title: "More Leads",
    description: "Websites designed to convert visitors into real enquiries — not just look pretty.",
  },
  {
    icon: Search,
    title: "Dominant SEO",
    description: "Rank higher than your competitors. We build SEO into every page from day one.",
  },
  {
    icon: Clock,
    title: "Less Work",
    description: "Automated systems handle the repetitive stuff so you can focus on delivering.",
  },
  {
    icon: Sparkles,
    title: "More Time Doing What You're Good At",
    description: "Stop juggling tools. We build one system that handles it all.",
  },
];

// Reusable showcase section
const ShowcaseSection = ({
  children,
  label,
  title,
  description,
  reversed = false,
  onCta,
}: {
  children: React.ReactNode;
  label: string;
  title: string;
  description: string;
  reversed?: boolean;
  onCta: () => void;
}) => (
  <section className="py-16 sm:py-24 lg:py-32 relative">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${reversed ? "lg:grid-flow-dense" : ""}`}>
        <motion.div
          initial={{ opacity: 0, x: reversed ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={reversed ? "lg:col-start-2" : ""}
        >
          <span className="text-xs uppercase tracking-[0.2em] text-sited-blue font-semibold">{label}</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mt-3 mb-4 text-foreground">
            {title}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-6">
            {description}
          </p>
          <button
            onClick={onCta}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sited-blue text-white font-semibold text-sm hover:bg-sited-blue-hover transition-colors"
          >
            Start a Project <ArrowRight size={16} />
          </button>
        </motion.div>
        <div className={reversed ? "lg:col-start-1" : ""}>
          {children}
        </div>
      </div>
    </div>
  </section>
);

const Divider = () => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6">
    <div className="h-px bg-border/50" />
  </div>
);

const Features = () => {
  usePageSEO({
    title: "Features | Sited — More Leads, Dominant SEO, Less Work",
    description: "Sited builds websites, CRMs, client portals and dashboards that generate more leads, dominate SEO, and save you time.",
  });

  const [ctaOpen, setCtaOpen] = useState(false);

  return (
    <Layout>
      <LeadCaptureDialog open={ctaOpen} onOpenChange={setCtaOpen} />

      <div className="overflow-x-hidden w-full">
        {/* Hero */}
        <section className="min-h-[70vh] flex items-center justify-center relative pt-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl sm:text-7xl lg:text-[8rem] font-black tracking-tighter leading-[0.85] text-foreground uppercase"
            >
              Built to
              <br />
              <span className="text-sited-blue">Perform.</span>
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-8"
            >
              <button
                onClick={() => setCtaOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-sited-blue text-white font-bold text-lg hover:bg-sited-blue-hover transition-colors shadow-elevated"
              >
                Start a Project <ArrowRight size={20} />
              </button>
            </motion.div>
          </div>
        </section>

        {/* Value Blocks */}
        <section className="bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {valueBlocks.map((block, i) => {
                const Icon = block.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="bg-card border border-border rounded-xl p-6 text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-sited-blue/15 flex items-center justify-center mx-auto mb-4">
                      <Icon size={22} className="text-sited-blue" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{block.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{block.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bold Transition */}
        <section className="bg-sited-blue">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight"
            >
              Need somewhere to manage your leads?
              <br />
              <span className="text-white/60">We build that too.</span>
            </motion.h2>
          </div>
        </section>

        {/* Mockup Showcases */}
        <ShowcaseSection
          label="CRM Systems"
          title="A CRM Built Around You"
          description="We build CRMs around your actual processes — your pipeline, your categories, your reporting. A system your team will actually use."
          onCta={() => setCtaOpen(true)}
        >
          <CRMMockup />
        </ShowcaseSection>

        <Divider />

        <ShowcaseSection
          label="Admin Dashboards"
          title="Your Numbers, At a Glance"
          description="Revenue, leads, pipeline, performance — surfaced clearly and accessible from any device. No spreadsheets, no waiting."
          onCta={() => setCtaOpen(true)}
          reversed
        >
          <ClientProfileMockup />
        </ShowcaseSection>

        <Divider />

        <ShowcaseSection
          label="Website Design & Development"
          title="Websites That Convert"
          description="Clean design, clear messaging, fast loading — built to turn visitors into enquiries. Custom-built for your brand, delivered in days."
          onCta={() => setCtaOpen(true)}
        >
          <CalendarMockup />
        </ShowcaseSection>

        <Divider />

        <ShowcaseSection
          label="Client Portals"
          title="Client Portals, Branded to You"
          description="A dedicated space for your clients to access documents, track progress, and communicate — without the email clutter."
          onCta={() => setCtaOpen(true)}
          reversed
        >
          <ClientPortalMockup />
        </ShowcaseSection>

        <Divider />

        <ShowcaseSection
          label="Payment Integrations"
          title="Get Paid Faster"
          description="Automated invoicing, instant card payments, and bank transfers — all built into your system. No chasing, no delays."
          onCta={() => setCtaOpen(true)}
        >
          <InvoiceMockup />
        </ShowcaseSection>

        {/* Final CTA */}
        <section className="bg-sited-blue">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white"
            >
              Not sure what you need?
              <br />
              <span className="text-white/60">That's what the consultation is for.</span>
            </motion.h2>
            <p className="mt-4 text-base text-white/70 max-w-xl mx-auto">
              Free 20-minute call. We listen, advise, and give you a clear quote — no pressure.
            </p>
            <button
              onClick={() => setCtaOpen(true)}
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gold text-foreground font-bold text-lg hover:bg-gold-hover transition-colors"
            >
              Start a Project <ArrowRight size={20} />
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Features;
