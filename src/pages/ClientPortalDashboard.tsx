import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogOut, CreditCard, FileText, Clock, Home, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ClientPaymentMethodTab } from '@/components/client-portal/ClientPaymentMethodTab';
import { ClientTransactionsTab } from '@/components/client-portal/ClientTransactionsTab';
import { ClientProjectTab } from '@/components/client-portal/ClientProjectTab';
import { ClientOverviewTab } from '@/components/client-portal/ClientOverviewTab';
import { PasswordSetupModal } from '@/components/client-portal/PasswordSetupModal';

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
  };
  token: string;
  email: string;
  isFirstLogin?: boolean;
  requiresPasswordSetup?: boolean;
}

interface SavedPaymentMethod {
  type: 'card' | 'au_becs_debit';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  au_becs_debit?: {
    bsb_number: string;
    last4: string;
  };
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

export default function ClientPortalDashboard() {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
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
    
    // Check if first login and needs password setup
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

  const handlePasswordSetupComplete = () => {
    setShowPasswordSetup(false);
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Password Setup Modal */}
      <PasswordSetupModal
        open={showPasswordSetup}
        onComplete={handlePasswordSetupComplete}
        leadId={session.lead.id}
        email={session.email}
      />

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Client Portal</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {session.lead.name || session.lead.business_name || session.lead.email}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Progress</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <ClientOverviewTab
                lead={session.lead}
                transactions={transactions}
                projectUpdates={projectUpdates}
                hasPaymentMethod={!!savedPaymentMethod}
                onNavigate={handleNavigate}
              />
            </TabsContent>

            <TabsContent value="progress">
              <ClientProjectTab
                lead={session.lead}
                projectUpdates={projectUpdates}
              />
            </TabsContent>

            <TabsContent value="payments">
              <ClientPaymentMethodTab
                lead={session.lead}
                email={session.email}
                savedPaymentMethod={savedPaymentMethod}
                onPaymentMethodSaved={(pm) => setSavedPaymentMethod(pm)}
              />
            </TabsContent>

            <TabsContent value="history">
              <ClientTransactionsTab
                transactions={transactions}
                leadName={session.lead.name || session.lead.business_name || 'Client'}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Need help? Contact our support team.</p>
        </div>
      </footer>
    </div>
  );
}
