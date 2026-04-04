import { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { extractVimeoId, getVimeoThumbnail } from "@/lib/vimeo";
import { usePortfolioTestimonials } from "@/hooks/useTestimonials";

const VideoCard = ({ video }: { video: { name: string; business: string; vimeoUrl: string } }) => {
  const [playing, setPlaying] = useState(false);
  const vimeoId = extractVimeoId(video.vimeoUrl) || "";
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
              alt={`${video.business} testimonial`}
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
        <p className="font-black text-foreground uppercase tracking-tight">{video.name}</p>
        <p className="text-sm text-muted-foreground">{video.business}</p>
      </div>
    </div>
  );
};

export const VideoTestimonials = () => {
  const { data: dbTestimonials } = usePortfolioTestimonials();

  // Use DB testimonials with video_url, fall back to empty (hide section)
  const videoTestimonials = (dbTestimonials || [])
    .filter(t => t.video_url)
    .map(t => ({
      name: t.testimonial_author,
      business: t.business_name,
      vimeoUrl: t.video_url!,
    }));

  if (videoTestimonials.length === 0) return null;

  const visible = videoTestimonials.slice(0, 4);

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="w-[92%] max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-sited-blue font-bold mb-3">
            See & Hear It From Them
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase">
            Video <span className="text-sited-blue">Testimonials</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Real clients. Real stories. Hit play and hear it straight from them.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {visible.map((video, i) => (
            <motion.div
              key={video.name + i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.1 }}
            >
              <VideoCard video={video} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
