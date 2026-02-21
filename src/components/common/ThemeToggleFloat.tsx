import { useState, useEffect, useCallback, useRef } from "react";
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
 * Separate component so we can use useEffect to trigger
 * the CSS transition from scale(0) → scale(1) after mount.
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

  useEffect(() => {
    // Trigger expansion on next frame so the CSS transition fires
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
  }, []);

  const scale = phase === "expanding" ? (mounted ? 1 : 0) : 0;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: maxR * 2,
          height: maxR * 2,
          marginLeft: -maxR,
          marginTop: -maxR,
          borderRadius: "50%",
          backgroundColor: color,
          transform: `scale(${scale})`,
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          transformOrigin: "center",
          willChange: "transform",
        }}
      />
    </div>
  );
};
