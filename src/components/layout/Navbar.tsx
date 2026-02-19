import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
  { name: "Our Work", href: "/work" },
  { name: "Contact", href: "/contact" },
  { name: "Blog", href: "/blog" },
];

const domains = ["au", "co"];

const AnimatedLogo = () => {
  const [domainIndex, setDomainIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setDomainIndex((prev) => (prev + 1) % domains.length);
        setIsAnimating(false);
      }, 200);
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
          className="text-muted-foreground"
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

          <div className="hidden md:block">
            <Button variant="hero" size="sm" onClick={() => setCtaOpen(true)}>
              Get a Quote
            </Button>
            <LeadCaptureDialog open={ctaOpen} onOpenChange={setCtaOpen} />
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
