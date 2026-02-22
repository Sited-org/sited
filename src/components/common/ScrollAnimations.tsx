import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, ReactNode } from "react";

/** Parallax shift — element moves at a different speed than scroll */
export function ScrollParallax({ children, className, speed = 0.3 }: { children: ReactNode; className?: string; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Horizontal slide-in tied to scroll position (reversible) */
export function ScrollSlideIn({ children, className, from = "left" }: { children: ReactNode; className?: string; from?: "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const x = useTransform(scrollYProgress, [0, 1], [from === "left" ? -80 : 80, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 0.5, 1]);
  return (
    <motion.div ref={ref} style={{ x, opacity }} className={className}>
      {children}
    </motion.div>
  );
}

/** Rotate in from an angle tied to scroll */
export function ScrollRotateIn({ children, className, degrees = 8 }: { children: ReactNode; className?: string; degrees?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [degrees, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [0, 0.6, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  return (
    <motion.div ref={ref} style={{ rotate, opacity, scale }} className={className}>
      {children}
    </motion.div>
  );
}

/** Scale up from small, tied to scroll position */
export function ScrollZoomIn({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.7, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [0, 0.5, 1]);
  return (
    <motion.div ref={ref} style={{ scale, opacity }} className={className}>
      {children}
    </motion.div>
  );
}

/** Stagger children with scroll-driven vertical offset */
export function ScrollStaggerItem({ children, className, index = 0 }: { children: ReactNode; className?: string; index?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const y = useTransform(scrollYProgress, [0, 1], [40 + index * 15, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 0.3, 1]);
  return (
    <motion.div ref={ref} style={{ y, opacity }} className={className}>
      {children}
    </motion.div>
  );
}

/** Text clip reveal — a coloured bar sweeps across revealing content */
export function ScrollWipeReveal({ children, className, accent = "blue" }: { children: ReactNode; className?: string; accent?: "blue" | "gold" }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const clipRight = useTransform(scrollYProgress, [0, 0.5, 0.8], [100, 0, 0]);
  const barX = useTransform(scrollYProgress, [0, 0.5, 0.8, 1], ["-100%", "0%", "0%", "110%"]);
  const accentColor = accent === "blue" ? "hsl(var(--sited-blue))" : "hsl(var(--gold))";
  return (
    <motion.div ref={ref} className={`relative overflow-hidden ${className || ""}`}>
      <motion.div style={{ clipPath: useTransform(clipRight, v => `inset(0 ${v}% 0 0)`) }}>
        {children}
      </motion.div>
      <motion.div
        style={{ x: barX, backgroundColor: accentColor }}
        className="absolute inset-y-0 left-0 w-full pointer-events-none z-10"
      />
    </motion.div>
  );
}
