import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Play, ExternalLink, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  websiteUrl,
  index,
}: TestimonialCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tracking for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 15 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="group relative"
    >
      <div
        className={`
          relative overflow-hidden rounded-2xl sm:rounded-3xl
          bg-background/40 backdrop-blur-xl border border-white/20
          transition-all duration-500 ease-out
          ${isHovered ? "shadow-elevated border-white/40 bg-background/60" : "shadow-soft"}
        `}
      >
        {/* Gradient overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
        />

        {/* Video thumbnail section */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <motion.img
            src={videoThumbnail}
            alt={`${company} testimonial`}
            className="w-full h-full object-cover"
            animate={{
              scale: isHovered ? 1.05 : 1,
            }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" />
          
          {/* Play button */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              scale: isHovered ? 1 : 0.9,
              opacity: isHovered ? 1 : 0.8,
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-background/95 backdrop-blur-sm flex items-center justify-center cursor-pointer shadow-elevated"
            >
              <Play
                size={24}
                className="sm:w-7 sm:h-7 md:w-8 md:h-8 ml-1 text-foreground"
                fill="currentColor"
              />
            </motion.div>
          </motion.div>

          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider bg-background/90 backdrop-blur-sm rounded-full text-foreground">
              {category}
            </span>
          </div>

          {/* Company name overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-background tracking-tight">
              {company}
            </h3>
          </div>
        </div>

        {/* Content section */}
        <div className="p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
          {/* Description */}
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>

          {/* Testimonial quote */}
          <div className="relative">
            <Quote className="absolute -top-1 -left-1 w-6 h-6 text-accent/40" />
            <blockquote className="pl-6 sm:pl-8 border-l-2 border-accent/30">
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

          {/* CTA */}
          <motion.div
            animate={{
              y: isHovered ? 0 : 4,
              opacity: isHovered ? 1 : 0.7,
            }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="group/btn gap-2 mt-2"
              asChild
            >
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                View Project
                <ExternalLink
                  size={14}
                  className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                />
              </a>
            </Button>
          </motion.div>
        </div>

        {/* Subtle shine effect on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(105deg, transparent 40%, hsl(var(--background) / 0.1) 45%, transparent 50%)",
            transform: "translateX(-100%)",
          }}
          animate={{
            translateX: isHovered ? "200%" : "-100%",
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
};
