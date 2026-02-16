import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border">
      {/* CTA Section */}
      <div className="container-tight py-16 sm:py-20 text-center">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          Your site should work as hard as you do.
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          New build or existing site — the next step is a free 20-minute call. No obligation, no jargon.
        </p>
        <Button variant="hero" size="lg" asChild>
          <Link to="/contact" className="gap-2">
            Book Your Free Consultation
            <ArrowRight size={18} />
          </Link>
        </Button>
      </div>

      {/* Brand Statement */}
      <div className="border-t border-border">
        <div className="container-tight py-10 text-center">
          <p className="text-lg font-semibold tracking-tight mb-3">
            Built Fast. Monitored Always. Improved Every Month.
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Websites, CRMs, portals, and dashboards — built fast, kept running through our monthly Care Plan.
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container-tight py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link to="/" className="text-xl font-semibold tracking-tight">
              Sited.
            </Link>
            <div className="flex items-center gap-6">
              {[
                { label: "What We Build", href: "/services" },
                { label: "How It Works", href: "/about" },
                { label: "Pricing", href: "/pricing" },
                { label: "Book a Call", href: "/contact" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              © {currentYear} Sited
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
