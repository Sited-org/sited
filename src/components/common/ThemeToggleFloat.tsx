import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

/**
 * Floating sun/moon toggle — bottom-right, clean instant theme swap.
 * No overlay animation — just a snappy icon transition.
 */
export const ThemeToggleFloat = () => {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((p) => !p), []);

  return (
    <motion.button
      onClick={toggle}
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
  );
};
