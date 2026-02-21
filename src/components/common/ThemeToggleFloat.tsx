import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { createPortal } from "react-dom";

/**
 * Floating sun/moon toggle — bottom-right.
 * On click an organic splat-shaped blob expands from the button to fill the viewport,
 * then the theme flips and the blob contracts back.
 */
export const ThemeToggleFloat = () => {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [bubble, setBubble] = useState<{
    phase: "expanding" | "contracting";
    cx: number;
    cy: number;
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

  const handleClick = useCallback(() => {
    if (animating.current) return;
    const btn = btnRef.current;
    if (!btn) { setIsDark((p) => !p); return; }

    animating.current = true;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    setBubble({ phase: "expanding", cx, cy, targetDark: !isDark });
  }, [isDark]);

  // Two-phase animation driver
  useEffect(() => {
    if (!bubble) return;
    if (bubble.phase === "expanding") {
      const t = setTimeout(() => {
        setIsDark(bubble.targetDark);
        setBubble((p) => (p ? { ...p, phase: "contracting" } : null));
      }, 550);
      return () => clearTimeout(t);
    }
    if (bubble.phase === "contracting") {
      const t = setTimeout(() => {
        setBubble(null);
        animating.current = false;
      }, 550);
      return () => clearTimeout(t);
    }
  }, [bubble?.phase]);

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
          <SplatOverlay
            cx={bubble.cx}
            cy={bubble.cy}
            color={bubble.targetDark ? "hsl(220, 15%, 5%)" : "hsl(0, 0%, 100%)"}
            phase={bubble.phase}
          />,
          document.body
        )}
    </>
  );
};

/* ─── Organic splat overlay ─── */
const SplatOverlay = ({
  cx,
  cy,
  color,
  phase,
}: {
  cx: number;
  cy: number;
  color: string;
  phase: "expanding" | "contracting";
}) => {
  const [mounted, setMounted] = useState(false);

  // Trigger expansion after mount so CSS transition fires
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
  }, []);

  const w = window.innerWidth;
  const h = window.innerHeight;
  const maxR = Math.ceil(
    Math.sqrt(Math.max(cx, w - cx) ** 2 + Math.max(cy, h - cy) ** 2)
  );

  // scale logic: expand → 1, contract → 0
  const isExpanded = phase === "expanding" ? mounted : false;

  // The diameter must cover the full diagonal
  const d = maxR * 2.2;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      {/* Hidden SVG with organic splat clip-path */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          {/* Organic blob shape — hand-crafted irregular circle */}
          <clipPath id="splat-clip" clipPathUnits="objectBoundingBox">
            <path d="M0.5,0.02 C0.62,0.0,0.78,0.05,0.88,0.15 C0.96,0.23,1.0,0.38,0.98,0.5 C1.01,0.63,0.95,0.78,0.86,0.87 C0.77,0.96,0.63,1.0,0.5,0.98 C0.37,1.01,0.22,0.95,0.13,0.86 C0.04,0.77,0.0,0.62,0.02,0.5 C0.0,0.37,0.05,0.22,0.14,0.13 C0.23,0.04,0.38,0.0,0.5,0.02Z" />
          </clipPath>
          {/* SVG filter for wobbly organic edge */}
          <filter id="splat-warp" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.025" numOctaves={3} seed={7} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Main splat blob */}
      <div
        style={{
          position: "absolute",
          left: cx - d / 2,
          top: cy - d / 2,
          width: d,
          height: d,
          backgroundColor: color,
          clipPath: "url(#splat-clip)",
          filter: "url(#splat-warp)",
          transform: `scale(${isExpanded ? 1 : 0})`,
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          transformOrigin: "center",
          willChange: "transform",
        }}
      />

      {/* Small satellite splats for organic feel */}
      {phase === "expanding" && mounted && (
        <>
          {SPLAT_DROPS.map((drop, i) => {
            const dx = Math.cos(drop.angle) * maxR * drop.dist;
            const dy = Math.sin(drop.angle) * maxR * drop.dist;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: cx + dx - drop.size / 2,
                  top: cy + dy - drop.size / 2,
                  width: drop.size,
                  height: drop.size,
                  borderRadius: "50%",
                  backgroundColor: color,
                  opacity: 0,
                  animation: `splat-drop 0.45s ${drop.delay}s ease-out forwards`,
                }}
              />
            );
          })}
        </>
      )}

      <style>{`
        @keyframes splat-drop {
          0%   { transform: scale(0); opacity: 0.7; }
          60%  { transform: scale(1.3); opacity: 0.4; }
          100% { transform: scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

/* Pre-computed satellite drop positions so they're deterministic */
const SPLAT_DROPS = [
  { angle: 0.4, dist: 0.08, size: 14, delay: 0.02 },
  { angle: 1.2, dist: 0.12, size: 10, delay: 0.05 },
  { angle: 2.1, dist: 0.06, size: 18, delay: 0.03 },
  { angle: 3.0, dist: 0.10, size: 8, delay: 0.07 },
  { angle: 3.9, dist: 0.14, size: 12, delay: 0.04 },
  { angle: 4.8, dist: 0.07, size: 16, delay: 0.06 },
  { angle: 5.5, dist: 0.11, size: 9, delay: 0.08 },
];
