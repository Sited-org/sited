import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { usePageSEO } from "@/hooks/usePageSEO";
import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, Heart, Wrench, Shield, Quote } from "lucide-react";
import { ClientWebsiteGrid } from "@/components/home/ClientWebsiteGrid";
import { TestimonialShowcase } from "@/components/home/TestimonialShowcase";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import heroBg from "@/assets/hero-bg.mp4";

const Index = () => {
  usePageSEO({
    title: "Sited | Websites That Pull Their Weight",
    description: "Sited builds and manages websites, online tools, and systems for service businesses across Australia. More traffic, more enquiries, less hassle.",
  });

  const { content, loading } = useHomepageContent();
  const [ctaOpen, setCtaOpen] = useState(false);

  if (loading || !content) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const { hero, proof_bar, more_of_everything, why_stay, services, results, process, final_cta } = content;

  return (
    <Layout>
      {/* Lead Capture Dialog */}
      <LeadCaptureDialog open={ctaOpen} onOpenChange={setCtaOpen} />

      {/* 1. HERO — Full-screen video background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          preload="auto"
        >
          <source src={heroBg} type="video/mp4" />
        </video>
        {/* Overlay */}
        <div className="absolute inset-0 bg-background/60" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-6xl sm:text-8xl lg:text-[9rem] font-black tracking-tighter leading-[0.85] text-foreground uppercase">
            Need a great
            <br />
            <span className="text-sited-blue">website?</span>
          </h1>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setCtaOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-sited-blue text-white font-bold text-lg hover:bg-sited-blue-hover transition-colors shadow-elevated"
            >
              {hero.primary_cta_label} <ArrowRight size={20} />
            </button>
            <Link
              to="/work"
              className="inline-flex items-center gap-2 text-base font-medium text-foreground underline decoration-gold decoration-2 underline-offset-4 hover:decoration-gold-hover transition-colors"
            >
              {hero.secondary_cta_label}
            </Link>
          </div>

          {/* Mini social proof */}
          <div className="mt-10 sm:mt-14">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground mb-4 uppercase">
              {hero.social_proof_label}
            </p>
            <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {hero.mini_testimonials.slice(0, 3).map((t, i) => (
                <div key={i} className="flex items-start gap-3 bg-card/80 backdrop-blur border border-border rounded-xl p-4">
                  <div className="w-8 h-8 rounded-full bg-gold/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-foreground">{t.name?.[0] || "?"}</span>
                  </div>
                  <div>
                    <p className="text-sm text-foreground leading-snug">"{t.quote}"</p>
                    <p className="text-xs text-muted-foreground mt-1">— {t.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROOF BAR */}
      <section className="bg-gold/10 border-y border-gold/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0 sm:divide-x sm:divide-foreground/15">
            {proof_bar.items.map((item, i) => (
              <p key={i} className="text-sm text-foreground font-medium text-center sm:px-6">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CLIENT WEBSITES GRID */}
      <section className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Websites we've built
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Real sites for real businesses — all designed, built, and managed by Sited.
            </p>
          </div>
          <ClientWebsiteGrid />
        </div>
      </section>

      {/* 4. FEATURED TESTIMONIAL */}
      <section className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <TestimonialShowcase />
        </div>
      </section>

      {/* 5. MORE OF EVERYTHING */}
      <section className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-10">
            {more_of_everything.title}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {more_of_everything.items.map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 flex gap-4">
                <div className="w-1.5 bg-sited-blue/40 rounded-full shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.bold}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.supporting}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. WHY PEOPLE STAY */}
      <section className="bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-10">
            {why_stay.heading}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {why_stay.reasons.map((r, i) => {
              const icons = [MessageSquare, Heart, Wrench, Shield];
              const Icon = icons[i] || Shield;
              return (
                <div key={i} className="bg-background border border-border rounded-xl p-5 text-center">
                  <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center mx-auto mb-3">
                    <Icon size={18} className="text-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{r.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. SERVICES */}
      <section className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-10">
            {services.heading}
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {services.cards.map((card, i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                <div className="h-2 bg-sited-blue/30" />
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-base font-semibold text-foreground mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-4">{card.description}</p>
                  <button
                    onClick={() => setCtaOpen(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-sited-blue hover:text-sited-blue-hover transition-colors"
                  >
                    {card.cta_label} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. RESULTS */}
      <section className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-10">
            {results.heading}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {results.cards.map((card, i) => (
              <div
                key={i}
                className="bg-background border-2 border-sited-blue/20 rounded-xl p-6 shadow-soft relative"
                style={{ transform: `rotate(${i === 1 ? -1 : i === 2 ? 1 : 0}deg)` }}
              >
                <Quote size={18} className="text-sited-blue mb-3" />
                <p className="text-sm font-medium text-foreground leading-relaxed mb-3">
                  "{card.quote}"
                </p>
                <p className="text-xs text-muted-foreground">{card.subtext}</p>
                <div className="absolute top-3 right-3 w-4 h-4 bg-gold/30 rounded-full" />
              </div>
            ))}
          </div>

          {/* Testimonial strip */}
          <div className="mt-12 bg-background border border-border rounded-xl p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-widest text-center text-muted-foreground mb-4 uppercase">
              {results.testimonial_strip_heading}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              {results.testimonials.map((t, i) => (
                <p key={i} className="text-sm text-muted-foreground italic text-center max-w-xs">
                  "{t.quote}"
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. PROCESS */}
      <section className="bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-10">
            {process.heading}
          </h2>
          <div className="space-y-0">
            {process.steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-sited-blue text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {i + 1}
                  </div>
                  {i < process.steps.length - 1 && (
                    <div className="w-px flex-1 bg-sited-blue/20 my-1" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="bg-sited-blue">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-18 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {final_cta.heading}
          </h2>
          <p className="mt-3 text-base text-white/80 max-w-xl mx-auto">
            {final_cta.body}
          </p>
          <button
            onClick={() => setCtaOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-gold text-foreground font-semibold text-base hover:bg-gold-hover transition-colors"
          >
            {final_cta.button_label} <ArrowRight size={18} />
          </button>
          <p className="mt-3 text-sm text-white/50">
            {final_cta.reassurance}
          </p>
        </div>
      </section>

      {/* Legal */}
      <div className="py-4 text-center bg-background">
        <Link to="/policies" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          Privacy Policy & Terms
        </Link>
      </div>
    </Layout>
  );
};

export default Index;
