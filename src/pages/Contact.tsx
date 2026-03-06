import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Calendar, Star, Phone, Mail, Shield, Users, Clock } from "lucide-react";
import { useState, useRef } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import BookingDialog from "@/components/booking/BookingDialog";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import { usePublicTestimonials } from "@/hooks/useTestimonials";
import { useScrollBorders } from "@/hooks/useScrollBorders";
import { ScrollZoomIn, ScrollStaggerItem, ScrollParallax } from "@/components/common/ScrollAnimations";
import { ThemeSwitchSection } from "@/components/common/ThemeSwitchSection";

const Contact = () => {
  usePageSEO({
    title: "Get in Touch | Sited — Let's Build Something Great",
    description: "Book a free consultation or get a quote. 500+ websites delivered, 5-star Google reviews. No jargon, no pressure — just results.",
  });

  const [bookingOpen, setBookingOpen] = useState(false);
  const [ctaOpen, setCtaOpen] = useState(false);
  const { data: testimonials } = usePublicTestimonials();
  const pageRef = useRef<HTMLDivElement>(null);
  useScrollBorders(pageRef);

  return (
    <Layout hideFooter>
      <div ref={pageRef} className="overflow-x-hidden w-full">
      {/* HERO */}
      <section className="relative min-h-[calc(85vh-140px)] md:min-h-[85vh] flex items-center justify-center bg-background overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-sited-blue font-bold mb-4 sm:mb-6">
              Let's Talk
            </p>
            <h1 className="text-5xl sm:text-7xl lg:text-[8rem] font-black tracking-tighter leading-[0.85] text-foreground uppercase">
              Ready to
              <br />
              <span className="text-sited-blue">grow?</span>
            </h1>
            <p className="mt-6 sm:mt-8 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Whether you need a website, a quote, or just some advice — we're here. No jargon, no pressure.
            </p>
          </motion.div>

          {/* Two CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => setBookingOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-sited-blue text-white font-bold text-lg hover:bg-sited-blue-hover transition-colors shadow-elevated"
            >
              <Calendar size={20} />
              Book a Call
            </button>
            <button
              onClick={() => setCtaOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg border-2 border-foreground bg-transparent text-foreground font-bold text-lg hover:bg-foreground hover:text-background transition-all"
            >
              Get a Quote
              <ArrowRight size={20} />
            </button>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 sm:mt-14"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0 sm:divide-x sm:divide-foreground/15">
              <div className="sm:px-8 text-center">
                <p className="text-2xl sm:text-3xl font-black text-foreground">500+</p>
                <p className="text-xs text-sited-blue font-semibold mt-0.5">Websites Delivered</p>
              </div>
              <div className="sm:px-8 text-center">
                <p className="text-2xl sm:text-3xl font-black text-foreground">7</p>
                <p className="text-xs text-sited-blue font-semibold mt-0.5">Years Running</p>
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
        </div>
      </section>

      {/* GOOGLE REVIEWS BANNER */}
      <section className="py-4 sm:py-5 bg-foreground overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 4 }).map((_, setIndex) => (
            ["GREAT SITES", "NO BS", "GET LEADS", "TRUSTED SERVICE", "GREAT SEO", "RANK BETTER"].map((phrase, i) => (
              <div key={`${setIndex}-${i}`} className="flex items-center gap-6 mx-6 sm:mx-8">
                <span className="text-sm font-black text-background uppercase tracking-[0.2em]">
                  {phrase}
                </span>
                <span className="text-sited-blue text-lg">✦</span>
              </div>
            ))
          ))}
        </div>
      </section>

      {/* TRUST SIGNALS — switches to light on scroll */}
      <ThemeSwitchSection className="py-16 sm:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase">
              Why businesses <span className="text-sited-blue">trust us</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Users,
                title: "500+ Happy Clients",
                desc: "We've built websites for tradies, consultants, gyms, restaurants, real estate agents — you name it.",
              },
              {
                icon: Clock,
                title: "Fast Turnaround",
                desc: "Most websites are live within 2 weeks. No months of back-and-forth. We move when you move.",
              },
              {
                icon: Shield,
                title: "No Lock-In Contracts",
                desc: "Stay because you want to, not because you have to. We earn your business every month.",
              },
            ].map((item, i) => (
              <ScrollZoomIn key={item.title}>
                <div className="bg-card border border-border rounded-2xl p-8 text-center scroll-border-blue h-full">
                  <div className="w-12 h-12 rounded-xl bg-sited-blue/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon size={24} className="text-sited-blue" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </ScrollZoomIn>
            ))}
          </div>
        </div>
      </ThemeSwitchSection>

      {/* TESTIMONIALS */}
      {testimonials && testimonials.length > 0 && (
        <ThemeSwitchSection className="py-16 sm:py-24 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">
                Real Results
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase">
                Don't take our <span className="text-sited-blue">word</span> for it
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.slice(0, 6).map((t, index) => (
                <ScrollStaggerItem key={t.id} index={index}>
                  <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col h-full">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]"
                        />
                      ))}
                    </div>
                    <p className="text-sm sm:text-base text-foreground leading-relaxed flex-1 mb-6">
                      "{t.testimonial_text}"
                    </p>
                    <div className="border-t border-border pt-4">
                      <p className="font-bold text-sm">{t.testimonial_author}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.testimonial_role}{t.business_name ? ` · ${t.business_name}` : ""}
                      </p>
                    </div>
                  </div>
                </ScrollStaggerItem>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 sm:py-28 bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <ScrollZoomIn>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase">
              Let's make it <span className="text-sited-blue">happen</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-background/60 max-w-xl mx-auto">
              A 20-minute call to understand your business. A clear quote within 24 hours. No surprises.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setBookingOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-sited-blue text-white font-bold text-lg hover:bg-sited-blue-hover transition-colors"
              >
                <Calendar size={20} />
                Book a Call
              </button>
              <button
                onClick={() => setCtaOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg border-2 border-background/30 text-background font-bold text-lg hover:bg-background hover:text-foreground transition-all"
              >
                Get a Quote
                <ArrowRight size={20} />
              </button>
            </div>

            {/* Contact info */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <a
                href="tel:0459909810"
                className="flex items-center gap-2 text-sm text-background/60 hover:text-background transition-colors"
              >
                <Phone size={16} />
                0459 909 810
              </a>
              <a
                href="mailto:hello@sited.com"
                className="flex items-center gap-2 text-sm text-background/60 hover:text-background transition-colors"
              >
                <Mail size={16} />
                hello@sited.com
              </a>
            </div>
          </ScrollZoomIn>
        </div>
      </section>

      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
      <LeadCaptureDialog open={ctaOpen} onOpenChange={setCtaOpen} />
      </div>
    </Layout>
  );
};

export default Contact;
