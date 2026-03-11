import { useState, forwardRef } from "react";

const SignUpForm = forwardRef<HTMLDivElement>((_, ref) => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: "", businessName: "", website: "", phone: "", email: "", description: "", source: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to Supabase leads table
    setSubmitted(true);
  };

  const inputStyle: React.CSSProperties = {
    background: "#111111",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "#F5F0E8",
    fontFamily: "'DM Sans', sans-serif",
    minHeight: 48,
  };

  if (submitted) {
    return (
      <section ref={ref} className="free-section px-4 py-20">
        <div
          className="max-w-xl mx-auto rounded-xl p-10 text-center free-confetti"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(201,168,76,0.3)" }}
        >
          <p className="text-4xl mb-4">✅</p>
          <h3 className="text-2xl font-bold mb-3" style={{ color: "#F5F0E8", fontFamily: "'Playfair Display', serif" }}>
            You're in!
          </h3>
          <p className="text-base" style={{ color: "#F5F0E8", fontFamily: "'DM Sans', sans-serif", opacity: 0.8 }}>
            We'll be in touch within 24 hours to confirm your spot.
            <br />
            Keep an eye on your inbox — exciting things are coming.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="free-section px-4 py-20">
      <div className="max-w-xl mx-auto">
        <h2 className="text-center text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#C9A84C" }}>
          Claim Your Free Website
        </h2>
        <p className="text-center text-base mb-10" style={{ color: "#F5F0E8", opacity: 0.7, fontFamily: "'DM Sans', sans-serif" }}>
          Fill in your details below. We'll review your business and confirm your spot within 24 hours.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input name="fullName" required placeholder="Full Name *" value={form.fullName} onChange={handleChange} className="rounded-lg px-4 py-3 text-sm focus:outline-none free-input-focus" style={inputStyle} />
          <input name="businessName" required placeholder="Business Name *" value={form.businessName} onChange={handleChange} className="rounded-lg px-4 py-3 text-sm focus:outline-none free-input-focus" style={inputStyle} />
          <input name="website" placeholder="Business Website (if you have one)" value={form.website} onChange={handleChange} className="rounded-lg px-4 py-3 text-sm focus:outline-none free-input-focus" style={inputStyle} />
          <input name="phone" required type="tel" placeholder="Phone Number *" value={form.phone} onChange={handleChange} className="rounded-lg px-4 py-3 text-sm focus:outline-none free-input-focus" style={inputStyle} />
          <input name="email" required type="email" placeholder="Email Address *" value={form.email} onChange={handleChange} className="rounded-lg px-4 py-3 text-sm focus:outline-none free-input-focus" style={inputStyle} />
          <textarea name="description" required placeholder="What does your business do? *" rows={3} value={form.description} onChange={handleChange} className="rounded-lg px-4 py-3 text-sm focus:outline-none free-input-focus resize-none" style={inputStyle} />
          <select name="source" value={form.source} onChange={handleChange} className="rounded-lg px-4 py-3 text-sm focus:outline-none free-input-focus" style={inputStyle}>
            <option value="">How did you hear about Sited?</option>
            <option>Social Media</option>
            <option>Google</option>
            <option>Referral</option>
            <option>Ad</option>
            <option>Other</option>
          </select>

          <button type="submit" className="free-cta-btn w-full text-lg py-4 rounded-lg font-semibold mt-2">
            Yes — I Want My Free Website 🚀
          </button>
        </form>

        <p className="text-center text-xs mt-5" style={{ color: "#888888", fontFamily: "'DM Sans', sans-serif" }}>
          🔒 Your information is 100% secure. We don't spam. We don't sell data. We just build websites.
        </p>
        <p className="text-center text-xs mt-2" style={{ color: "#C9A84C", fontFamily: "'DM Sans', sans-serif" }}>
          ⚡ 19 spots remaining. Once they're gone, this offer is gone too.
        </p>
      </div>
    </section>
  );
});

SignUpForm.displayName = "SignUpForm";
export default SignUpForm;
