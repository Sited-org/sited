import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Scroll-triggered geometric decorations in blue & gold.
 * Wrap any page content with this to get floating shapes that
 * animate in as the user scrolls. Shapes are positioned with
 * pointer-events: none so they never block interaction.
 */
export const ScrollGeometrics = () => {
  const { scrollYProgress } = useScroll();

  // Parallax offsets for different shapes
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const rotate3 = useTransform(scrollYProgress, [0, 1], [15, 60]);

  const shapes = [
    // Blue ring — top-right area (near hero CTA)
    {
      style: { top: "18vh", right: "6%", width: 90, height: 90 },
      y: y1,
      rotate: rotate1,
      className:
        "rounded-full border-2 border-[hsl(var(--sited-blue)/0.25)]",
    },
    // Gold diamond — left side near proof / services
    {
      style: { top: "55vh", left: "4%", width: 48, height: 48 },
      y: y2,
      rotate: rotate2,
      className:
        "border-2 border-[hsl(var(--gold)/0.3)] rotate-45",
    },
    // Blue square — right side mid-page
    {
      style: { top: "110vh", right: "8%", width: 56, height: 56 },
      y: y3,
      rotate: rotate3,
      className:
        "rounded-lg border-2 border-[hsl(var(--sited-blue)/0.2)]",
    },
    // Gold circle — left lower
    {
      style: { top: "160vh", left: "6%", width: 36, height: 36 },
      y: y1,
      rotate: rotate1,
      className:
        "rounded-full bg-[hsl(var(--gold)/0.08)] border border-[hsl(var(--gold)/0.2)]",
    },
    // Blue triangle-ish (rotated square) — right lower
    {
      style: { top: "200vh", right: "5%", width: 44, height: 44 },
      y: y2,
      rotate: rotate2,
      className:
        "rotate-12 border-2 border-[hsl(var(--sited-blue)/0.15)] rounded-sm",
    },
    // Gold ring — left bottom
    {
      style: { top: "260vh", left: "8%", width: 64, height: 64 },
      y: y3,
      rotate: rotate3,
      className:
        "rounded-full border-2 border-[hsl(var(--gold)/0.2)]",
    },
    // Small blue dot — accent near CTA areas
    {
      style: { top: "85vh", right: "12%", width: 14, height: 14 },
      y: y1,
      rotate: rotate1,
      className:
        "rounded-full bg-[hsl(var(--sited-blue)/0.2)]",
    },
    // Small gold dot
    {
      style: { top: "140vh", left: "10%", width: 12, height: 12 },
      y: y2,
      rotate: rotate2,
      className:
        "rounded-full bg-[hsl(var(--gold)/0.15)]",
    },
    // Horizontal line accent — blue
    {
      style: { top: "75vh", left: "3%", width: 60, height: 2 },
      y: y3,
      rotate: undefined,
      className: "bg-[hsl(var(--sited-blue)/0.15)] rounded-full",
    },
    // Horizontal line accent — gold
    {
      style: { top: "180vh", right: "4%", width: 50, height: 2 },
      y: y1,
      rotate: undefined,
      className: "bg-[hsl(var(--gold)/0.15)] rounded-full",
    },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden>
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          style={{
            ...shape.style,
            position: "absolute",
            y: shape.y,
            rotate: shape.rotate,
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3 + i * 0.15, ease: "easeOut" }}
          className={shape.className}
        />
      ))}
    </div>
  );
};
