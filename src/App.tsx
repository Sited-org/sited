import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Work from "./pages/Work";
import Contact from "./pages/Contact";
import WebsiteOnboarding from "./pages/WebsiteOnboarding";
import AppOnboarding from "./pages/AppOnboarding";
import AIOnboarding from "./pages/AIOnboarding";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLeads from "./pages/AdminLeads";
import LeadProfile from "./pages/LeadProfile";
import AdminActivity from "./pages/AdminActivity";
import AdminTeam from "./pages/AdminTeam";
import AdminSettings from "./pages/AdminSettings";
import AdminTestimonials from "./pages/AdminTestimonials";
import NewSale from "./pages/NewSale";
import AdminLayout from "./components/admin/AdminLayout";
import ClientPortalLogin from "./pages/ClientPortalLogin";
import ClientPortalDashboard from "./pages/ClientPortalDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<Services />} />
          <Route path="/work" element={<Work />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/onboarding/website" element={<WebsiteOnboarding />} />
          <Route path="/onboarding/app" element={<AppOnboarding />} />
          <Route path="/onboarding/ai" element={<AIOnboarding />} />
          {/* Client Portal Routes */}
          <Route path="/client-portal" element={<ClientPortalLogin />} />
          <Route path="/client-portal/dashboard" element={<ClientPortalDashboard />} />
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="leads/:id" element={<LeadProfile />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="activity" element={<AdminActivity />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="new-sale" element={<NewSale />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
