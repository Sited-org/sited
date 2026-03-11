const FooterCTA = ({ onCTAClick }: { onCTAClick: () => void }) => (
  <section className="px-4 py-20" style={{ background: "#0D0D0D", borderTop: "1px solid rgba(201,168,76,0.3)" }}>
    <div className="max-w-3xl mx-auto text-center">
      <p className="text-6xl md:text-8xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#C9A84C" }}>
        19 / 40
      </p>
      <p className="text-sm uppercase tracking-widest mb-10" style={{ color: "#888888", fontFamily: "'DM Sans', sans-serif" }}>
        Spots Claimed
      </p>

      <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#F5F0E8" }}>
        Don't let someone else take your spot.
      </h2>
      <p className="text-base mb-10 max-w-xl mx-auto" style={{ color: "#888888", fontFamily: "'DM Sans', sans-serif" }}>
        This is a limited offer — not a countdown timer trick, not manufactured urgency.
        There are genuinely 40 spots. 21 are taken. When the last one goes, this page comes down.
      </p>

      <button onClick={onCTAClick} className="free-cta-btn w-full md:w-auto text-lg px-10 py-4 rounded-lg font-semibold">
        Claim My Free Website Before It's Gone →
      </button>
    </div>

    <p className="text-center text-xs mt-16" style={{ color: "#555", fontFamily: "'DM Sans', sans-serif" }}>
      © 2025 Sited. All rights reserved. | hello@sited.co
    </p>
  </section>
);

export default FooterCTA;
