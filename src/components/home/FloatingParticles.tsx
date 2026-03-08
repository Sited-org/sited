import { useEffect, useRef } from "react";

interface Bubble {
  x: number;
  y: number;
  r: number;
  baseR: number;
  speedX: number;
  speedY: number;
  opacity: number;
  phase: number;
  phaseSpeed: number;
  wobble: number;
  wobbleSpeed: number;
}

/**
 * Realistic floating soap bubbles — semi-transparent with rainbow sheen,
 * gentle drift upward, subtle wobble. Works on both light & dark themes.
 */
export const FloatingParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Fewer particles on mobile for performance
    const isMobile = window.innerWidth < 768;
    if (isMobile) return; // Skip entirely on mobile — saves significant CPU

    let animId: number;
    const bubbles: Bubble[] = [];
    const COUNT = 10;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    for (let i = 0; i < COUNT; i++) {
      const baseR = 18 + Math.random() * 45;
      bubbles.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        r: baseR,
        baseR,
        speedX: (Math.random() - 0.5) * 0.12,
        speedY: -0.04 - Math.random() * 0.08,
        opacity: 0.06 + Math.random() * 0.08,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.004 + Math.random() * 0.004,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.015,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      const isDark = document.documentElement.classList.contains("dark");

      for (const b of bubbles) {
        b.x += b.speedX + Math.sin(b.wobble) * 0.15;
        b.y += b.speedY;
        b.phase += b.phaseSpeed;
        b.wobble += b.wobbleSpeed;
        b.r = b.baseR + Math.sin(b.phase) * (b.baseR * 0.08);

        // Wrap
        if (b.y + b.r < -10) { b.y = h() + b.r + 10; b.x = Math.random() * w(); }
        if (b.x < -b.r - 10) b.x = w() + b.r;
        if (b.x > w() + b.r + 10) b.x = -b.r;

        // Soap bubble: thin ring with rainbow-ish sheen
        const x = b.x;
        const y = b.y;
        const r = b.r;

        // Outer soft glow
        const glow = ctx.createRadialGradient(x, y, r * 0.85, x, y, r * 1.1);
        glow.addColorStop(0, `rgba(${isDark ? "180,210,255" : "100,160,220"}, 0)`);
        glow.addColorStop(0.7, `rgba(${isDark ? "180,210,255" : "100,160,220"}, ${b.opacity * 0.4})`);
        glow.addColorStop(1, `rgba(${isDark ? "180,210,255" : "100,160,220"}, 0)`);
        ctx.beginPath();
        ctx.arc(x, y, r * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Bubble body — very faint fill
        const body = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        body.addColorStop(0, `rgba(255,255,255, ${isDark ? 0.04 : 0.06})`);
        body.addColorStop(0.6, `rgba(${isDark ? "160,200,255" : "180,210,240"}, ${b.opacity * 0.25})`);
        body.addColorStop(1, `rgba(${isDark ? "120,170,255" : "140,180,220"}, ${b.opacity * 0.15})`);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = body;
        ctx.fill();

        // Thin ring edge
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${isDark ? "200,220,255" : "150,180,210"}, ${b.opacity * 0.6})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Highlight / light reflection (top-left)
        ctx.beginPath();
        ctx.ellipse(x - r * 0.25, y - r * 0.3, r * 0.18, r * 0.1, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255, ${isDark ? 0.12 : 0.2})`;
        ctx.fill();

        // Small secondary highlight
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.45, r * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255, ${isDark ? 0.08 : 0.15})`;
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
