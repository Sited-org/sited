import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, ExternalLink, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractVimeoId, getVimeoThumbnail } from "@/lib/vimeo";

interface TestimonialCardProps {
  company: string;
  category: string;
  description: string;
  testimonial: string;
  author: string;
  role: string;
  videoThumbnail: string;
  videoUrl?: string | null;
  websiteUrl: string;
  index: number;
}

export const TestimonialCard = ({
  company,
  category,
  description,
  testimonial,
  author,
  role,
  videoThumbnail,
  videoUrl,
  websiteUrl,
  index,
}: TestimonialCardProps) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isEven = index % 2 === 0;

  const vimeoId = extractVimeoId(videoUrl || '');
  const thumbnailSrc = vimeoId
    ? getVimeoThumbnail(vimeoId)
    : videoThumbnail;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: "-50px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="w-full transition-all duration-600 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transitionDelay: `${index * 80}ms`,
      }}
    >
      <div
        className={`
          relative overflow-hidden rounded-2xl sm:rounded-3xl
          bg-background/30 backdrop-blur-xl border border-white/15
          shadow-soft hover:shadow-elevated transition-all duration-500
          flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"}
        `}
      >
        {/* Video / Thumbnail Section */}
        <div className="relative w-full lg:w-3/5 aspect-video overflow-hidden flex-shrink-0">
          {vimeoId && showPlayer ? (
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div
              className="w-full h-full relative cursor-pointer group"
              onClick={() => vimeoId && setShowPlayer(true)}
            >
              <img
                src={thumbnailSrc}
                alt={`${company} project showcase`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width={1200}
                height={800}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
              {vimeoId && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-elevated group-hover:bg-background transition-colors"
                  >
                    <Play size={28} className="ml-1 text-foreground" fill="currentColor" />
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-4 left-4 z-30">
            <span className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider bg-background/90 backdrop-blur-sm rounded-full text-foreground">
              {category}
            </span>
          </div>
        </div>

        {/* Text Content Section */}
        <div className="w-full lg:w-2/5 p-6 sm:p-8 lg:p-10 flex flex-col justify-center space-y-5 bg-background/20 backdrop-blur-md">
          <div>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {company}
            </h3>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          <div className="relative">
            <Quote className="absolute -top-1 -left-1 w-5 h-5 text-accent/40" />
            <blockquote className="pl-7 border-l-2 border-accent/30">
              <p className="text-sm sm:text-base text-foreground/90 italic leading-relaxed">
                "{testimonial}"
              </p>
              <cite className="block mt-3 text-xs sm:text-sm text-muted-foreground not-italic">
                <span className="font-medium text-foreground">{author}</span>
                <span className="mx-2">·</span>
                <span>{role}</span>
              </cite>
            </blockquote>
          </div>

          {websiteUrl && websiteUrl !== "#" && (
            <div>
              <Button variant="outline" size="sm" className="group/btn gap-2" asChild>
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                  View Project
                  <ExternalLink
                    size={14}
                    className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                  />
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
