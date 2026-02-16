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
          Your site should be working as hard as you are.
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Whether you need a new website built or you want to put an existing site on a Sited Care Plan, the next step is a free 20-minute conversation. We will tell you exactly what we can do and what it will cost — no obligation, no jargon.
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
            Sited builds professional websites, CRMs, portals, and dashboards for growing businesses — and then keeps them running through our monthly Care Plan. Your digital presence, looked after properly.
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
