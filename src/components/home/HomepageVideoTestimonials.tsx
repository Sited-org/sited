import { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useHomepageTestimonials } from "@/hooks/useTestimonials";
import { extractVimeoId, getVimeoThumbnail } from "@/lib/vimeo";

export function HomepageVideoTestimonials() {
  const { data: testimonials, isLoading } = useHomepageTestimonials();

  // Filter to only those with a video_url
  const videoTestimonials = (testimonials || []).filter((t) => t.video_url);

  if (isLoading || videoTestimonials.length === 0) return null;

  // Show max 2
  const visible = videoTestimonials.slice(0, 2);

  return (
    <section className="bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">
            Hear It From Them
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Video <span className="text-sited-blue">Testimonials</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {visible.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <VideoTestimonialCard testimonial={t} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoTestimonialCard({ testimonial }: { testimonial: { video_url: string | null; business_name: string; testimonial_author: string } }) {
  const [playing, setPlaying] = useState(false);
  const vimeoId = extractVimeoId(testimonial.video_url || "") || "";
  const thumbnail = getVimeoThumbnail(vimeoId);

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-soft hover:shadow-elevated transition-shadow duration-500">
      <div className="relative aspect-video overflow-hidden bg-muted">
        {playing ? (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full relative cursor-pointer group" onClick={() => setPlaying(true)}>
            <img
              src={thumbnail}
              alt={`${testimonial.business_name} testimonial`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-elevated"
              >
                <Play size={28} className="ml-1 text-foreground" fill="currentColor" />
              </motion.div>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <p className="font-black text-foreground uppercase tracking-tight">{testimonial.testimonial_author}</p>
        <p className="text-sm text-muted-foreground">{testimonial.business_name}</p>
      </div>
    </div>
  );
}
