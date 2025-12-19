import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut, CreditCard, FileText, Clock, ExternalLink, Clipboard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ClientPaymentMethodTab } from '@/components/client-portal/ClientPaymentMethodTab';
import { ClientTransactionsTab } from '@/components/client-portal/ClientTransactionsTab';
import { ClientProjectTab } from '@/components/client-portal/ClientProjectTab';

interface ClientSession {
  lead: {
    id: string;
    name: string;
    email: string;
    business_name?: string;
    project_type: string;
    status: string;
    form_data: any;
    created_at: string;
  };
  token: string;
  email: string;
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
  const navigate = useNavigate();

  useEffect(() => {
    const storedSession = sessionStorage.getItem('clientPortalSession');
    if (!storedSession) {
      navigate('/client-portal');
      return;
    }

    const parsedSession = JSON.parse(storedSession) as ClientSession;
    setSession(parsedSession);
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

  const copyLeadId = () => {
    if (session?.lead.id) {
      navigator.clipboard.writeText(session.lead.id);
      toast.success('Lead ID copied to clipboard');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'contacted': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'booked_call': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'sold': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
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
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Client Portal</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {session.lead.name || session.lead.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Project Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{session.lead.business_name || session.lead.name || 'Your Project'}</CardTitle>
                <CardDescription className="mt-1">
                  {session.lead.project_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Project
                </CardDescription>
              </div>
              <Badge className={getStatusColor(session.lead.status)}>
                {session.lead.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Lead ID:</span>
              <code className="bg-muted px-2 py-1 rounded text-xs">{session.lead.id}</code>
              <Button variant="ghost" size="sm" onClick={copyLeadId} className="h-6 px-2">
                <Clipboard className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="payments" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payment Method</span>
                <span className="sm:hidden">Payment</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Transactions</span>
                <span className="sm:hidden">History</span>
              </TabsTrigger>
              <TabsTrigger value="project" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Project Progress</span>
                <span className="sm:hidden">Progress</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payments">
              <ClientPaymentMethodTab
                lead={session.lead}
                email={session.email}
                savedPaymentMethod={savedPaymentMethod}
                onPaymentMethodSaved={(pm) => setSavedPaymentMethod(pm)}
              />
            </TabsContent>

            <TabsContent value="transactions">
              <ClientTransactionsTab
                transactions={transactions}
                leadName={session.lead.name || session.lead.business_name || 'Client'}
              />
            </TabsContent>

            <TabsContent value="project">
              <ClientProjectTab
                lead={session.lead}
                projectUpdates={projectUpdates}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
