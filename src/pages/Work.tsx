import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "Sited transformed our entire digital presence. The website they built doesn't just look incredible—it's become our most effective sales tool. Conversion rates tripled within the first month.",
    author: "Sarah Mitchell",
    role: "Founder",
    company: "Bloom Floristry",
    rating: 5,
    gradient: "from-rose-500/5 via-transparent to-pink-500/5",
  },
  {
    quote: "Working with Sited felt like having a world-class design team in-house. They understood our vision immediately and delivered an app that our users genuinely love. The attention to detail is unmatched.",
    author: "Marcus Chen",
    role: "CEO",
    company: "FitTrack Pro",
    rating: 5,
    gradient: "from-blue-500/5 via-transparent to-cyan-500/5",
  },
  {
    quote: "The AI integration they implemented has automated 60% of our customer service. It's not just a chatbot—it's an intelligent system that actually understands context and delivers real value.",
    author: "Elena Rodriguez",
    role: "Operations Director",
    company: "MediCare Connect",
    rating: 5,
    gradient: "from-emerald-500/5 via-transparent to-teal-500/5",
  },
  {
    quote: "From our first conversation to launch, the experience was seamless. Sited doesn't just build websites—they craft experiences. Our brand has never looked more professional.",
    author: "James Okonkwo",
    role: "Managing Director",
    company: "Urban Estates",
    rating: 5,
    gradient: "from-amber-500/5 via-transparent to-orange-500/5",
  },
];

const TestimonialBlock = ({
  testimonial,
  index,
}: {
  testimonial: typeof testimonials[0];
  index: number;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [80, 0, 0, -80]);

  return (
    <section
      ref={ref}
      className={`min-h-screen flex items-center justify-center relative overflow-hidden ${
        index % 2 === 0 ? "bg-background" : "bg-surface-elevated"
      }`}
    >
      {/* Ambient gradient */}
      <motion.div
        style={{ opacity }}
        className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient}`}
      />

      {/* Large quote mark background */}
      <motion.div
        style={{ opacity: useTransform(opacity, [0, 1], [0, 0.03]) }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <Quote size={600} strokeWidth={0.5} />
      </motion.div>

      <motion.div
        style={{ opacity, scale, y }}
        className="container-tight relative z-10 py-20"
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Rating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-1 mb-8"
          >
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <Star
                key={i}
                size={20}
                className="fill-accent text-accent"
              />
            ))}
          </motion.div>

          {/* Quote */}
          <motion.blockquote
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed mb-12 tracking-tight"
          >
            "{testimonial.quote}"
          </motion.blockquote>

          {/* Author info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4">
              <span className="text-xl font-semibold text-muted-foreground">
                {testimonial.author.charAt(0)}
              </span>
            </div>
            <span className="text-lg font-semibold">{testimonial.author}</span>
            <span className="text-muted-foreground">
              {testimonial.role}, {testimonial.company}
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Progress indicator */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3">
        {testimonials.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === index ? "bg-foreground scale-125" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

const Work = () => {
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(heroProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(heroProgress, [0, 0.5], [0, 100]);

  return (
    <Layout>
      {/* Hero */}
      <section
        ref={heroRef}
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-elevated via-background to-background" />

        {/* Floating elements */}
        <motion.div
          className="absolute top-1/4 left-[15%] w-80 h-80 bg-accent/15 rounded-full blur-3xl"
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-[15%] w-64 h-64 bg-accent/20 rounded-full blur-3xl"
          animate={{ y: [20, -20, 20] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 container-tight text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-secondary rounded-full px-5 py-2 mb-8"
          >
            <span className="text-sm font-medium uppercase tracking-wider">Client Stories</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight leading-[1.05] mb-8"
          >
            Results that
            <br />
            <span className="text-muted-foreground">speak volumes</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Don't just take our word for it. Hear from the businesses
            <br />
            we've helped transform.
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-3"
          >
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Explore</span>
            <div className="w-px h-12 bg-gradient-to-b from-muted-foreground/50 to-transparent" />
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonial Sections */}
      {testimonials.map((testimonial, index) => (
        <TestimonialBlock
          key={testimonial.author}
          testimonial={testimonial}
          index={index}
        />
      ))}

      {/* Stats */}
      <section className="py-32 bg-surface-elevated relative overflow-hidden">
        <div className="container-tight">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {[
              { value: "50+", label: "Projects Delivered" },
              { value: "98%", label: "Client Satisfaction" },
              { value: "3x", label: "Average ROI" },
              { value: "2 weeks", label: "Average Delivery" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <span className="text-5xl md:text-6xl font-semibold tracking-tight">{stat.value}</span>
                <p className="text-muted-foreground mt-3 text-sm uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="min-h-[80vh] flex items-center justify-center bg-foreground text-background relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }} />
        </div>

        <div className="container-tight text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-8"
          >
            Ready to join
            <br />
            our success stories?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-background/60 text-lg max-w-xl mx-auto mb-12"
          >
            Let's create something extraordinary together.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Button
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <Link to="/contact">
                Start Your Project <ArrowRight size={20} />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Work;
