import { useEffect, useRef } from "react";

interface Bubble {
  x: number;
  y: number;
  r: number;       // radius
  baseR: number;
  speedX: number;
  speedY: number;
  opacity: number;
  phase: number;    // for gentle pulsing
  phaseSpeed: number;
}

/**
 * Faded floating bubbles background — subtle, realistic, works on both themes.
 * Renders soft translucent circles that drift and pulse gently.
 */
export const FloatingParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let animId: number;
    const bubbles: Bubble[] = [];
    const BUBBLE_COUNT = 18;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const baseR = 20 + Math.random() * 60;
      bubbles.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        r: baseR,
        baseR,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: -0.05 - Math.random() * 0.12, // drift upward gently
        opacity: 0.03 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.003 + Math.random() * 0.005,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());

      const isDark = document.documentElement.classList.contains("dark");
      // Use a neutral colour that works on both themes
      const baseColor = isDark ? "255, 255, 255" : "0, 0, 0";

      for (const b of bubbles) {
        b.x += b.speedX;
        b.y += b.speedY;
        b.phase += b.phaseSpeed;

        // Gentle pulse
        b.r = b.baseR + Math.sin(b.phase) * (b.baseR * 0.12);

        // Wrap around
        if (b.y + b.r < 0) { b.y = h() + b.r; b.x = Math.random() * w(); }
        if (b.x < -b.r) b.x = w() + b.r;
        if (b.x > w() + b.r) b.x = -b.r;

        // Draw soft gradient bubble
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0, `rgba(${baseColor}, ${b.opacity * 0.8})`);
        grad.addColorStop(0.5, `rgba(${baseColor}, ${b.opacity * 0.3})`);
        grad.addColorStop(1, `rgba(${baseColor}, 0)`);

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
};
