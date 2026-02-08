import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Play, ExternalLink, Quote, Pause, Volume2, VolumeX } from "lucide-react";
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
  videoUrl,
  websiteUrl,
  index,
}: TestimonialCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const hasVideo = !!videoUrl;
  const isEven = index % 2 === 0;

  // Check if URL is a directly playable video (storage URL or direct file)
  const isDirectVideo = hasVideo && !videoUrl!.includes("youtube") && !videoUrl!.includes("vimeo") && !videoUrl!.includes("youtu.be") && !videoUrl!.includes("drive.google.com");

  const handlePlay = () => {
    if (!videoRef.current) return;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  const handlePlayWithSound = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = false;
    setIsMuted(false);
    videoRef.current.play();
    setIsPlaying(true);
  };

  // For external links (Google Drive, YouTube, Vimeo)
  const getExternalUrl = () => {
    if (!videoUrl) return "#";
    if (videoUrl.includes("drive.google.com")) {
      const match = videoUrl.match(/\/d\/([^/]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return videoUrl;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
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
          {isDirectVideo ? (
            <>
              {/* Video element - preloads first frames */}
              <video
                ref={videoRef}
                src={videoUrl!}
                className="w-full h-full object-cover"
                onEnded={handleVideoEnd}
                playsInline
                preload="auto"
                muted
                poster={videoThumbnail && !videoThumbnail.includes("unsplash.com") ? videoThumbnail : undefined}
              />

              {/* Play / Pause overlay */}
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                {!isPlaying ? (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlayWithSound}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center cursor-pointer shadow-elevated"
                  >
                    <Play size={28} className="ml-1 text-foreground" fill="currentColor" />
                  </motion.div>
                ) : (
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handlePause}
                      className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center cursor-pointer"
                    >
                      <Pause size={18} className="text-foreground" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleMute}
                      className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center cursor-pointer"
                    >
                      {isMuted ? <VolumeX size={18} className="text-foreground" /> : <Volume2 size={18} className="text-foreground" />}
                    </motion.button>
                  </div>
                )}
              </div>
            </>
          ) : hasVideo ? (
            // External video link (Google Drive, YouTube, etc.)
            <a href={getExternalUrl()} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
              <img
                src={videoThumbnail}
                alt={`${company} testimonial`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-elevated">
                  <Play size={28} className="ml-1 text-foreground" fill="currentColor" />
                </div>
              </div>
            </a>
          ) : (
            // No video — just thumbnail
            <div className="w-full h-full">
              <img
                src={videoThumbnail}
                alt={`${company} testimonial`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-4 left-4 z-30">
            <span className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider bg-background/90 backdrop-blur-sm rounded-full text-foreground">
              {category}
            </span>
          </div>
        </div>

        {/* Text Content Section - glassmorphism */}
        <div className="w-full lg:w-2/5 p-6 sm:p-8 lg:p-10 flex flex-col justify-center space-y-5 bg-background/20 backdrop-blur-md">
          <div>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {company}
            </h3>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          {/* Testimonial quote */}
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

          {/* CTA */}
          {websiteUrl && websiteUrl !== "#" && (
            <div>
              <Button
                variant="outline"
                size="sm"
                className="group/btn gap-2"
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
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
