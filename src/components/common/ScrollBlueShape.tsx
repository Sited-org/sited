import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * A thick blue rectangle that slides into view from the left
 * as the user scrolls past its container. Purely decorative.
 */
const ScrollBlueShape = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Slide from off-screen left (-100%) to partially visible (10%)
  const x = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], ["-100%", "0%", "0%", "80%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-2, 2]);

  return (
    <div ref={ref} className="relative w-full h-32 sm:h-40 overflow-hidden pointer-events-none select-none my-8 sm:my-12">
      <motion.div
        style={{ x, opacity, rotate }}
        className="absolute inset-y-0 left-0 w-[70%] sm:w-[55%] rounded-r-[2rem] bg-sited-blue/90 dark:bg-sited-blue/70"
      />
      {/* Secondary accent bar */}
      <motion.div
        style={{
          x,
          opacity,
          rotate,
          translateX: "1.5rem",
          translateY: "0.75rem",
        }}
        className="absolute inset-y-2 left-0 w-[60%] sm:w-[45%] rounded-r-[1.5rem] bg-sited-blue/20 dark:bg-sited-blue/15 -z-10"
      />
    </div>
  );
};

export default ScrollBlueShape;
