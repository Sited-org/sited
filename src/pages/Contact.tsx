import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Phone, ArrowRight, Calendar, FileText, Star } from "lucide-react";
import { useState } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import BookingDialog from "@/components/booking/BookingDialog";
import { usePublicTestimonials } from "@/hooks/useTestimonials";

const Contact = () => {
  usePageSEO({
    title: "Book a Consultation | Sited — Let's Start With a Conversation",
    description: "Book a free 20-minute call with the Sited team. We will listen, advise, and give you a clear quote — no jargon, no pressure.",
  });

  const [bookingOpen, setBookingOpen] = useState(false);
  const { data: testimonials } = usePublicTestimonials();

  return (
    <Layout hideFooter>
      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 bg-gradient-to-b from-surface-elevated to-background">
        <div className="container-tight text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">
              Book a Call
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight mb-4 sm:mb-6"
          >
            Let's Start With
            <br />
            <span className="text-muted-foreground">a Conversation</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2"
          >
            20 minutes. We listen, advise, and give you a clear quote. No jargon, no pressure.
          </motion.p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Onboarding CTA */}
            <ScrollReveal>
              <div className="bg-card border border-border rounded-2xl p-8 sm:p-10 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={16} className="text-muted-foreground" />
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Onboarding</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                  Ready to build your website?
                </h2>
                <p className="text-muted-foreground text-base mb-8 leading-relaxed flex-1">
                  Tell us about your business and project. Takes a few minutes — helps us quote you accurately.
                </p>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full sm:w-auto gap-2"
                  asChild
                >
                  <Link to="/onboarding/website">
                    Start Your Project
                    <ArrowRight size={18} />
                  </Link>
                </Button>
              </div>
            </ScrollReveal>

            {/* Booking CTA */}
            <ScrollReveal delay={0.1}>
              <div className="bg-card border border-border rounded-2xl p-8 sm:p-10 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={16} className="text-muted-foreground" />
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Booking</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-3">
                  Prefer a quick chat first?
                </h3>
                <p className="text-muted-foreground text-base mb-8 leading-relaxed flex-1">
                  Book a free 20-minute call. Pick a time that suits you.
                </p>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full sm:w-auto gap-2"
                  onClick={() => setBookingOpen(true)}
                >
                  Book a Time
                  <ArrowRight size={18} />
                </Button>
              </div>
            </ScrollReveal>
          </div>

          {/* Contact Info Row */}
          <ScrollReveal delay={0.2}>
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10 justify-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-accent-foreground" />
                </div>
                <a
                  href="mailto:hello@sited.com"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  hello@sited.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <Phone size={16} className="text-accent-foreground" />
                </div>
                <a
                  href="tel:0459909810"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  0459 909 810
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Response:</strong> Within one business day. Care Plan clients get direct access.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials && testimonials.length > 0 && (
        <section className="section-padding bg-gradient-to-b from-background to-surface-elevated">
          <div className="container-tight">
            <ScrollReveal>
              <div className="text-center mb-10 sm:mb-14">
                <span className="inline-block text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
                  What Our Clients Say
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
                  Real Results. Real Words.
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t, index) => (
                <ScrollReveal key={t.id} delay={index * 0.08}>
                  <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col h-full">
                    {/* Stars */}
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]"
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-sm sm:text-base text-foreground leading-relaxed flex-1 mb-6">
                      "{t.testimonial_text}"
                    </p>

                    {/* Author */}
                    <div className="border-t border-border pt-4">
                      <p className="font-semibold text-sm">{t.testimonial_author}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.testimonial_role}{t.business_name ? ` · ${t.business_name}` : ""}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </Layout>
  );
};

export default Contact;
