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
import BookingDialog from "@/components/booking/BookingDialog";
import { ThemeSwitchSection } from "@/components/common/ThemeSwitchSection";

const valueBlocks = [
  {
    icon: TrendingUp,
    title: "More Leads",
    accent: "Every page is built to convert.",
    description: "A beautiful website means nothing if it doesn't bring in business. We design every element — from headlines to call-to-actions — around one goal: turning visitors into paying customers. Strategic layouts, clear messaging, and fast load times mean your site works as hard as you do.",
    stats: [
      { value: "3x", label: "More enquiries on average" },
      { value: "< 2s", label: "Page load time" },
      { value: "40%", label: "Higher conversion rates" },
    ],
  },
  {
    icon: Search,
    title: "Dominant SEO",
    accent: "Be found before your competitors.",
    description: "We don't bolt SEO on at the end — it's baked into the foundation. Proper heading structures, optimised metadata, lightning-fast performance scores, and clean code that Google loves. Whether it's local search or industry keywords, your site is built to rank and stay ranked.",
    stats: [
      { value: "Page 1", label: "Google rankings" },
      { value: "95+", label: "Performance score" },
      { value: "100%", label: "SEO best practices" },
    ],
  },
  {
    icon: Clock,
    title: "Less Work",
    accent: "Automate the stuff you hate doing.",
    description: "Manual follow-ups, chasing invoices, updating spreadsheets — it all adds up. We build systems that handle the repetitive admin so you don't have to. Automated emails, built-in CRMs, client portals, and invoicing that runs itself. Less busywork, more breathing room.",
    stats: [
      { value: "10+", label: "Hours saved per week" },
      { value: "Zero", label: "Spreadsheets needed" },
      { value: "24/7", label: "Systems working for you" },
    ],
  },
  {
    icon: Sparkles,
    title: "More Time",
    accent: "Focus on your craft, not your website.",
    description: "You started your business because you're great at what you do — not because you love wrestling with technology. We take the entire digital side off your plate: design, development, hosting, updates, and support. You focus on your clients. We handle the rest.",
    stats: [
      { value: "100%", label: "Managed for you" },
      { value: "Same day", label: "Support responses" },
      { value: "Unlimited", label: "Content updates" },
    ],
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
            See Offer <ArrowRight size={16} />
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
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <Layout>
      <LeadCaptureDialog open={ctaOpen} onOpenChange={setCtaOpen} />
      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />

      <div className="overflow-x-hidden w-full">
        {/* Hero */}
        <section className="min-h-screen flex items-center justify-center relative bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-6xl sm:text-8xl lg:text-[9rem] font-black tracking-tighter leading-[0.85] text-foreground uppercase"
            >
              What makes a
              <br />
              <span className="text-sited-blue">difference.</span>
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-8 sm:mt-10"
            >
              <button
                onClick={() => setCtaOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-sited-blue text-white font-bold text-lg hover:bg-sited-blue-hover transition-colors shadow-elevated"
              >
                Get a Quote <ArrowRight size={20} />
              </button>
            </motion.div>
          </div>
        </section>

        {/* Value Blocks */}
        {valueBlocks.map((block, i) => {
          const Icon = block.icon;
          const isEven = i % 2 === 0;
          // Wrap alternating blocks in ThemeSwitchSection for the dark→light scroll effect
          const Wrapper = !isEven ? ThemeSwitchSection : "section" as any;
          return (
            <Wrapper key={i} className={isEven ? "bg-background" : "bg-card border-y border-border"}>
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-sited-blue/15 flex items-center justify-center">
                      <Icon size={22} className="text-sited-blue" />
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-sited-blue font-bold">
                      0{i + 1}
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase leading-[0.95]">
                    {block.title}
                  </h2>
                  <p className="mt-3 text-lg sm:text-xl font-semibold text-sited-blue">
                    {block.accent}
                  </p>
                  <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                    {block.description}
                  </p>

                  {/* Stats row */}
                  <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-0 sm:divide-x sm:divide-border">
                    {block.stats.map((stat, j) => (
                      <motion.div
                        key={j}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 + j * 0.1 }}
                        className="sm:px-6 first:sm:pl-0"
                      >
                        <p className="text-2xl sm:text-3xl font-black text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </Wrapper>
          );
        })}

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

        {/* Mockup Showcases — always white so the genuine feature is visible */}
        <ShowcaseSection
          label="CRM Systems"
          title="A CRM Built Around You"
          description="We build CRMs around your actual processes — your pipeline, your categories, your reporting. A system your team will actually use."
          onCta={() => setCtaOpen(true)}
        >
          <div className="force-light rounded-xl overflow-hidden border border-border"><CRMMockup /></div>
        </ShowcaseSection>

        <Divider />

        <ShowcaseSection
          label="Admin Dashboards"
          title="Your Numbers, At a Glance"
          description="Revenue, leads, pipeline, performance — surfaced clearly and accessible from any device. No spreadsheets, no waiting."
          onCta={() => setCtaOpen(true)}
          reversed
        >
          <div className="force-light rounded-xl overflow-hidden border border-border"><ClientProfileMockup /></div>
        </ShowcaseSection>

        <Divider />

        <ShowcaseSection
          label="Website Design & Development"
          title="Websites That Convert"
          description="Clean design, clear messaging, fast loading — built to turn visitors into enquiries. Custom-built for your brand, delivered in days."
          onCta={() => setCtaOpen(true)}
        >
          <div className="force-light rounded-xl overflow-hidden border border-border"><CalendarMockup /></div>
        </ShowcaseSection>

        <Divider />

        <ShowcaseSection
          label="Client Portals"
          title="Client Portals, Branded to You"
          description="A dedicated space for your clients to access documents, track progress, and communicate — without the email clutter."
          onCta={() => setCtaOpen(true)}
          reversed
        >
          <div className="force-light rounded-xl overflow-hidden border border-border"><ClientPortalMockup /></div>
        </ShowcaseSection>

        <Divider />

        <ShowcaseSection
          label="Payment Integrations"
          title="Get Paid Faster"
          description="Automated invoicing, instant card payments, and bank transfers — all built into your system. No chasing, no delays."
          onCta={() => setCtaOpen(true)}
        >
          <div className="force-light rounded-xl overflow-hidden border border-border"><InvoiceMockup /></div>
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
              onClick={() => setBookingOpen(true)}
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gold text-foreground font-bold text-lg hover:bg-gold-hover transition-colors"
            >
              Book a Call <ArrowRight size={20} />
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Features;
