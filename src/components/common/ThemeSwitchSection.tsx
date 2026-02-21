import { useEffect, useRef } from "react";

/**
 * Wraps children in a section that temporarily switches
 * to light theme when ≥40% visible, reverting on scroll out.
 * Uses IntersectionObserver for performance.
 */
export const ThemeSwitchSection = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("light-section-active");
        } else {
          el.classList.remove("light-section-active");
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`theme-switch-section ${className}`}>
      {children}
    </div>
  );
};
