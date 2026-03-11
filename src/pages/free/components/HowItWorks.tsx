const steps = [
  { icon: "🏗️", title: "We Build It (Free)", desc: "Your full website is designed, built, and launched. You pay nothing." },
  { icon: "🚀", title: "You Go Live", desc: "Your site goes live. You start getting found. Customers start calling." },
  { icon: "🔄", title: "We Keep It Perfect — $120/month", desc: "Hosting. SEO. Unlimited edits & changes. We maintain, improve, and grow your site every single month." },
];

const included = [
  "Managed Hosting & SSL",
  "Ongoing Local SEO Optimisation",
  "UNLIMITED Design Changes & Content Updates",
  "Priority Support",
  "Monthly Performance Reports",
  "Continuous Upgrades",
];

const HowItWorks = () => (
  <section className="free-section px-4 py-20">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-center text-3xl md:text-5xl font-bold mb-14" style={{ fontFamily: "'Playfair Display', serif", color: "#F5F0E8" }}>
        After Your Free Build — Here's How It Works
      </h2>

      {/* Steps */}
      <div className="free-reveal flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-0 mb-14">
        {steps.map((s, i) => (
          <div key={s.title} className="flex-1 flex flex-col items-center text-center relative">
            {i > 0 && (
              <div className="hidden md:block absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 border-t-2 border-dashed" style={{ borderColor: "rgba(201,168,76,0.4)" }} />
            )}
            <div className="text-4xl mb-4">{s.icon}</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "#C9A84C", fontFamily: "'DM Sans', sans-serif" }}>{s.title}</h3>
            <p className="text-sm max-w-xs" style={{ color: "#888888", fontFamily: "'DM Sans', sans-serif" }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Included card */}
      <div
        className="free-reveal rounded-xl p-8"
        style={{ background: "#161616", border: "1px solid rgba(201,168,76,0.25)" }}
      >
        <h3 className="text-xl font-semibold mb-6 text-center" style={{ color: "#F5F0E8", fontFamily: "'DM Sans', sans-serif" }}>
          What's included in $120/month:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
          {included.map((item) => (
            <p key={item} className="text-sm" style={{ color: "#F5F0E8", fontFamily: "'DM Sans', sans-serif" }}>
              ✅ {item}
            </p>
          ))}
        </div>
        <p className="text-center text-xs mt-6" style={{ color: "#888888", fontFamily: "'DM Sans', sans-serif" }}>
          Cancel anytime. No contracts. No nasty surprises.
        </p>
      </div>
    </div>
  </section>
);

export default HowItWorks;
