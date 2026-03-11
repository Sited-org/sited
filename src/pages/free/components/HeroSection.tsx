const HeroSection = ({ onCTAClick }: { onCTAClick: () => void }) => {
  return (
    <section className="free-section flex flex-col items-center text-center px-4 pt-28 pb-16 md:pt-36 md:pb-24">
      <p
        className="free-fade-up text-lg tracking-widest uppercase mb-6"
        style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif", animationDelay: "0s" }}
      >
        SITED
      </p>

      <h1
        className="free-fade-up text-4xl md:text-6xl lg:text-7xl font-bold italic leading-tight mb-6"
        style={{ fontFamily: "'Playfair Display', serif", color: "#F5F0E8", animationDelay: "0.2s" }}
      >
        We'll Build Your Entire Website.
        <br />
        <span style={{ color: "#C9A84C" }}>For Free.</span>
      </h1>

      <p
        className="free-fade-up max-w-2xl text-lg md:text-xl mb-8"
        style={{ color: "#F5F0E8", opacity: 0.8, fontFamily: "'DM Sans', sans-serif", animationDelay: "0.4s" }}
      >
        7 pages + 3 Local SEO pages. Fully custom. Done in 7 days or less.
        <br />
        No catch. No tricks. Just results — and yes, we're serious.
      </p>

      <div
        className="free-fade-up flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm mb-10"
        style={{ color: "#C9A84C", fontFamily: "'DM Sans', sans-serif", animationDelay: "0.6s" }}
      >
        {["7-Day Delivery", "10 Pages Total", "100% Custom Design", "Local SEO Included", "Zero Upfront Cost"].map((t) => (
          <span key={t}>✦ {t}</span>
        ))}
      </div>

      <button
        onClick={onCTAClick}
        className="free-fade-up free-cta-btn text-lg px-10 py-4 rounded-lg font-semibold"
        style={{ animationDelay: "0.8s", animationFillMode: "both" }}
      >
        Claim Your Free Website →
      </button>
    </section>
  );
};

export default HeroSection;
