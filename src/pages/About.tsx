import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Users, Eye } from "lucide-react";
import { usePageSEO } from "@/hooks/usePageSEO";

const About = () => {
  usePageSEO({
    title: "How It Works | Sited — Built Fast, Looked After Properly",
    description: "Sited builds professional digital tools for growing businesses — and then monitors and improves them every month. Fast builds, proactive care, and one accountable team. Here's how it works.",
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 bg-gradient-to-b from-surface-elevated to-background">
        <div className="container-tight text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">
              How It Works
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight mb-4 sm:mb-6"
          >
            Built Fast. Looked After Properly.
            <br />
            <span className="text-muted-foreground">That's the Sited Standard.</span>
          </motion.h1>
        </div>
      </section>

      {/* Story */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
                Most businesses pay for a website, it gets built, and nobody looks at it again. The agency moves on. The site falls behind.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
                We built Sited to fix that. We deliver fast, at a price traditional agencies can't match — then stay through our Care Plan, monitoring and improving every month.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-base sm:text-lg text-foreground leading-relaxed font-medium mb-10">
                Not a tool. Not a template builder. A delivery partner for businesses that want a serious digital presence — looked after properly.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* What Makes Sited Different */}
      <section className="section-padding bg-surface-elevated">
        <div className="container-tight">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                What Makes Us Different
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mt-3 mb-6">
                Better technology. Better process. Better results.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                Better tools mean faster delivery at lower cost — without compromising quality. Professional results at a price that makes sense.
              </p>
            </ScrollReveal>
            
            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              {[
                { icon: Zap, title: "Speed without shortcuts", desc: "Most projects complete in days, not months." },
                { icon: Shield, title: "Version-controlled code", desc: "Every change logged, every state restorable." },
                { icon: Eye, title: "Monthly Care Plan", desc: "We monitor and improve your site every month." },
                { icon: Users, title: "One accountable team", desc: "The team that builds it is the team that maintains it." },
              ].map((item, index) => (
                <ScrollReveal key={item.title} delay={0.1 + index * 0.05}>
                  <div className="p-5 sm:p-6 rounded-xl border border-border bg-card">
                    <item.icon size={20} className="text-accent mb-3" />
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Accountability */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Accountability
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mt-3 mb-6">
                Operational rigour that sets us apart
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Every change is logged. Every state is restorable. If something shifts unexpectedly, we catch it before you do.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-foreground text-background">
        <div className="container-tight text-center">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4 sm:mb-6">
              Ready to talk about what your business needs?
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="text-background/70 text-base sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10">
              Free 20-minute call. No jargon, no obligation — just a clear conversation about your business needs.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <Button
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <Link to="/contact">
                Let's Talk About What Your Business Needs <ArrowRight size={20} />
              </Link>
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default About;
