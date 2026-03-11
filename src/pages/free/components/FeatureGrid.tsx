const features = [
  { icon: "🎨", title: "Full Custom Design", desc: "Not a template. Not a theme. A website built specifically for your brand, your market, and your customers." },
  { icon: "📄", title: "7 Core Pages", desc: "Home, About, Services, Contact, and more — everything your business actually needs to look credible and convert." },
  { icon: "📍", title: "3 Local SEO Pages", desc: "Geo-targeted pages engineered to rank in your area. Your competitors don't have these. You will." },
  { icon: "⚡", title: "7-Day Delivery", desc: "From brief to live in 7 days or less. Not weeks. Not \"we'll get back to you.\" Seven. Days." },
  { icon: "📱", title: "Mobile-First & Responsive", desc: "Built to look and perform perfectly on every screen — from iPhone to desktop." },
  { icon: "🔒", title: "Credentials & Access Vault", desc: "We handle your logins, DNS, hosting setup — everything. You just run your business." },
];

const FeatureGrid = () => (
  <section className="free-section px-4 py-20">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-center text-3xl md:text-5xl font-bold italic mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#C9A84C" }}>
        Everything Included. Nothing Held Back.
      </h2>
      <p className="text-center text-lg mb-12" style={{ color: "#F5F0E8", opacity: 0.7, fontFamily: "'DM Sans', sans-serif" }}>
        Here's exactly what you're getting — completely free on day one.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {features.map((f) => (
          <div
            key={f.title}
            className="free-reveal rounded-xl p-6"
            style={{ background: "#161616", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 0 40px rgba(0,0,0,0.6)" }}
          >
            <p className="text-2xl mb-2">{f.icon}</p>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "#F5F0E8", fontFamily: "'DM Sans', sans-serif" }}>{f.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#888888", fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Value callout */}
      <div
        className="free-reveal rounded-xl p-8 text-center"
        style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 0 40px rgba(0,0,0,0.6)" }}
      >
        <p className="text-lg mb-2" style={{ color: "#F5F0E8", fontFamily: "'DM Sans', sans-serif" }}>💡 Total value of everything above:</p>
        <p className="text-2xl line-through mb-1" style={{ color: "#888888", fontFamily: "'DM Sans', sans-serif" }}>£2,400+</p>
        <p className="text-5xl font-bold" style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}>£0</p>
      </div>
    </div>
  </section>
);

export default FeatureGrid;
