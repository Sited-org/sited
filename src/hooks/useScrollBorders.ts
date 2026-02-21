import { useEffect, useRef } from "react";

/**
 * Adds `.in-view` class to elements with `.scroll-border-blue` or `.scroll-border-gold`
 * when they enter the viewport, creating a pop-colour border on scroll.
 */
export function useScrollBorders(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    const elements = container.querySelectorAll(".scroll-border-blue, .scroll-border-gold");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [containerRef]);
}
