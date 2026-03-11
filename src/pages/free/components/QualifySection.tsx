const cards = [
  {
    title: "You're a brand new Sited client",
    desc: "Never worked with us before? Perfect. This offer is specifically for first-timers. (If you're an existing client — we still love you, just not this much.)",
  },
  {
    title: "You have an active business",
    desc: "A real business. Running. Trading. You serve customers. That's it. No side hustles from your mum's garage… unless you're actually making money from it.",
  },
  {
    title: "You love FREE stuff",
    desc: "We mean, come on. If you saw \"free website\" and kept scrolling, we're genuinely worried about you. This is the part where normal people click the button.",
  },
];

const QualifySection = () => (
  <section className="free-section px-4 py-20">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-center text-3xl md:text-5xl font-bold italic mb-12" style={{ fontFamily: "'Playfair Display', serif", color: "#F5F0E8" }}>
        Is This You?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {cards.map((c) => (
          <div
            key={c.title}
            className="free-reveal rounded-xl p-6"
            style={{ background: "#161616", border: "1px solid rgba(201,168,76,0.15)" }}
          >
            <p className="text-lg font-semibold mb-3" style={{ color: "#C9A84C", fontFamily: "'DM Sans', sans-serif" }}>
              ✅ {c.title}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#888888", fontFamily: "'DM Sans', sans-serif" }}>{c.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-sm max-w-3xl mx-auto" style={{ color: "#888888", fontFamily: "'DM Sans', sans-serif" }}>
        ⚠️ Warning: This offer may cause an irrational urge to tell every business owner you know about it. Side effects include: more leads, better branding, and finally having a website you're proud of.
      </p>
    </div>
  </section>
);

export default QualifySection;
