import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    text: "Andy & the team at Sited were great in their professionalism & customer service. If you are looking for a website I would definitely recommend reaching out to Andy.",
    author: "Ben Brown",
    role: "Owner, Ingle & Brown Conveyancing",
    stars: 5,
  },
  {
    text: "Sited was incredible in their delivery, even with very specific instructions for how I wanted the website to look. All changes were looked at & implemented within days.",
    author: "Beata Fuller",
    role: "CEO, Wisdom Education",
    stars: 5,
  },
  {
    text: "Sited transformed our entire digital presence. The website they built doesn't just look incredible — it's become our most effective sales tool.",
    author: "Sarah Mitchell",
    role: "Founder, Bloom Floristry",
    stars: 5,
  },
  {
    text: "Working with Sited felt like having a world-class design team in-house. They understood our vision immediately and exceeded every expectation.",
    author: "Marcus Chen",
    role: "CEO, Urban Fitness",
    stars: 5,
  },
  {
    text: "The website they built isn't just beautiful — it's become our most effective sales tool. Inquiries have quadrupled since launch.",
    author: "Elena Rodriguez",
    role: "Director, Coastal Realty",
    stars: 5,
  },
  {
    text: "From day one, Sited treated our project like it was their own. The attention to detail and speed of delivery was beyond what we expected.",
    author: "Daniel Verwoert",
    role: "Owner, Hunter Insight",
    stars: 5,
  },
];

const TestimonialBlock = ({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0];
  index: number;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Sticky-release effect: testimonial lags behind scroll then catches up
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [60, 0, 0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.4, 0.6, 0.85, 1], [0, 0.6, 1, 1, 0.6, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.97, 1, 1, 0.97]);

  return (
    <motion.div ref={ref} style={{ y, opacity, scale }} className="py-8 sm:py-12 border-b border-border last:border-b-0">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <Quote size={36} className="text-sited-blue/30 shrink-0 mt-1" />
        <div className="flex-1">
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-snug tracking-tight">
            "{testimonial.text}"
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex gap-0.5">
              {Array.from({ length: testimonial.stars }).map((_, i) => (
                <Star key={i} size={14} className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
              ))}
            </div>
            <span className="text-sm font-bold text-foreground">{testimonial.author}</span>
            <span className="text-sm text-muted-foreground">· {testimonial.role}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ScrollTextTestimonials = () => (
  <section className="py-16 sm:py-24 bg-card border-y border-border">
    <div className="w-[92%] max-w-[900px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center mb-10"
      >
        <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">
          In Their Own Words
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase">
          What Our <span className="text-sited-blue">Clients</span> Say
        </h2>
      </motion.div>

      <div>
        {testimonials.map((t, i) => (
          <TestimonialBlock key={t.author} testimonial={t} index={i} />
        ))}
      </div>
    </div>
  </section>
);
