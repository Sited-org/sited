import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogOut, CreditCard, Clock, Home, Globe, MessageSquarePlus, User, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PasswordSetupModal } from '@/components/client-portal/PasswordSetupModal';
import { ClientOverviewTab } from '@/components/client-portal/ClientOverviewTab';
import { MyWebsiteTab } from '@/components/client-portal/MyWebsiteTab';
import { MyRequestsTab } from '@/components/client-portal/MyRequestsTab';
import { ProgressTab } from '@/components/client-portal/ProgressTab';
import { PaymentsTab } from '@/components/client-portal/PaymentsTab';
import { ProfileTab } from '@/components/client-portal/ProfileTab';
import { MetricsTab } from '@/components/client-portal/MetricsTab';

interface ClientSession {
  lead: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    business_name?: string;
    project_type: string;
    status: string;
    form_data: any;
    created_at: string;
    website_url?: string;
    billing_address?: string;
  };
  token: string;
  email: string;
  isFirstLogin?: boolean;
  requiresPasswordSetup?: boolean;
}

interface SavedPaymentMethod {
  type: 'card' | 'au_becs_debit';
  card?: { brand: string; last4: string; exp_month: number; exp_year: number };
  au_becs_debit?: { bsb_number: string; last4: string };
}

interface Transaction {
  id: string;
  item: string;
  credit: number;
  debit: number;
  transaction_date: string;
  status: string;
  is_recurring: boolean;
  recurring_interval: string | null;
}

interface ProjectUpdate {
  id: string;
  content: string;
  created_at: string;
}

interface ClientRequest {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  completed_at: string | null;
  estimated_completion: string | null;
}

interface ProjectMilestone {
  id: string;
  category: 'design' | 'metrics';
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at: string | null;
}

export default function ClientPortalDashboard() {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [savedPaymentMethod, setSavedPaymentMethod] = useState<SavedPaymentMethod | null>(null);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const storedSession = sessionStorage.getItem('clientPortalSession');
    if (!storedSession) {
      navigate('/client-portal');
      return;
    }

    const parsedSession = JSON.parse(storedSession) as ClientSession;
    setSession(parsedSession);
    
    if (parsedSession.requiresPasswordSetup) {
      setShowPasswordSetup(true);
    }
    
    fetchClientData(parsedSession);
  }, [navigate]);

  const fetchClientData = async (clientSession: ClientSession) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-client-data', {
        body: { lead_id: clientSession.lead.id, email: clientSession.email },
      });

      if (error) throw error;

      setTransactions(data.transactions || []);
      setProjectUpdates(data.projectUpdates || []);
      setSavedPaymentMethod(data.savedPaymentMethod);
      setRequests(data.clientRequests || []);
      setMilestones(data.projectMilestones || []);
    } catch (err) {
      console.error('Error fetching client data:', err);
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('clientPortalSession');
    navigate('/client-portal');
  };

  const handleNavigate = (tab: string) => setActiveTab(tab);

  const handleRequestCreated = () => {
    if (session) fetchClientData(session);
  };

  const designMilestones = milestones.filter(m => m.category === 'design');
  const metricsMilestones = milestones.filter(m => m.category === 'metrics');
  const designProgress = designMilestones.length > 0 
    ? Math.round((designMilestones.filter(m => m.status === 'completed').length / designMilestones.length) * 100) 
    : 0;
  const metricsProgress = metricsMilestones.length > 0 
    ? Math.round((metricsMilestones.filter(m => m.status === 'completed').length / metricsMilestones.length) * 100) 
    : 0;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <PasswordSetupModal
        open={showPasswordSetup}
        onComplete={() => setShowPasswordSetup(false)}
        leadId={session.lead.id}
        email={session.email}
      />

      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Client Portal</h1>
              <p className="text-sm text-muted-foreground">
                {session.lead.name || session.lead.business_name || session.lead.email}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-flex">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">My Website</span>
              </TabsTrigger>
              <TabsTrigger value="metrics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Metrics</span>
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                <span className="hidden sm:inline">Requests</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Progress</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <ClientOverviewTab
                lead={session.lead}
                transactions={transactions}
                projectUpdates={projectUpdates}
                requests={requests}
                hasPaymentMethod={!!savedPaymentMethod}
                designProgress={designProgress}
                metricsProgress={metricsProgress}
                onNavigate={handleNavigate}
              />
            </TabsContent>

            <TabsContent value="website">
              <MyWebsiteTab lead={session.lead} />
            </TabsContent>

            <TabsContent value="metrics">
              <MetricsTab lead={session.lead} />
            </TabsContent>

            <TabsContent value="requests">
              <MyRequestsTab
                leadId={session.lead.id}
                leadName={session.lead.name}
                leadEmail={session.lead.email}
                requests={requests}
                onRequestCreated={handleRequestCreated}
              />
            </TabsContent>

            <TabsContent value="progress">
              <ProgressTab
                lead={session.lead}
                projectUpdates={projectUpdates}
                designMilestones={designMilestones}
                metricsMilestones={metricsMilestones}
                designProgress={designProgress}
                metricsProgress={metricsProgress}
              />
            </TabsContent>

            <TabsContent value="payments">
              <PaymentsTab
                lead={session.lead}
                email={session.email}
                transactions={transactions}
                savedPaymentMethod={savedPaymentMethod}
                onPaymentMethodSaved={(pm) => setSavedPaymentMethod(pm)}
              />
            </TabsContent>

            <TabsContent value="profile">
              <ProfileTab lead={session.lead} hasPaymentMethod={!!savedPaymentMethod} />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <footer className="border-t mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Need help? Contact our support team.</p>
        </div>
      </footer>
    </div>
  );
}
