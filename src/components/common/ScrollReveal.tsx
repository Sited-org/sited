import { motion, useInView } from "framer-motion";
import { useRef, ReactNode, memo } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
}

export const ScrollReveal = memo(({
  children,
  className,
  delay = 0,
  direction = "up",
}: ScrollRevealProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const variants = {
    up: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
    down: { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 } },
    scale: { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 } },
  };

  return (
    <motion.div
      ref={ref}
      initial={variants[direction].initial}
      animate={isInView ? variants[direction].animate : variants[direction].initial}
      transition={{
        duration: 0.4,
        delay,
        ease: "easeOut",
      }}
      className={className}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  );
});

ScrollReveal.displayName = 'ScrollReveal';
