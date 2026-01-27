import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Eagerly load critical above-the-fold page
import Index from "./pages/Index";

// Lazy load all other pages for code splitting
const Services = lazy(() => import("./pages/Services"));
const Work = lazy(() => import("./pages/Work"));
const Contact = lazy(() => import("./pages/Contact"));
const WebsiteOnboarding = lazy(() => import("./pages/WebsiteOnboarding"));
// AppOnboarding removed - service no longer offered
// AI Onboarding removed - service no longer offered
const NotFound = lazy(() => import("./pages/NotFound"));
const Policies = lazy(() => import("./pages/Policies"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const LeadProfile = lazy(() => import("./pages/LeadProfile"));
const AdminTeam = lazy(() => import("./pages/AdminTeam"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminTestimonials = lazy(() => import("./pages/AdminTestimonials"));
const NewSale = lazy(() => import("./pages/NewSale"));
const AdminRequests = lazy(() => import("./pages/AdminRequests"));
const AdminFinancial = lazy(() => import("./pages/AdminFinancial"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const ClientPortalLogin = lazy(() => import("./pages/ClientPortalLogin"));
const ClientPortalDashboard = lazy(() => import("./pages/ClientPortalDashboard"));

const queryClient = new QueryClient();

// Minimal loading fallback to prevent layout shift
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/work" element={<Work />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/onboarding/website" element={<WebsiteOnboarding />} />
            <Route path="/policies" element={<Policies />} />
            {/* App Onboarding route removed - service no longer offered */}
            {/* AI Onboarding route removed - service no longer offered */}
            {/* Client Portal Routes */}
            <Route path="/client-portal" element={<ClientPortalLogin />} />
            <Route path="/client-portal/dashboard" element={<ClientPortalDashboard />} />
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="leads/:id" element={<LeadProfile />} />
              <Route path="requests" element={<AdminRequests />} />
              <Route path="financial" element={<AdminFinancial />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="new-sale" element={<NewSale />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
