import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { usePageSEO } from "@/hooks/usePageSEO";
import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, Heart, Wrench, Shield, Quote, Star } from "lucide-react";
import { ClientWebsiteGrid } from "@/components/home/ClientWebsiteGrid";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import { HomepageVideoTestimonials } from "@/components/home/HomepageVideoTestimonials";
import { FloatingParticles } from "@/components/home/FloatingParticles";
import { ThemeSwitchSection } from "@/components/common/ThemeSwitchSection";
import { motion, useScroll, useTransform } from "framer-motion";
import { useScrollBorders } from "@/hooks/useScrollBorders";
import { ScrollReveal } from "@/components/common/ScrollReveal";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const Index = () => {
  usePageSEO({
    title: "Sited | Websites That Pull Their Weight",
    description: "Sited builds and manages websites, online tools, and systems for service businesses across Australia. More traffic, more enquiries, less hassle.",
  });

  const { content, loading } = useHomepageContent();
  const [ctaOpen, setCtaOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  const pageRef = useRef<HTMLDivElement>(null);
  useScrollBorders(pageRef);

  if (loading || !content) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-sited-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const { hero, proof_bar, more_of_everything, why_stay, services, results, process, final_cta } = content;

  return (
    <Layout>
      <div ref={pageRef} className="overflow-x-hidden w-full">
      <LeadCaptureDialog open={ctaOpen} onOpenChange={setCtaOpen} />

      {/* 1. HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-[hsl(var(--surface-elevated))]" />
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--sited-blue)/0.08)_0%,transparent_70%)]" />
        <FloatingParticles />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-6xl sm:text-8xl lg:text-[9rem] font-black tracking-tighter leading-[0.85] text-foreground uppercase"
          >
            Need a
            <br />
            <span className="text-sited-blue">killer</span>
            <br />
            website?
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => setCtaOpen(true)}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-sited-blue text-white font-bold text-lg hover:bg-sited-blue-hover transition-all duration-300 shadow-elevated hover:shadow-[0_0_30px_hsl(var(--sited-blue)/0.3)]"
            >
              Get a Quote <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 text-base font-medium text-foreground underline decoration-gold decoration-2 underline-offset-4 hover:decoration-gold-hover transition-colors"
            >
              See what we've done for others
            </Link>
          </motion.div>

          {/* Social proof stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-10 sm:mt-14"
          >
            <p className="text-xs font-semibold tracking-widest text-muted-foreground mb-5 uppercase">
              {hero.social_proof_label}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0 sm:divide-x sm:divide-foreground/15">
              <div className="sm:px-8 text-center">
                <p className="text-2xl sm:text-3xl font-black text-foreground">500+</p>
                <p className="text-xs text-sited-blue font-semibold mt-0.5">Websites Built</p>
              </div>
              <div className="sm:px-8 text-center">
                <p className="text-2xl sm:text-3xl font-black text-foreground">7</p>
                <p className="text-xs text-sited-blue font-semibold mt-0.5">Years In The Industry</p>
              </div>
              <div className="sm:px-8 text-center flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-foreground">5</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <p className="text-xs text-sited-blue font-semibold">Google Reviews</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. PROOF BAR */}
      <section className="bg-sited-blue/10 border-y border-sited-blue/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0 sm:divide-x sm:divide-foreground/15">
            {proof_bar.items.map((item, i) => (
              <ScrollReveal key={i} delay={i * 0.08} direction="up">
                <p className="text-sm text-foreground font-medium text-center sm:px-6">
                  {item}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CLIENT WEBSITES GRID */}
      <section className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Websites we've built
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Real sites for real businesses — all designed, built, and managed by Sited.
            </p>
          </motion.div>
          <ClientWebsiteGrid />
        </div>
      </section>

      {/* 4. FOUNDER VIDEO INTRO */}
      <section className="border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--surface-elevated))] to-background" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="w-full lg:w-2/3 rounded-2xl overflow-hidden bg-card aspect-video flex items-center justify-center border border-border shadow-elevated"
            >
              <div className="text-center text-muted-foreground p-8">
                <div className="w-16 h-16 rounded-full bg-sited-blue/20 flex items-center justify-center mx-auto mb-3">
                  <ArrowRight size={24} className="text-sited-blue" />
                </div>
                <p className="text-sm font-medium">Founder video placeholder</p>
                <p className="text-xs mt-1">Landscape video from Andrew will go here</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="w-full lg:w-1/3"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-sited-blue/20 border-2 border-sited-blue flex items-center justify-center">
                  <span className="text-lg font-black text-sited-blue">AF</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Andrew Fuller</h3>
                  <p className="text-xs text-sited-blue font-semibold uppercase tracking-wider">CEO & Founder</p>
                </div>
              </div>
              <blockquote className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
                "Agencies are overpriced. I <span className="font-black text-sited-blue">COULDN'T</span> believe I could make a profitable business selling it for 90% less."
              </blockquote>
              <div className="mt-4 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                ))}
                <span className="text-xs text-muted-foreground ml-1.5">500+ websites delivered</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. MORE OF EVERYTHING — switches to light on scroll */}
      <ThemeSwitchSection className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-10"
          >
            {more_of_everything.title}
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {more_of_everything.items.map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-card border border-border rounded-xl p-5 flex gap-4 scroll-border-blue hover:border-sited-blue/30 hover:shadow-[0_0_20px_hsl(var(--sited-blue)/0.08)] transition-all duration-300"
              >
                <div className="w-1.5 bg-sited-blue/40 rounded-full shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.bold}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.supporting}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </ThemeSwitchSection>

      {/* VIDEO TESTIMONIALS */}
      <HomepageVideoTestimonials />

      {/* 6. WHY PEOPLE STAY */}
      <section className="border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--surface-elevated))] to-background" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-10"
          >
            {why_stay.heading}
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {why_stay.reasons.map((r, i) => {
              const icons = [MessageSquare, Heart, Wrench, Shield];
              const Icon = icons[i] || Shield;
              return (
                <ScrollReveal key={i} delay={i * 0.08} direction={i % 2 === 0 ? "left" : "right"}>
                  <motion.div
                    whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
                    className="bg-card border border-border rounded-xl p-5 text-center scroll-border-gold hover:border-gold/30 hover:shadow-[0_0_20px_hsl(var(--gold)/0.1)] transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center mx-auto mb-3">
                      <Icon size={18} className="text-gold" />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">{r.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. SERVICES */}
      <section className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-10"
          >
            {services.heading}
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-5">
            {services.cards.map((card, i) => (
              <ScrollReveal key={i} delay={i * 0.1} direction="up">
                <motion.div
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="group bg-card border border-border rounded-xl overflow-hidden flex flex-col scroll-border-blue hover:border-sited-blue/40 hover:shadow-[0_0_30px_hsl(var(--sited-blue)/0.1)] transition-all duration-300"
                >
                  <div className="h-1 bg-gradient-to-r from-sited-blue/60 to-sited-blue/20 group-hover:from-sited-blue group-hover:to-sited-blue/50 transition-all duration-300" />
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-base font-semibold text-foreground mb-2">{card.title}</h3>
                    <p className="text-sm text-muted-foreground flex-1 mb-4">{card.description}</p>
                    <button
                      onClick={() => setCtaOpen(true)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-sited-blue hover:text-sited-blue-hover transition-colors"
                    >
                      Get a Quote <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8. RESULTS — switches to light on scroll */}
      <ThemeSwitchSection className="border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--surface-elevated))] to-background" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-10"
          >
            {results.heading}
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {results.cards.map((card, i) => {
              const stockPhotos = [
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
              ];
              return (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  variants={fadeUp}
                  whileHover={{ y: -4, rotate: 0, transition: { duration: 0.3 } }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-soft relative overflow-hidden scroll-border-blue hover:border-sited-blue/30 transition-all duration-300"
                  style={{ transform: `rotate(${i === 1 ? -1 : i === 2 ? 1 : 0}deg)` }}
                >
                  {/* Glow accent */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-sited-blue/5 blur-2xl" />
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={stockPhotos[i]}
                      alt="Client"
                      className="w-11 h-11 rounded-full object-cover border-2 border-border shadow-sm"
                      loading="lazy"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">{card.subtext}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} size={10} className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <Quote size={16} className="text-sited-blue/50 mb-2" />
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    "{card.quote}"
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </ThemeSwitchSection>

      {/* 9. PROCESS */}
      <section className="bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-10"
          >
            {process.heading}
          </motion.h2>
          <div className="space-y-0">
            {process.steps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.08} direction="up">
                <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-sited-blue text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-[0_0_12px_hsl(var(--sited-blue)/0.3)]">
                    {i + 1}
                  </div>
                  {i < process.steps.length - 1 && (
                    <div className="w-px flex-1 bg-gradient-to-b from-sited-blue/30 to-transparent my-1" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sited-blue via-[hsl(202,80%,45%)] to-sited-blue" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--gold)/0.15)_0%,transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-18 text-center">
          <ScrollReveal direction="scale">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {final_cta.heading}
            </h2>
            <p className="mt-3 text-base text-white/70 max-w-xl mx-auto">
              {final_cta.body}
            </p>
            <button
              onClick={() => setCtaOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-gold text-background font-semibold text-base hover:bg-gold-hover transition-all duration-300 shadow-elevated"
            >
              Get a Quote Today <ArrowRight size={18} />
            </button>
            <p className="mt-3 text-sm text-white/40">
              {final_cta.reassurance}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Legal */}
      <div className="py-4 text-center bg-background">
        <Link to="/policies" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          Privacy Policy & Terms
        </Link>
      </div>
      </div>
    </Layout>
  );
};

export default Index;
