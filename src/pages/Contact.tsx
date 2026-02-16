import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Phone, ArrowRight, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { usePageSEO } from "@/hooks/usePageSEO";

const Contact = () => {
  usePageSEO({
    title: "Book a Consultation | Sited — Let's Start With a Conversation",
    description: "Book a free 20-minute call with the Sited team. We will listen, advise, and give you a clear quote — no jargon, no pressure.",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsSubmitted(true);
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

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

      {/* Contact Section */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16">
            {/* Contact Form */}
            <ScrollReveal>
              <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-10">
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-4">Message received</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Thanks — we have received your message. A member of the Sited team will be in touch within one business day. If your project is time-sensitive, feel free to reach out directly at hello@sited.com.
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Send us a message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm">Your name</Label>
                          <Input
                            id="name"
                            placeholder="Your name"
                            required
                            className="h-11 sm:h-12 text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm">Best email to reach you</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            className="h-11 sm:h-12 text-base"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-sm">Your business name</Label>
                        <Input
                          id="company"
                          placeholder="Your business name"
                          className="h-11 sm:h-12 text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm">Tell us what you need — even a rough idea is fine</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us what you need..."
                          required
                          className="min-h-[120px] sm:min-h-[150px] resize-none text-base"
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="hero"
                        size="lg"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Sending..." : "Send Your Message"}
                        <ArrowRight size={18} />
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </ScrollReveal>

            {/* Contact Info & Book Direct */}
            <div className="space-y-6 sm:space-y-8">
              <ScrollReveal delay={0.1}>
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="text-xl sm:text-2xl font-semibold">Get in touch</h2>
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

              {/* Book Direct CTA */}
              <ScrollReveal delay={0.2}>
                <div className="bg-foreground text-background rounded-2xl p-8 sm:p-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={18} />
                    <span className="text-xs uppercase tracking-widest text-background/50">Book Directly</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-3">
                    Prefer to book directly?
                  </h3>
                  <p className="text-background/70 text-base sm:text-lg mb-6 leading-relaxed">
                    Use the link below to pick a time that suits you.
                  </p>
                  <Button
                    variant="default"
                    size="lg"
                    className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-hover))] text-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 gap-2 text-base px-8"
                    asChild
                  >
                    <Link to="/onboarding/website">
                      Book a Time in the Sited Calendar
                      <ArrowRight size={18} />
                    </Link>
                  </Button>
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
    </Layout>
  );
};

export default Contact;
