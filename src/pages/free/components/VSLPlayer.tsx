const VSLPlayer = () => (
  <section className="free-section flex justify-center px-4 pb-20">
    <div
      className="w-full max-w-[860px] rounded-2xl p-6 relative overflow-hidden transition-transform duration-300 hover:scale-[1.01]"
      style={{
        background: "#111111",
        border: "1px solid rgba(201,168,76,0.25)",
        boxShadow: "0 0 40px rgba(0,0,0,0.6)",
      }}
    >
      {/* blue glow behind */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(37,99,235,0.1) 0%, transparent 70%)",
        }}
      />

      <p className="relative text-center text-sm font-medium tracking-wide mb-4" style={{ color: "#C9A84C", fontFamily: "'DM Sans', sans-serif" }}>
        WATCH THIS FIRST — 3 minutes that could change your business
      </p>

      <div
        className="relative w-full rounded-xl flex items-center justify-center"
        style={{ aspectRatio: "16/9", background: "linear-gradient(135deg, #0D0D0D, #111118)" }}
      >
        {/* Play button */}
        <div className="flex flex-col items-center gap-4">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="35" stroke="rgba(201,168,76,0.4)" strokeWidth="2" />
            <polygon points="30,22 30,50 52,36" fill="#C9A84C" />
          </svg>
          <p className="text-sm" style={{ color: "#888888", fontFamily: "'DM Sans', sans-serif" }}>
            [ Your VSL video goes here — paste Vimeo or YouTube embed URL ]
          </p>
        </div>
      </div>

      <p className="relative text-center text-xs mt-4" style={{ color: "#888888", fontFamily: "'DM Sans', sans-serif" }}>
        No audio? Click the player and unmute. 🔊
      </p>
    </div>
  </section>
);

export default VSLPlayer;
