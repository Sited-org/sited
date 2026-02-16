import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Phone, ArrowRight, Calendar, FileText } from "lucide-react";
import { useState } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import BookingDialog from "@/components/booking/BookingDialog";

const Contact = () => {
  usePageSEO({
    title: "Book a Consultation | Sited — Let's Start With a Conversation",
    description: "Book a free 20-minute call with the Sited team. We will listen, advise, and give you a clear quote — no jargon, no pressure.",
  });

  const [bookingOpen, setBookingOpen] = useState(false);

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16">
            {/* Primary CTA — Start Your Project */}
            <ScrollReveal>
              <div className="bg-foreground text-background rounded-2xl p-8 sm:p-10 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={18} />
                  <span className="text-xs uppercase tracking-widest text-background/50">Recommended</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                  Ready to build your website?
                </h2>
                <p className="text-background/70 text-base sm:text-lg mb-8 leading-relaxed flex-1">
                  Tell us about your business and project. Our onboarding form takes a few minutes and helps us give you an accurate quote fast.
                </p>
                <Button
                  variant="default"
                  size="lg"
                  className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-hover))] text-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 gap-2 text-base px-8 w-full sm:w-auto"
                  asChild
                >
                  <Link to="/onboarding/website">
                    Start Your Project
                    <ArrowRight size={18} />
                  </Link>
                </Button>
              </div>
            </ScrollReveal>

            {/* Secondary CTA — Book a Call + Contact Info */}
            <div className="space-y-6 sm:space-y-8">
              <ScrollReveal delay={0.1}>
                <div className="bg-card border border-border rounded-2xl p-8 sm:p-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={18} className="text-muted-foreground" />
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Book Directly</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-3">
                    Prefer a quick chat first?
                  </h3>
                  <p className="text-muted-foreground text-base mb-6 leading-relaxed">
                    Book a free 20-minute call. Pick a time that suits you.
                  </p>
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full sm:w-auto gap-2"
                    onClick={() => setBookingOpen(true)}
                  >
                    Book a Time in the Sited Calendar
                    <ArrowRight size={18} />
                  </Button>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-lg font-semibold">Get in touch</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                        <Mail size={18} className="sm:w-5 sm:h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">Email</p>
                        <a
                          href="mailto:hello@sited.com"
                          className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors"
                        >
                          hello@sited.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                        <Phone size={18} className="sm:w-5 sm:h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">Phone</p>
                        <a
                          href="tel:0459909810"
                          className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors"
                        >
                          0459 909 810
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.3}>
                <div className="bg-accent/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    <strong className="text-foreground">Response time:</strong> We
                    typically respond within one business day. Through the Care Plan, you get direct access to your Sited team at any time.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </Layout>
  );
};

export default Contact;
