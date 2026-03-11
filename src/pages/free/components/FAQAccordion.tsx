import { useState } from "react";

const faqs = [
  { q: "Is this actually free? What's the catch?", a: "Yes, it's actually free. The website build costs you nothing. The $120/month covers hosting, ongoing SEO, and unlimited maintenance after launch. Think of it like getting a car for free — you still pay for fuel and servicing. Except this car gets you customers." },
  { q: "Why are you doing this for free?", a: "Simple. We want 40 clients who we can demonstrate real results for. You get an incredible website with zero risk. We get a growing portfolio and a client relationship. Everyone wins. That's the whole plan." },
  { q: "What if I already have a website?", a: "We rebuild it. If you've never worked with Sited before, you qualify — even if you have an existing site. We'll build something better." },
  { q: "What happens after 40 clients?", a: "This offer closes. Permanently. We're not being dramatic — there are genuinely only 40 spots. When they're gone, the price goes back to normal." },
  { q: "Can I cancel the $120/month whenever I want?", a: "Yes. No contracts, no lock-ins, no awkward phone calls. Cancel anytime. Your website stays live for the billing period you've already paid." },
  { q: "How long does the build actually take?", a: "7 days or less from the moment we receive your assets and brief. Most builds are delivered in 5 days." },
];

const FAQAccordion = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="free-section px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center text-3xl md:text-5xl font-bold mb-12" style={{ fontFamily: "'Playfair Display', serif", color: "#F5F0E8" }}>
          Questions? We've Got You.
        </h2>

        <div className="flex flex-col gap-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <span className="text-base font-medium" style={{ color: "#F5F0E8" }}>{f.q}</span>
                <span
                  className="text-lg transition-transform duration-300"
                  style={{ color: "#C9A84C", transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  ▾
                </span>
              </button>
              <div
                className="transition-all duration-300 overflow-hidden"
                style={{ maxHeight: open === i ? 300 : 0, opacity: open === i ? 1 : 0 }}
              >
                <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "#888888", fontFamily: "'DM Sans', sans-serif" }}>
                  {f.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQAccordion;
