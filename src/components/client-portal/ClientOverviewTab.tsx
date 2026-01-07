import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Clock, 
  CheckCircle2, 
  CreditCard,
  FileText,
  ArrowRight,
  MessageSquarePlus,
  Palette,
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  item: string;
  credit: number;
  debit: number;
  transaction_date: string;
  status: string;
  is_recurring: boolean;
}

interface ProjectUpdate {
  id: string;
  content: string;
  created_at: string;
}

interface ClientRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface ClientOverviewTabProps {
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
  };
  transactions: Transaction[];
  projectUpdates: ProjectUpdate[];
  requests: ClientRequest[];
  hasPaymentMethod: boolean;
  designProgress: number;
  metricsProgress: number;
  onNavigate: (tab: string) => void;
}

export function ClientOverviewTab({ 
  lead, 
  transactions, 
  projectUpdates, 
  requests,
  hasPaymentMethod,
  designProgress,
  metricsProgress,
  onNavigate 
}: ClientOverviewTabProps) {
  const pendingTransactions = transactions.filter(t => t.status === 'pending' && t.debit > 0);
  const totalPending = pendingTransactions.reduce((sum, t) => sum + (t.debit || 0), 0);
  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'in_progress');
  const latestUpdate = projectUpdates[0];
  
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'new':
        return { label: 'Getting Started', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Clock };
      case 'contacted':
        return { label: 'In Discussion', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock };
      case 'booked_call':
        return { label: 'Call Scheduled', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Calendar };
      case 'sold':
        return { label: 'In Development', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 };
      default:
        return { label: status, color: 'bg-muted', icon: Clock };
    }
  };

  const statusInfo = getStatusInfo(lead.status);
  const StatusIcon = statusInfo.icon;
  const overallProgress = Math.round((designProgress + metricsProgress) / 2);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 border border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div>
            <p className="text-sm font-medium text-primary mb-1">Welcome back</p>
            <h2 className="text-2xl font-bold mb-1">
              {lead.name || lead.business_name || 'Valued Client'}
            </h2>
            <p className="text-muted-foreground">
              Here's an overview of your website project
            </p>
          </div>
          <Badge className={`${statusInfo.color} py-1.5 px-3 text-sm shrink-0`}>
            <StatusIcon className="h-4 w-4 mr-1.5" />
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigate('website')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Website</p>
                <p className="text-sm font-semibold truncate">
                  {lead.website_url ? 'Live' : 'In Progress'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigate('requests')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <MessageSquarePlus className="h-5 w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Requests</p>
                <p className="text-sm font-semibold">
                  {pendingRequests.length} Active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigate('progress')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-sm font-semibold">{overallProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigate('payments')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${totalPending > 0 ? 'bg-orange-500/10' : 'bg-green-500/10'}`}>
                <DollarSign className={`h-5 w-5 ${totalPending > 0 ? 'text-orange-600' : 'text-green-600'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Due</p>
                <p className="text-sm font-semibold">
                  ${totalPending.toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Project Progress</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('progress')}>
              View Details <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-purple-500" />
                  Design
                </span>
                <span className="font-medium">{designProgress}%</span>
              </div>
              <Progress value={designProgress} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Metrics & Performance
                </span>
                <span className="font-medium">{metricsProgress}%</span>
              </div>
              <Progress value={metricsProgress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Update */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Latest Update
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('progress')}>
                All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {latestUpdate ? (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {format(new Date(latestUpdate.created_at), 'MMMM d, yyyy')}
                </p>
                <p className="line-clamp-3">{latestUpdate.content}</p>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No updates yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto py-3"
              onClick={() => onNavigate('requests')}
            >
              <span className="flex items-center gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                Submit a Request
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            {!hasPaymentMethod && (
              <Button 
                variant="outline" 
                className="w-full justify-between h-auto py-3"
                onClick={() => onNavigate('payments')}
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Set up Payment Method
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto py-3"
              onClick={() => onNavigate('profile')}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Update Profile
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments Preview */}
      {pendingTransactions.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                <CreditCard className="h-5 w-5" />
                Upcoming Payments
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('payments')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingTransactions.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{t.item}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(t.transaction_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-600/30">
                    ${t.debit.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
