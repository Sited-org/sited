import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { createPortal } from "react-dom";

export const ThemeToggleFloat = () => {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [bubble, setBubble] = useState<{
    phase: "expanding" | "contracting";
    x: number;
    y: number;
    targetDark: boolean;
  } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const animating = useRef(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const getMaxRadius = (x: number, y: number) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return Math.ceil(
      Math.sqrt(Math.max(x, w - x) ** 2 + Math.max(y, h - y) ** 2)
    );
  };

  const handleClick = useCallback(() => {
    if (animating.current) return;
    const btn = btnRef.current;
    if (!btn) { setIsDark((p) => !p); return; }

    animating.current = true;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const targetDark = !isDark;

    setBubble({ phase: "expanding", x: cx, y: cy, targetDark });
  }, [isDark]);

  useEffect(() => {
    if (!bubble) return;
    if (bubble.phase === "expanding") {
      const t = setTimeout(() => {
        setIsDark(bubble.targetDark);
        setBubble((prev) => (prev ? { ...prev, phase: "contracting" } : null));
      }, 600);
      return () => clearTimeout(t);
    }
    if (bubble.phase === "contracting") {
      const t = setTimeout(() => {
        setBubble(null);
        animating.current = false;
      }, 600);
      return () => clearTimeout(t);
    }
  }, [bubble?.phase]);

  const maxR = bubble ? getMaxRadius(bubble.x, bubble.y) : 0;

  const bubbleColor = bubble
    ? bubble.targetDark
      ? "hsl(220, 15%, 5%)"
      : "hsl(0, 0%, 100%)"
    : "transparent";

  return (
    <>
      <motion.button
        ref={btnRef}
        onClick={handleClick}
        className="fixed bottom-20 right-6 z-[60] w-12 h-12 rounded-full bg-card border border-border shadow-elevated flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.4, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.25 }}
            >
              <Sun size={20} className="text-[hsl(var(--gold))]" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.25 }}
            >
              <Moon size={20} className="text-sited-blue" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {bubble &&
        createPortal(
          <BubbleOverlay
            x={bubble.x}
            y={bubble.y}
            maxR={maxR}
            color={bubbleColor}
            phase={bubble.phase}
          />,
          document.body
        )}
    </>
  );
};

const BubbleOverlay = ({
  x,
  y,
  maxR,
  color,
  phase,
}: {
  x: number;
  y: number;
  maxR: number;
  color: string;
  phase: "expanding" | "contracting";
}) => {
  // Pre-calculate droplet positions so they don't change on re-render
  const droplets = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 8 + (i * 0.3);
      const dist = maxR * 0.12 * (0.4 + (i % 3) * 0.3);
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size: 5 + (i % 4) * 4,
        delay: 0.02 + i * 0.03,
      };
    });
  }, [maxR]);

  const diameter = maxR * 2.4;
  const filterId = "liquid-bubble-filter";

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      {/* SVG filter for organic wobbly edges */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.02"
              numOctaves={4}
              seed={12}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={phase === "expanding" ? 35 : 25}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Main bubble */}
      <motion.div
        initial={phase === "expanding" ? { scale: 0 } : { scale: 1 }}
        animate={phase === "expanding" ? { scale: 1 } : { scale: 0 }}
        transition={{
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: diameter,
          height: diameter,
          marginLeft: -diameter / 2,
          marginTop: -diameter / 2,
          borderRadius: "50%",
          backgroundColor: color,
          transformOrigin: "center",
          willChange: "transform",
          filter: `url(#${filterId})`,
        }}
      />

      {/* Droplets that trail behind the expanding bubble */}
      {phase === "expanding" &&
        droplets.map((d, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{
              scale: [0, 1.6, 0],
              opacity: [0.9, 0.5, 0],
            }}
            transition={{
              duration: 0.5,
              delay: d.delay,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              left: x + d.dx - d.size / 2,
              top: y + d.dy - d.size / 2,
              width: d.size,
              height: d.size,
              borderRadius: "50%",
              backgroundColor: color,
              willChange: "transform, opacity",
            }}
          />
        ))}

      {/* Secondary ring that lags slightly for depth */}
      <motion.div
        initial={phase === "expanding" ? { scale: 0, opacity: 0.3 } : { scale: 0.95, opacity: 0 }}
        animate={phase === "expanding" ? { scale: 0.95, opacity: 0 } : { scale: 0, opacity: 0.3 }}
        transition={{
          duration: 0.65,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.05,
        }}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: diameter * 0.85,
          height: diameter * 0.85,
          marginLeft: -diameter * 0.85 / 2,
          marginTop: -diameter * 0.85 / 2,
          borderRadius: "50%",
          border: `2px solid ${color}`,
          transformOrigin: "center",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
};
