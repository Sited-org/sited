import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogOut, Home, MessageSquarePlus, CreditCard, User, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ClientOverviewTab } from '@/components/client-portal/ClientOverviewTab';
import { MyRequestsTab } from '@/components/client-portal/MyRequestsTab';
import { PaymentsTab } from '@/components/client-portal/PaymentsTab';
import { ProfileTab } from '@/components/client-portal/ProfileTab';
import { WebsiteTab } from '@/components/client-portal/WebsiteTab';
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

export default function ClientPortalDashboard() {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [savedPaymentMethod, setSavedPaymentMethod] = useState<SavedPaymentMethod | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const hasFetchedRef = useRef(false);
  const navigate = useNavigate();

  const fetchClientData = useCallback(async (clientSession: ClientSession) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-client-data', {
        body: { 
          lead_id: clientSession.lead.id, 
          email: clientSession.email,
          session_token: clientSession.token,
        },
      });

      if (error) throw error;

      if (data.lead) {
        const updatedSession = {
          ...clientSession,
          lead: { ...clientSession.lead, ...data.lead }
        };
        setSession(updatedSession);
        sessionStorage.setItem('clientPortalSession', JSON.stringify(updatedSession));
      }

      setTransactions(data.transactions || []);
      setRequests(data.clientRequests || []);
      setSavedPaymentMethod(data.savedPaymentMethod);
    } catch (err) {
      console.error('Error fetching client data:', err);
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedSession = sessionStorage.getItem('clientPortalSession');
    if (!storedSession) {
      navigate('/client-portal');
      return;
    }

    const parsedSession = JSON.parse(storedSession) as ClientSession;
    setSession(parsedSession);
    
    // Only fetch once on mount using ref to survive strict mode
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchClientData(parsedSession);
    } else {
      setLoading(false);
    }
  }, [navigate, fetchClientData]);

  const handleLogout = () => {
    sessionStorage.removeItem('clientPortalSession');
    navigate('/client-portal');
  };

  const handleRequestCreated = useCallback(() => {
    if (session) {
      // Refetch data when a request is created
      fetchClientData(session);
    }
  }, [session, fetchClientData]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const clientName = session.lead.name || session.lead.business_name || session.lead.email.split('@')[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold">{clientName}</p>
            <p className="text-xs text-muted-foreground">{session.lead.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Simple Tab Navigation */}
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                <Home className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="website" className="text-xs sm:text-sm">
                <Globe className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Website</span>
              </TabsTrigger>
              <TabsTrigger value="requests" className="text-xs sm:text-sm">
                <MessageSquarePlus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Requests</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs sm:text-sm">
                <CreditCard className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="text-xs sm:text-sm">
                <User className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <ClientOverviewTab
                lead={session.lead}
                transactions={transactions}
                requests={requests}
                hasPaymentMethod={!!savedPaymentMethod}
                onNavigate={setActiveTab}
              />
            </TabsContent>

            <TabsContent value="website">
              <WebsiteTab
                leadId={session.lead.id}
                email={session.email}
                websiteUrl={session.lead.website_url}
                sessionToken={session.token}
              />
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

            <TabsContent value="payments">
              <PaymentsTab
                lead={session.lead}
                email={session.email}
                sessionToken={session.token}
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
    </div>
  );
}
