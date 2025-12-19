import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Calendar,
  CreditCard,
  FileText,
  ExternalLink,
  ArrowRight,
  Building2,
  Mail,
  Phone
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
  };
  transactions: Transaction[];
  projectUpdates: ProjectUpdate[];
  hasPaymentMethod: boolean;
  onNavigate: (tab: string) => void;
}

export function ClientOverviewTab({ 
  lead, 
  transactions, 
  projectUpdates, 
  hasPaymentMethod,
  onNavigate 
}: ClientOverviewTabProps) {
  const previewUrl = lead.form_data?.preview_url || lead.form_data?.previewUrl;
  
  const pendingTransactions = transactions.filter(t => t.status === 'pending' && t.debit > 0);
  const totalPending = pendingTransactions.reduce((sum, t) => sum + (t.debit || 0), 0);
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Welcome back</span>
              </div>
              <h2 className="text-2xl font-bold mb-1">
                {lead.name || lead.business_name || 'Valued Client'}
              </h2>
              <p className="text-muted-foreground">
                We're excited to be working on your {lead.project_type.replace('_', ' ')} project. 
                Here's everything you need to stay updated.
              </p>
            </div>
            <Badge className={`${statusInfo.color} py-1.5 px-3 text-sm`}>
              <StatusIcon className="h-4 w-4 mr-1.5" />
              {statusInfo.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigate('progress')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Project Updates</p>
                <p className="text-2xl font-bold">{projectUpdates.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigate('payments')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <p className="text-2xl font-bold">
                  {hasPaymentMethod ? 'Active' : 'Setup'}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${hasPaymentMethod ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                <CreditCard className={`h-5 w-5 ${hasPaymentMethod ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigate('history')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Balance</p>
                <p className="text-2xl font-bold">
                  ${totalPending.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${totalPending > 0 ? 'bg-orange-500/10' : 'bg-green-500/10'}`}>
                <Clock className={`h-5 w-5 ${totalPending > 0 ? 'text-orange-600' : 'text-green-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Link if available */}
      {previewUrl && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Project Preview Available</h3>
                  <p className="text-sm text-muted-foreground">View the latest version of your project</p>
                </div>
              </div>
              <Button asChild>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Preview
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest Update & Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Progress Update */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Latest Update
              </span>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('progress')}>
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
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
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No updates yet</p>
                <p className="text-xs">Updates will appear here as your project progresses</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!hasPaymentMethod && (
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => onNavigate('payments')}
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Set up payment method
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => onNavigate('history')}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                View payment history
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => onNavigate('progress')}
            >
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                View all project updates
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Project Details
          </CardTitle>
          <CardDescription>Information about your project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lead.business_name && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Business</p>
                <p className="font-medium">{lead.business_name}</p>
              </div>
            )}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Project Type</p>
              <p className="font-medium">{lead.project_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Started</p>
              <p className="font-medium">{format(new Date(lead.created_at), 'MMMM d, yyyy')}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Contact Email</p>
              <p className="font-medium flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {lead.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
