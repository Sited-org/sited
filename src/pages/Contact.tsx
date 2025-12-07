import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, MapPin, ArrowRight, Globe, Smartphone, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success("Message sent! We'll be in touch soon.");
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-surface-elevated to-background">
        <div className="container-tight text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
              Contact Us
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6"
          >
            Let's build something
            <br />
            <span className="text-muted-foreground">great together</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Have a project in mind? We'd love to hear about it. Get in touch and
            let's create something extraordinary.
          </motion.p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <ScrollReveal>
              <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
                <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="h-12"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input
                      id="company"
                      placeholder="Your company name"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your project..."
                      required
                      className="min-h-[150px] resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    <ArrowRight size={18} />
                  </Button>
                </form>
              </div>
            </ScrollReveal>

            {/* Contact Info & Start Project */}
            <div className="space-y-8">
              <ScrollReveal delay={0.1}>
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">Get in touch</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                        <Mail size={20} className="text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Email</p>
                        <a
                          href="mailto:hello@sited.com"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          hello@sited.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                        <MapPin size={20} className="text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-muted-foreground">
                          Remote-first, serving clients worldwide
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <div className="border-t border-border pt-8">
                  <h2 className="text-2xl font-semibold mb-4">
                    Ready to start your project?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Fill out our detailed onboarding form to help us understand
                    your project requirements in depth.
                  </p>
                  <div className="space-y-3">
                    <Button variant="outline" size="lg" className="w-full justify-start" asChild>
                      <Link to="/onboarding/website">
                        <Globe size={20} />
                        Start Website Project
                        <ArrowRight size={18} className="ml-auto" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" className="w-full justify-start" asChild>
                      <Link to="/onboarding/app">
                        <Smartphone size={20} />
                        Start App Project
                        <ArrowRight size={18} className="ml-auto" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" className="w-full justify-start" asChild>
                      <Link to="/onboarding/ai">
                        <Sparkles size={20} />
                        Start AI Integration Project
                        <ArrowRight size={18} className="ml-auto" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.3}>
                <div className="bg-accent/30 rounded-2xl p-6">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Response time:</strong> We
                    typically respond within 24 hours during business days.
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
