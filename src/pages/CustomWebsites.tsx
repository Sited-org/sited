import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check, Zap, Star, Crown, ArrowRight, Globe, Paintbrush, Smartphone, Search, Calendar, Mail, Lock, Headphones, Rocket, Quote, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import BookingDialog from "@/components/booking/BookingDialog";
import { usePageSEO } from "@/hooks/usePageSEO";
import { usePublicBlogPosts } from "@/hooks/useBlogPosts";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { format } from "date-fns";

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

const testTestimonials = [
  {
    name: "Sarah Mitchell",
    business: "Bloom & Co Floristry",
    text: "We went from barely getting found on Google to fully booked within three months. The website Sited built us doesn't just look good — it actually brings in business.",
    role: "Owner",
  },
  {
    name: "James Thornton",
    business: "Thornton Plumbing",
    text: "I was skeptical about paying for a website, but the ROI has been unreal. More calls, more bookings, and I don't have to chase leads anymore — they come to me.",
    role: "Director",
  },
  {
    name: "Priya Kapoor",
    business: "Kapoor Legal",
    text: "Our old site was embarrassing. Sited gave us something we're actually proud of — and our enquiry rate tripled in the first month. No exaggeration.",
    role: "Principal Solicitor",
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

const TestimonialCard = ({ testimonial, index }: { testimonial: typeof testTestimonials[0]; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [2, 0, -2]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.9, 1, 1, 0.95]);

  return (
    <motion.div
      ref={ref}
      style={{ y, rotate, scale }}
      className="p-6 sm:p-8 rounded-2xl border border-border bg-card relative overflow-hidden"
    >
      <Quote size={32} className="text-sited-blue/10 absolute top-4 right-4" />
      <p className="text-base text-foreground leading-relaxed mb-6 relative z-10">
        "{testimonial.text}"
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-sited-blue/10 flex items-center justify-center text-sited-blue font-black text-sm">
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{testimonial.name}</p>
          <p className="text-xs text-muted-foreground">{testimonial.role}, {testimonial.business}</p>
        </div>
      </div>
    </motion.div>
  );
};

const CustomWebsites = () => {
  const [ctaOpen, setCtaOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const { data: blogPosts } = usePublicBlogPosts();
  const recentPosts = (blogPosts || []).slice(0, 3);

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
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Every site. Every time.
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
              No matter which package you choose, these come standard.
            </motion.p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <ScrollReveal key={item.label} delay={i * 0.06} direction={i % 2 === 0 ? "left" : "right"}>
                <div className="p-4 rounded-xl border border-border bg-card text-center h-full">
                  <item.icon size={24} className="mx-auto text-sited-blue mb-2" />
                  <p className="text-sm font-bold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tier Showcase */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Three packages. One goal.
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-background border border-border">
                          <Icon size={24} className={tier.color} />
                        </div>
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${tier.badgeColor}`}>
                            {tier.name}
                          </span>
                          <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">{tier.tagline}</h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-muted-foreground text-base mb-6 max-w-2xl">{tier.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {tier.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-background/60 border border-border/50">
                          <Check size={16} className="text-sited-blue flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-foreground">{feature.text}</p>
                            {isExpanded && (
                              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-xs text-muted-foreground mt-1">
                                {feature.description}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">Ideal for:</span> {tier.idealFor}
                        </p>
                        <button
                          onClick={() => setExpandedTier(isExpanded ? null : tier.id)}
                          className="text-xs font-bold text-sited-blue hover:text-sited-blue-hover transition-colors whitespace-nowrap"
                        >
                          {isExpanded ? "Show less" : "Learn more"}
                        </button>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setCtaOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sited-blue hover:bg-sited-blue-hover text-white font-black text-xs uppercase tracking-wider transition-colors whitespace-nowrap"
                      >
                        Get a quote
                        <ArrowRight size={14} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ready to find your fit? - Discovery Call CTA */}
      <section className="section-padding bg-secondary/30">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sited-blue/10 text-sited-blue text-xs font-black uppercase tracking-wider border border-sited-blue/20 mb-6">
              <Phone size={14} />
              No obligation. No pressure.
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Ready to find your fit?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Not sure which package is right for you? Jump on a quick, free discovery call and we'll help you figure it out — in plain English.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setBookingOpen(true)}
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-foreground hover:bg-foreground/90 text-background font-black text-sm uppercase tracking-wider transition-colors"
            >
              Quick free discovery call
              <Calendar size={16} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Spacer removed — ScrollBlueShape deleted */}

      {/* How it works */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Simple. Straightforward. Sorted.
            </motion.h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Tell us about your business", desc: "A quick discovery call to understand your goals, your customers, and what success looks like for you." },
              { step: "02", title: "We build it around results", desc: "Your site is designed and developed with one focus — turning visitors into customers." },
              { step: "03", title: "Launch and grow", desc: "Go live with confidence. We manage, maintain, and optimise so you can focus on running your business." },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 0.1} direction={i === 1 ? "up" : i === 0 ? "left" : "right"}>
                <div className="text-center p-6 rounded-xl border border-border bg-card h-full">
                  <span className="text-4xl font-black text-sited-blue/20">{item.step}</span>
                  <h3 className="text-lg font-black text-foreground mt-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Ready to stop losing customers */}
      <section className="section-padding bg-secondary/30">
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
              onClick={() => setBookingOpen(true)}
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-sited-blue hover:bg-sited-blue-hover text-white font-black text-sm uppercase tracking-wider transition-colors"
            >
              Let's talk
              <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Social Proof / Testimonials with scroll animation */}
      <section className="section-padding overflow-hidden">
        <div className="container-tight">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Don't take our word for it.
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
              Real results from real businesses we've worked with.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testTestimonials.map((testimonial, i) => (
              <ScrollReveal key={i} delay={i * 0.1} direction="up">
                <TestimonialCard testimonial={testimonial} index={i} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Blog Posts */}
      {recentPosts.length > 0 && (
        <section className="section-padding bg-secondary/30">
          <div className="container-tight">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="text-center mb-12">
              <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                From the blog
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
                Tips, insights, and straight talk about growing your business online.
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPosts.map((post, i) => (
                <ScrollReveal key={post.id} delay={i * 0.1} direction="up">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group block rounded-2xl border border-border bg-card overflow-hidden hover:border-sited-blue/30 transition-all"
                  >
                    {post.cover_image_url && (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sited-blue/10 text-sited-blue">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h3 className="text-base font-bold text-foreground group-hover:text-sited-blue transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{post.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-muted-foreground">
                          {post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : ""}
                        </span>
                        {post.reading_time_minutes && (
                          <span className="text-xs text-muted-foreground">{post.reading_time_minutes} min read</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="section-padding">
        <div className="container-tight">
          <ScrollReveal direction="scale">
            <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Your next customer is one click away.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Stop wondering "what if" and start seeing results. Get in touch today and let's build something that actually works for your business.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCtaOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-sited-blue hover:bg-sited-blue-hover text-white font-black text-sm uppercase tracking-wider transition-colors"
              >
                Get a quote
                <ArrowRight size={16} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setBookingOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-foreground/20 hover:border-foreground/40 text-foreground font-black text-sm uppercase tracking-wider transition-colors"
              >
                Book a call
                <Phone size={16} />
              </motion.button>
            </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <LeadCaptureDialog open={ctaOpen} onOpenChange={setCtaOpen} />
      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </Layout>
  );
};

export default CustomWebsites;
