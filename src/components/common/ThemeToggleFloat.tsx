import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

/**
 * Floating sun/moon toggle with an expanding splat bubble overlay
 * that fills the viewport to transition the theme.
 */
export const ThemeToggleFloat = () => {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [expanding, setExpanding] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Apply theme class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggle = useCallback(() => {
    if (expanding) return;

    const btn = btnRef.current;
    if (!btn) {
      setIsDark((p) => !p);
      return;
    }

    // Get button position for expansion origin
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Calculate radius needed to cover entire viewport
    const maxDist = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(window.innerWidth - cx, cy),
      Math.hypot(cx, window.innerHeight - cy),
      Math.hypot(window.innerWidth - cx, window.innerHeight - cy)
    );

    const overlay = overlayRef.current;
    if (!overlay) {
      setIsDark((p) => !p);
      return;
    }

    // Position overlay at button center
    overlay.style.left = `${cx}px`;
    overlay.style.top = `${cy}px`;
    overlay.style.width = `${maxDist * 2}px`;
    overlay.style.height = `${maxDist * 2}px`;
    overlay.style.marginLeft = `${-maxDist}px`;
    overlay.style.marginTop = `${-maxDist}px`;

    // Set the overlay to the INCOMING theme colour
    const incomingBg = isDark
      ? "hsl(0, 0%, 100%)" // switching to light
      : "hsl(220, 15%, 5%)"; // switching to dark
    overlay.style.backgroundColor = incomingBg;

    setExpanding(true);

    // Scale up with CSS transition
    requestAnimationFrame(() => {
      overlay.style.transform = "scale(1)";
      overlay.style.opacity = "1";
    });

    // After expansion, flip theme & hide overlay
    const timer = setTimeout(() => {
      setIsDark((p) => !p);
      // Small delay to let the theme apply, then hide overlay
      requestAnimationFrame(() => {
        overlay.style.transition = "opacity 0.3s ease";
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.style.transform = "scale(0)";
          overlay.style.transition = "";
          overlay.style.opacity = "";
          setExpanding(false);
        }, 300);
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [isDark, expanding]);

  return (
    <>
      {/* Expanding overlay */}
      <div
        ref={overlayRef}
        className="fixed z-[999] rounded-full pointer-events-none"
        style={{
          transform: "scale(0)",
          opacity: "0",
          transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.15s ease",
          clipPath: `url(#splat-clip)`,
        }}
      />

      {/* SVG filter for organic splat edges */}
      <svg className="fixed w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="splat-warp">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="2" />
            <feDisplacementMap in="SourceGraphic" scale="30" />
          </filter>
          <clipPath id="splat-clip" clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r="0.5" style={{ filter: "url(#splat-warp)" }} />
          </clipPath>
        </defs>
      </svg>

      {/* Toggle button */}
      <motion.button
        ref={btnRef}
        onClick={toggle}
        className="fixed bottom-20 right-6 z-[1000] w-12 h-12 rounded-full bg-card border border-border shadow-elevated flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
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
    </>
  );
};
