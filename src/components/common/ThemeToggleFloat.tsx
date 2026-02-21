import { useState, useEffect, useCallback, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { createPortal } from "react-dom";

/**
 * Floating sun/moon toggle — bottom-right, 10% larger than original.
 * On click a liquid bubble expands from the button to fill the viewport,
 * then the theme flips and the bubble contracts back.
 */
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

    // Phase 1: expand
    setBubble({ phase: "expanding", x: cx, y: cy, targetDark });
  }, [isDark]);

  /* Drive the two-phase animation via effects */
  useEffect(() => {
    if (!bubble) return;
    if (bubble.phase === "expanding") {
      // After expansion finishes → flip theme, start contraction
      const t = setTimeout(() => {
        setIsDark(bubble.targetDark);
        setBubble((prev) => (prev ? { ...prev, phase: "contracting" } : null));
      }, 520);
      return () => clearTimeout(t);
    }
    if (bubble.phase === "contracting") {
      const t = setTimeout(() => {
        setBubble(null);
        animating.current = false;
      }, 520);
      return () => clearTimeout(t);
    }
  }, [bubble?.phase]);

  const maxR = bubble ? getMaxRadius(bubble.x, bubble.y) : 0;

  // Bubble colour = the INCOMING theme's background
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

      {/* Liquid bubble overlay via portal */}
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

/**
 * Liquid bubble overlay with SVG turbulence for a real fluid feel.
 * Uses feTurbulence + feDisplacementMap to distort the edge of the circle.
 */
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
  const [mounted, setMounted] = useState(false);
  const turbRef = useRef<SVGAnimateElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
  }, []);

  const scale = phase === "expanding" ? (mounted ? 1 : 0) : 0;
  // Turbulence intensity fades as bubble fills (more wobble at edges)
  const turbScale = phase === "expanding" ? (mounted ? 18 : 60) : 60;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      {/* SVG filter for liquid distortion */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="liquid-bubble" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.025"
              numOctaves={3}
              seed={42}
              result="noise"
            >
              <animate
                ref={turbRef}
                attributeName="baseFrequency"
                values="0.015 0.025;0.02 0.035;0.015 0.025"
                dur="1.2s"
                repeatCount="1"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={turbScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: maxR * 2.2,
          height: maxR * 2.2,
          marginLeft: -maxR * 1.1,
          marginTop: -maxR * 1.1,
          borderRadius: "50%",
          backgroundColor: color,
          transform: `scale(${scale})`,
          transition: "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
          transformOrigin: "center",
          willChange: "transform",
          filter: "url(#liquid-bubble)",
        }}
      />

      {/* Small trailing droplets */}
      {mounted && phase === "expanding" && (
        <>
          {[...Array(5)].map((_, i) => {
            const angle = (Math.PI * 2 * i) / 5 + Math.random() * 0.5;
            const dist = maxR * 0.15 * (0.5 + Math.random());
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;
            const size = 6 + Math.random() * 10;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x + dx - size / 2,
                  top: y + dy - size / 2,
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  backgroundColor: color,
                  opacity: 0,
                  animation: `droplet-pop 0.6s ${0.05 + i * 0.04}s ease-out forwards`,
                }}
              />
            );
          })}
        </>
      )}

      <style>{`
        @keyframes droplet-pop {
          0% { transform: scale(0); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 0.5; }
          100% { transform: scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
