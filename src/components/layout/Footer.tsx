import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border">
      {/* CTA Section */}
      <div className="container-tight py-16 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          Ready to build your website?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Tell us about your project and we'll bring your vision to life.
        </p>
        <Button variant="hero" size="lg" asChild>
          <Link to="/onboarding/website" className="gap-2">
            Start Your Project
            <ArrowRight size={18} />
          </Link>
        </Button>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container-tight py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link to="/" className="text-xl font-semibold tracking-tight">
              Sited.
            </Link>
            <div className="flex items-center gap-6">
              {["Services", "Work", "Contact"].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
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
