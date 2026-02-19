import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Star, Crown, ArrowRight, Globe, BarChart3, Users, Shield, Paintbrush, Smartphone, Search, Calendar, Mail, Lock, Headphones, Rocket } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import { usePageSEO } from "@/hooks/usePageSEO";

type Tier = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: typeof Zap;
  color: string;
  borderColor: string;
  bgColor: string;
  badgeColor: string;
  features: { text: string; description: string }[];
  idealFor: string;
};

const tiers: Tier[] = [
  {
    id: "blue",
    name: "Blue",
    tagline: "Get online. Get found. Get leads.",
    description: "A professionally built website designed to turn visitors into enquiries. Clean, fast, and built to perform — everything a growing business needs to start winning online.",
    icon: Zap,
    color: "text-sited-blue",
    borderColor: "border-sited-blue/30",
    bgColor: "bg-sited-blue/5",
    badgeColor: "bg-sited-blue text-white",
    idealFor: "Businesses ready to look professional and start generating leads from day one.",
    features: [
      { text: "Professionally designed website", description: "Custom-built to reflect your brand — no templates, no shortcuts." },
      { text: "Mobile-first responsive design", description: "Looks stunning on every device, from phones to desktops." },
      { text: "Contact & enquiry forms", description: "Capture leads directly from your site, straight to your inbox." },
      { text: "SEO foundations", description: "Built with search engines in mind so your customers can actually find you." },
      { text: "Email integration", description: "Connect your business email so nothing falls through the cracks." },
      { text: "Calendar booking", description: "Let clients book time with you directly — no back-and-forth." },
    ],
  },
  {
    id: "gold",
    name: "Gold",
    tagline: "More than a website. A business engine.",
    description: "Everything in Blue, plus the tools to manage your leads, track your pipeline, and give clients their own portal. For businesses serious about growth.",
    icon: Star,
    color: "text-gold",
    borderColor: "border-gold/30",
    bgColor: "bg-gold/5",
    badgeColor: "bg-gold text-foreground",
    idealFor: "Established businesses that want to manage clients, track leads, and automate follow-ups.",
    features: [
      { text: "Everything in Blue", description: "All the essentials, already included." },
      { text: "High-converting landing pages", description: "Pages engineered to turn traffic into paying customers." },
      { text: "Admin dashboard", description: "See every lead, every client, every metric — all in one place." },
      { text: "Lead management CRM", description: "Track, tag, and follow up with leads without missing a beat." },
      { text: "Client portal access", description: "Give your clients a branded login to view progress, files, and updates." },
      { text: "Full integrations suite", description: "Connect payments, calendars, email, and more — seamlessly." },
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    tagline: "The unfair advantage.",
    description: "The full Sited experience. Premium design, advanced SEO, priority delivery, and every tool we offer — built for businesses that refuse to settle.",
    icon: Crown,
    color: "text-purple-500",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/5",
    badgeColor: "bg-purple-600 text-white",
    idealFor: "Ambitious businesses that want the best — no compromises, no waiting.",
    features: [
      { text: "Everything in Gold", description: "Every feature, every integration, already in the box." },
      { text: "Premium bespoke design", description: "Highest-quality visuals, animations, and interactions — your site will turn heads." },
      { text: "Advanced SEO package", description: "Deep keyword strategy, schema markup, and performance tuning to dominate search." },
      { text: "Priority delivery", description: "Jump the queue. Your project moves to the front of the line." },
      { text: "Dedicated support", description: "A direct line when you need us — fast responses, real solutions." },
      { text: "Advanced analytics & reporting", description: "Know exactly what's working, what's not, and where to double down." },
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const CustomWebsites = () => {
  const [ctaOpen, setCtaOpen] = useState(false);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  usePageSEO({
    title: "Custom Websites | Sited — Built to Convert",
    description: "Professional websites that turn clicks into clients. Choose Blue, Gold, or Platinum and get a site built around results.",
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden section-padding">
        <div className="absolute inset-0 bg-gradient-to-b from-sited-blue/5 via-transparent to-transparent pointer-events-none" />
        <div className="container-tight relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sited-blue/10 text-sited-blue text-xs font-black uppercase tracking-wider border border-sited-blue/20 mb-6">
              <Globe size={14} />
              Custom built for your business
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-[0.95]">
              Turn <span className="text-sited-blue">clicks</span> into{" "}
              <span className="text-sited-blue">clients</span>, quick.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Every Sited website is built with one goal — to bring you more business. 
              No templates. No guesswork. Just a site that works as hard as you do.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCtaOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-sited-blue hover:bg-sited-blue-hover text-white font-black text-sm uppercase tracking-wider transition-colors"
              >
                Get started today
                <ArrowRight size={16} />
              </motion.button>
              <a
                href="/portfolio"
                className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                See our work
                <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What you get with every site */}
      <section className="section-padding bg-secondary/30">
        <div className="container-tight">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl sm:text-4xl font-black tracking-tight text-foreground"
            >
              Every site. Every time.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto"
            >
              No matter which package you choose, these come standard.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { icon: Paintbrush, label: "Custom design", desc: "Built from scratch for your brand" },
              { icon: Smartphone, label: "Mobile ready", desc: "Perfect on every screen size" },
              { icon: Search, label: "SEO built in", desc: "Found by the right people" },
              { icon: Rocket, label: "Fast loading", desc: "Speed that keeps visitors around" },
              { icon: Mail, label: "Email connected", desc: "Enquiries straight to your inbox" },
              { icon: Calendar, label: "Booking system", desc: "Clients book directly with you" },
              { icon: Lock, label: "SSL secured", desc: "Safe and trusted by browsers" },
              { icon: Headphones, label: "Ongoing support", desc: "We're here when you need us" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                custom={i}
                className="p-4 rounded-xl border border-border bg-card text-center"
              >
                <item.icon size={24} className="mx-auto text-sited-blue mb-2" />
                <p className="text-sm font-bold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tier Showcase */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl sm:text-4xl font-black tracking-tight text-foreground"
            >
              Three packages. One goal.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto"
            >
              More business. Whichever you pick.
            </motion.p>
          </motion.div>

          <div className="space-y-8">
            {tiers.map((tier, tierIndex) => {
              const Icon = tier.icon;
              const isExpanded = expandedTier === tier.id;

              return (
                <motion.div
                  key={tier.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeUp}
                  custom={tierIndex}
                  className={`rounded-2xl border-2 ${tier.borderColor} ${tier.bgColor} overflow-hidden transition-all`}
                >
                  <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-background border border-border">
                          <Icon size={24} className={tier.color} />
                        </div>
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${tier.badgeColor}`}>
                            {tier.name}
                          </span>
                          <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">
                            {tier.tagline}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-muted-foreground text-base mb-6 max-w-2xl">
                      {tier.description}
                    </p>

                    {/* Features grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {tier.features.map((feature, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 p-3 rounded-lg bg-background/60 border border-border/50"
                        >
                          <Check size={16} className="text-sited-blue flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-foreground">{feature.text}</p>
                            {isExpanded && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-xs text-muted-foreground mt-1"
                              >
                                {feature.description}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ideal for + Toggle */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">Ideal for:</span> {tier.idealFor}
                      </p>
                      <button
                        onClick={() => setExpandedTier(isExpanded ? null : tier.id)}
                        className="text-xs font-bold text-sited-blue hover:text-sited-blue-hover transition-colors"
                      >
                        {isExpanded ? "Show less" : "Learn more"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding bg-secondary/30">
        <div className="container-tight">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl sm:text-4xl font-black tracking-tight text-foreground"
            >
              Simple. Straightforward. Sorted.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {[
              { step: "01", title: "Tell us about your business", desc: "A quick discovery call to understand your goals, your customers, and what success looks like for you." },
              { step: "02", title: "We build it around results", desc: "Your site is designed and developed with one focus — turning visitors into customers." },
              { step: "03", title: "Launch and grow", desc: "Go live with confidence. We manage, maintain, and optimise so you can focus on running your business." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                custom={i}
                className="text-center p-6 rounded-xl border border-border bg-card"
              >
                <span className="text-4xl font-black text-sited-blue/20">{item.step}</span>
                <h3 className="text-lg font-black text-foreground mt-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Ready to stop losing customers to a bad website?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Book a free discovery call. We'll show you exactly what's possible — no pressure, no jargon, just straight answers.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCtaOpen(true)}
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-sited-blue hover:bg-sited-blue-hover text-white font-black text-sm uppercase tracking-wider transition-colors"
            >
              Let's talk
              <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <LeadCaptureDialog open={ctaOpen} onOpenChange={setCtaOpen} />
    </Layout>
  );
};

export default CustomWebsites;
