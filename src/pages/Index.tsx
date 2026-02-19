import { Layout } from "@/components/layout/Layout";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { usePageSEO } from "@/hooks/usePageSEO";
import { Link } from "react-router-dom";
import { ArrowRight, Search, Users, MessageSquare, Clock, Shield, Heart, Wrench, Globe, Settings, Sparkles, Quote, CheckCircle2 } from "lucide-react";

const Index = () => {
  usePageSEO({
    title: "Sited | Websites That Pull Their Weight",
    description: "Sited builds and manages websites, online tools, and systems for service businesses across Australia. More traffic, more enquiries, less hassle.",
  });

  const { content, loading } = useHomepageContent();

  if (loading || !content) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const { hero, proof_bar, more_of_everything, trusted_by, who_we_help, why_stay, services, results, process, final_cta } = content;

  return (
    <Layout>
      {/* 1. HERO */}
      <section className="relative overflow-hidden bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-foreground">
                {hero.headline}
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-lg">
                {hero.subheadline}
              </p>
              <p className="mt-4 text-base sm:text-lg font-medium text-foreground italic">
                {hero.question}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to={hero.primary_cta_link}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-sited-blue text-white font-semibold text-base hover:bg-sited-blue-hover transition-colors"
                >
                  {hero.primary_cta_label}
                </Link>
                <Link
                  to={hero.secondary_cta_link}
                  className="inline-flex items-center gap-2 text-base font-medium text-foreground underline decoration-gold decoration-2 underline-offset-4 hover:decoration-gold-hover transition-colors"
                >
                  {hero.secondary_cta_label} <ArrowRight size={16} />
                </Link>
              </div>

              {/* Mini social proof */}
              <div className="mt-10">
                <p className="text-sm font-medium text-muted-foreground mb-4">
                  {hero.social_proof_label}
                </p>
                <div className="space-y-3">
                  {hero.mini_testimonials.map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gold/40 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-foreground">{t.name?.[0] || "?"}</span>
                      </div>
                      <div>
                        <p className="text-sm text-foreground leading-snug">"{t.quote}"</p>
                        <p className="text-xs text-muted-foreground mt-0.5">— {t.name}, {t.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Device mockup */}
            <div className="relative hidden lg:block">
              <div className="absolute -top-8 -right-8 w-72 h-72 bg-gold/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-sited-blue/15 rounded-full blur-2xl" />
              <div className="relative bg-card border border-border rounded-2xl shadow-elevated p-3">
                <div className="flex items-center gap-1.5 mb-2 px-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                  <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                  <div className="ml-3 flex-1 h-5 bg-muted rounded-md" />
                </div>
                <div className="bg-muted rounded-lg aspect-[4/3] flex items-center justify-center">
                  <div className="text-center px-6">
                    <Globe className="w-10 h-10 text-sited-blue mx-auto mb-3" />
                    <div className="h-3 bg-border rounded w-3/4 mx-auto mb-2" />
                    <div className="h-2 bg-border/60 rounded w-1/2 mx-auto mb-4" />
                    <div className="h-8 bg-sited-blue/20 rounded w-1/3 mx-auto" />
                  </div>
                </div>
              </div>
              {/* Gold accent band */}
              <div className="absolute -right-4 top-1/3 w-20 h-48 bg-gold/30 rounded-full -rotate-12 blur-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROOF BAR */}
      <section className="bg-gold/10 border-y border-gold/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-center text-muted-foreground mb-6">
            {proof_bar.title}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0 sm:divide-x sm:divide-foreground/15">
            {proof_bar.items.map((item, i) => (
              <p key={i} className="text-sm text-foreground font-medium text-center sm:px-6">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* 3. MORE OF EVERYTHING */}
      <section className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {more_of_everything.title}
              </h2>
              <div className="mt-3 w-16 h-1 bg-sited-blue rounded-full" />
            </div>
            <div className="space-y-6">
              {more_of_everything.items.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-1 bg-sited-blue/40 rounded-full shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">{item.bold}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.supporting}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRUSTED BY */}
      {(trusted_by.logos.length > 0 || trusted_by.heading) && (
        <section className="bg-card border-y border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8">
              {trusted_by.heading}
            </p>
            {trusted_by.logos.length > 0 && (
              <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap mb-6">
                {trusted_by.logos.map((logo, i) => (
                  <img key={i} src={logo.url} alt="Client logo" className="h-8 sm:h-10 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all" />
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              {trusted_by.under_text}
            </p>
          </div>
        </section>
      )}

      {/* 5. WHO WE HELP */}
      <section className="bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {who_we_help.heading}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {who_we_help.intro}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            {who_we_help.bullets.map((b, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/15 text-sm font-medium text-foreground">
                <CheckCircle2 size={15} className="text-sited-blue" /> {b}
              </span>
            ))}
          </div>
          <p className="mt-6 text-base text-muted-foreground font-medium">
            {who_we_help.closing}
          </p>
        </div>
      </section>

      {/* 6. WHY PEOPLE STAY */}
      <section className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-12">
            {why_stay.heading}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {why_stay.reasons.map((r, i) => {
              const icons = [MessageSquare, Heart, Wrench, Shield];
              const Icon = icons[i] || Shield;
              return (
                <div key={i} className="bg-background border border-border rounded-xl p-6 hover:border-gold/40 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{r.title}</h3>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. SERVICES */}
      <section className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-12">
            {services.heading}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {services.cards.map((card, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 sm:p-8 flex flex-col">
                <div className="w-full h-1 bg-sited-blue/30 rounded-full mb-6" />
                <h3 className="text-lg font-semibold text-foreground mb-3">{card.title}</h3>
                <p className="text-sm text-muted-foreground flex-1 mb-6">{card.description}</p>
                <Link
                  to={card.cta_link}
                  className="inline-flex items-center gap-2 text-sm font-medium text-sited-blue hover:text-sited-blue-hover transition-colors"
                >
                  {card.cta_label} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. RESULTS */}
      <section className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-12">
            {results.heading}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {results.cards.map((card, i) => (
              <div
                key={i}
                className="bg-background border-2 border-sited-blue/20 rounded-xl p-6 sm:p-8 shadow-soft relative"
                style={{ transform: `rotate(${i === 1 ? -1 : i === 2 ? 1 : 0}deg)` }}
              >
                <div className="absolute top-4 right-4 w-6 h-6 bg-gold/30 rounded-full" />
                <Quote size={20} className="text-sited-blue mb-4" />
                <p className="text-base font-medium text-foreground leading-relaxed mb-4">
                  "{card.quote}"
                </p>
                <p className="text-sm text-muted-foreground">{card.subtext}</p>
              </div>
            ))}
          </div>

          {/* Testimonial strip */}
          <div className="mt-16">
            <p className="text-sm font-semibold tracking-wider text-center text-muted-foreground mb-6 uppercase">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-12">
            {process.heading}
          </h2>
          <div className="space-y-0">
            {process.steps.map((step, i) => (
              <div key={i} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-sited-blue text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {i + 1}
                  </div>
                  {i < process.steps.length - 1 && (
                    <div className="w-px flex-1 bg-sited-blue/20 my-1" />
                  )}
                </div>
                <div className="pb-10">
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="bg-sited-blue">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {final_cta.heading}
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            {final_cta.body}
          </p>
          <Link
            to={final_cta.button_link}
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gold text-foreground font-semibold text-base hover:bg-gold-hover transition-colors"
          >
            {final_cta.button_label} <ArrowRight size={18} />
          </Link>
          <p className="mt-4 text-sm text-white/60">
            {final_cta.reassurance}
          </p>
        </div>
      </section>

      {/* Legal link */}
      <div className="py-4 text-center bg-background">
        <Link
          to="/policies"
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Privacy Policy & Terms
        </Link>
      </div>
    </Layout>
  );
};

export default Index;
