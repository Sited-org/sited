import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Eagerly load critical above-the-fold page
import Index from "./pages/Index";

// Lazy load all other pages for code splitting
const Features = lazy(() => import("./pages/Features"));
const CustomWebsites = lazy(() => import("./pages/CustomWebsites"));
const Work = lazy(() => import("./pages/Work"));
const Contact = lazy(() => import("./pages/Contact"));
const ContactOffers = lazy(() => import("./pages/ContactOffers"));
// About page removed - content merged into Work page
// Pricing page removed
// WebsiteOnboarding removed — all CTAs now use popup lead capture
// AppOnboarding removed - service no longer offered
// AI Onboarding removed - service no longer offered
const Offer = lazy(() => import("./pages/Offer"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Policies = lazy(() => import("./pages/Policies"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const LeadProfile = lazy(() => import("./pages/LeadProfile"));
const AdminTeam = lazy(() => import("./pages/AdminTeam"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminTestimonials = lazy(() => import("./pages/AdminTestimonials"));
const AdminRequests = lazy(() => import("./pages/AdminRequests"));
const AdminFinancial = lazy(() => import("./pages/AdminFinancial"));
const AdminCalendar = lazy(() => import("./pages/AdminCalendar"));
const AdminAnalysisAI = lazy(() => import("./pages/AdminAnalysisAI"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const ClientPortalLogin = lazy(() => import("./pages/ClientPortalLogin"));
const ClientPortalDashboard = lazy(() => import("./pages/ClientPortalDashboard"));
const DevLayout = lazy(() => import("./components/dev/DevLayout"));
const DevDashboard = lazy(() => import("./components/dev/DevDashboard"));
const DevProjects = lazy(() => import("./components/dev/DevProjects"));
const DevRequests = lazy(() => import("./components/dev/DevRequests"));
const DevProjectView = lazy(() => import("./components/dev/DevProjectView"));
const FreeLandingPage = lazy(() => import("./pages/free/index"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — avoid redundant refetches
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

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
            <Route path="/features" element={<Features />} />
            <Route path="/custom-websites" element={<CustomWebsites />} />
            <Route path="/portfolio" element={<Work />} />
            <Route path="/work" element={<Work />} /> {/* Redirect compatibility */}
            <Route path="/contact" element={<Contact />} />
            <Route path="/contact/offers" element={<ContactOffers />} />
            <Route path="/offer" element={<Offer />} />
            {/* About route removed - content merged into Work page */}
            {/* Pricing route removed */}
            {/* /onboarding/website removed — popup CTA replaces it */}
            <Route path="/policies" element={<Policies />} />
            <Route path="/free" element={<FreeLandingPage />} />
            <Route path="/go" element={<LandingPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            {/* App Onboarding route removed - service no longer offered */}
            {/* AI Onboarding route removed - service no longer offered */}
            {/* Client Portal Routes */}
            <Route path="/client-portal" element={<ClientPortalLogin />} />
            <Route path="/client-portal/dashboard" element={<ClientPortalDashboard />} />
            {/* Developer Portal Routes */}
            <Route path="/dev" element={<DevLayout />}>
              <Route index element={<DevDashboard />} />
              <Route path="projects" element={<DevProjects />} />
              <Route path="requests" element={<DevRequests />} />
              <Route path="project/:id" element={<DevProjectView />} />
            </Route>
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="leads/:id" element={<LeadProfile />} />
              <Route path="requests" element={<AdminRequests />} />
              <Route path="calendar" element={<AdminCalendar />} />
              <Route path="analysis-ai" element={<AdminAnalysisAI />} />
              <Route path="financial" element={<AdminFinancial />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="blog" element={<AdminBlog />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
