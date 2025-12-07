import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { GlobalChatButton } from "@/components/GlobalChatButton";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export const Layout = ({ children, hideFooter = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
      <GlobalChatButton />
    </div>
  );
};