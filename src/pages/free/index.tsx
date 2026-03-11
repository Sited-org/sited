import { useEffect, useRef } from "react";
import ScarcityBar from "./components/ScarcityBar";
import HeroSection from "./components/HeroSection";
import VSLPlayer from "./components/VSLPlayer";
import FeatureGrid from "./components/FeatureGrid";
import HowItWorks from "./components/HowItWorks";
import QualifySection from "./components/QualifySection";
import SignUpForm from "./components/SignUpForm";
import FAQAccordion from "./components/FAQAccordion";
import FooterCTA from "./components/FooterCTA";

const FreeLandingPage = () => {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll-triggered reveal
  useEffect(() => {
    document.title = "Free Website Build — Sited | 7 Pages + 3 Local SEO Pages, No Cost";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Sited is building fully custom websites for free — 7 pages + 3 Local SEO pages, delivered in 7 days. Only 40 spots. 21 taken. Claim yours now.");

    // noindex for campaign page
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex, nofollow");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("free-revealed");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll(".free-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Scoped styles – no global impact */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@400;500;600&display=swap');

        .free-page {
          background: #0A0A0A;
          color: #F5F0E8;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          scroll-behavior: smooth;
          position: relative;
        }
        .free-page::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 256px;
          z-index: 0;
        }

        .free-section {
          position: relative;
          z-index: 1;
        }
        .free-section + .free-section {
          border-top: 1px solid rgba(201,168,76,0.15);
        }

        .free-cta-btn {
          background: #2563EB;
          color: #fff;
          cursor: pointer;
          border: none;
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .free-cta-btn:hover {
          box-shadow: 0 0 24px rgba(37,99,235,0.5);
          transform: translateY(-1px);
        }

        .free-input-focus:focus {
          border-color: rgba(201,168,76,0.6) !important;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.25);
        }

        /* Fade up on load */
        .free-fade-up {
          opacity: 0;
          transform: translateY(20px);
          animation: freeFadeUp 0.7s ease forwards;
        }
        @keyframes freeFadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        /* Scroll reveal */
        .free-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .free-revealed {
          opacity: 1;
          transform: translateY(0);
        }

        /* Shimmer for scarcity bar */
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Confetti burst */
        .free-confetti {
          animation: confettiBurst 0.6s ease;
        }
        @keyframes confettiBurst {
          0% { transform: scale(0.9); opacity: 0; }
          60% { transform: scale(1.03); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="free-page">
        <ScarcityBar />
        <HeroSection onCTAClick={scrollToForm} />
        <VSLPlayer />
        <FeatureGrid />
        <HowItWorks />
        <QualifySection />
        <SignUpForm ref={formRef} />
        <FAQAccordion />
        <FooterCTA onCTAClick={scrollToForm} />
      </div>
    </>
  );
};

export default FreeLandingPage;
