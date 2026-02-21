import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ThemeToggleFloat } from "@/components/common/ThemeToggleFloat";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export const Layout = ({ children, hideFooter = false }: LayoutProps) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <ThemeToggleFloat />
      <Navbar />
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
};
