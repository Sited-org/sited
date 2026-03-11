import { useEffect, useState } from "react";

const ScarcityBar = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(90deg, #1a0a0a, #0A0A0A)" }}
    >
      <p
        className={`text-sm font-medium tracking-wide transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
        style={{ color: "#C9A84C", fontFamily: "'DM Sans', sans-serif" }}
      >
        <span className="inline-block animate-pulse">🔥</span>
        {"  "}Only <strong>19</strong> spots remaining out of 40 — This offer disappears when they're gone.
      </p>
      {/* shimmer overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.08) 50%, transparent 100%)",
            animation: "shimmer 3s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
};

export default ScarcityBar;
