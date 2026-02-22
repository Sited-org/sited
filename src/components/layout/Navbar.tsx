import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import BookingDialog from "@/components/booking/BookingDialog";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
  { name: "Custom Websites", href: "/custom-websites" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

const domains = ["au", "co"];
const domainColors = ["text-[hsl(var(--sited-blue))]", "text-[hsl(var(--gold))]"];

const AnimatedLogo = () => {
  const [domainIndex, setDomainIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDomainIndex((prev) => (prev + 1) % domains.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.span
      className="text-2xl font-semibold tracking-tight inline-flex"
      whileHover={{ scale: 1.02 }}
    >
      Sited.
      <AnimatePresence mode="wait">
        <motion.span
          key={domains[domainIndex]}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={cn("font-semibold", domainColors[domainIndex])}
        >
          {domains[domainIndex]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
};

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [ctaOpen, setCtaOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "glass border-b border-border/50 py-4"
            : "bg-transparent py-6"
        )}
      >
        <nav className="container-tight flex items-center justify-between">
          <Link to="/" className="relative z-10">
            <AnimatedLogo />
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors duration-300 relative",
                    location.pathname === link.href
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.name}
                  {location.pathname === link.href && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-foreground rounded-full"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-[hsl(var(--sited-blue))] text-[hsl(var(--sited-blue))] hover:bg-[hsl(var(--sited-blue))] hover:text-white" onClick={() => setBookOpen(true)}>
              <CalendarCheck size={14} />
              Book
            </Button>
            <Button variant="hero" size="sm" onClick={() => setCtaOpen(true)}>
              Get a Quote
            </Button>
            <LeadCaptureDialog open={ctaOpen} onOpenChange={setCtaOpen} />
            <BookingDialog open={bookOpen} onOpenChange={setBookOpen} />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden relative z-10 p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile CTA Strip — below header, mobile only */}
        <div className="md:hidden flex flex-col w-full border-t border-border/30">
          <button
            onClick={() => setCtaOpen(true)}
            className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[hsl(var(--sited-blue))]/60 backdrop-blur-xl transition-colors hover:bg-[hsl(var(--sited-blue))]/80"
          >
            Get a Quote
          </button>
          <a
            href="tel:0459909810"
            className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[hsl(var(--gold))]/60 backdrop-blur-xl text-center transition-colors hover:bg-[hsl(var(--gold))]/80 border-t border-white/10"
          >
            Call Now 0459 909 810
          </a>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background"
          >
            <motion.nav
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex flex-col items-center justify-center h-full gap-8"
            >
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    to={link.href}
                    className={cn(
                      "text-3xl font-medium transition-colors",
                      location.pathname === link.href
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button variant="hero" size="lg" onClick={() => { setIsMobileMenuOpen(false); setCtaOpen(true); }}>
                  Get a Quote
                </Button>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
