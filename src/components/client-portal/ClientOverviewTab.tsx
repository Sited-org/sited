import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Globe, 
  MessageSquarePlus,
  CreditCard,
  ExternalLink,
  ArrowRight,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

interface Transaction {
  id: string;
  item: string;
  credit: number;
  debit: number;
  transaction_date: string;
  status: string;
}

interface ClientRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface ProjectUpdate {
  id: string;
  content: string;
  created_at: string;
}

interface ProjectMilestone {
  id: string;
  category: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at: string | null;
}

interface ClientOverviewTabProps {
  lead: {
    id: string;
    name: string;
    email: string;
    business_name?: string;
    project_type: string;
    status: string;
    created_at: string;
    website_url?: string;
    form_data?: any;
  };
  transactions: Transaction[];
  requests: ClientRequest[];
  projectUpdates: ProjectUpdate[];
  projectMilestones: ProjectMilestone[];
  hasPaymentMethod: boolean;
  onNavigate: (tab: string) => void;
}

export function ClientOverviewTab({ 
  lead, 
  transactions, 
  requests,
  projectUpdates,
  projectMilestones,
  hasPaymentMethod,
  onNavigate 
}: ClientOverviewTabProps) {
  const [expandedUpdates, setExpandedUpdates] = useState<Record<string, boolean>>({});
  
  const pendingTransactions = transactions.filter(t => t.status === 'pending' && t.debit > 0);
  const totalDue = pendingTransactions.reduce((sum, t) => sum + (t.debit || 0), 0);
  const activeRequests = requests.filter(r => r.status === 'pending' || r.status === 'in_progress');
  
  const latestUpdates = projectUpdates.slice(0, 2);
  
  // Only frontend milestones
  const milestones = projectMilestones.filter(m => m.category === 'frontend');
  const hasMilestones = milestones.length > 0;
  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
  
  const toggleUpdate = (id: string) => {
    setExpandedUpdates(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const websiteUrl = lead.website_url;
  const previewUrl = lead.form_data?.preview_url || lead.form_data?.previewUrl;
  const displayUrl = websiteUrl || previewUrl;

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div className="pb-2">
        <h1 className="text-xl font-semibold">
          Welcome back{lead.name ? `, ${lead.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">
          Client since {format(new Date(lead.created_at), 'MMMM yyyy')}
        </p>
      </div>

      {/* Project Progress */}
      {hasMilestones && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Build Progress</span>
              </div>
              <span className="text-xs text-muted-foreground">{progress}% complete</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Website</span>
                <span>{completedCount}/{milestones.length}</span>
              </div>
              <div className="relative h-2">
                <div className="absolute inset-0 bg-muted rounded-full" />
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-green-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            <Button variant="ghost" size="sm" className="w-full" onClick={() => onNavigate('project')}>
              View Details <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Website Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Your Website</p>
                <p className="text-xs text-muted-foreground">
                  {displayUrl ? 'Live' : 'In development'}
                </p>
              </div>
            </div>
            {displayUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={displayUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => onNavigate('requests')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">{activeRequests.length}</p>
                <p className="text-xs text-muted-foreground">Active Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => onNavigate('payments')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className={`text-lg font-semibold ${totalDue > 0 ? 'text-orange-600' : ''}`}>
                  ${totalDue.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Balance Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments */}
      {pendingTransactions.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Upcoming Payments</p>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('payments')}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {pendingTransactions.slice(0, 2).map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate mr-2">{t.item}</span>
                  <Badge variant="outline" className="shrink-0">
                    ${t.debit.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Updates from Developers */}
      {latestUpdates.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Latest Updates</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('project')}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {latestUpdates.map((update) => (
                <Collapsible 
                  key={update.id} 
                  open={expandedUpdates[update.id]}
                  onOpenChange={() => toggleUpdate(update.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-start justify-between text-left p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {format(new Date(update.created_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm line-clamp-1">{update.content}</p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform ${expandedUpdates[update.id] ? 'rotate-180' : ''}`} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-2 pb-2">
                      <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                        {update.content}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Active Requests</p>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('requests')}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {activeRequests.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="truncate mr-2">{r.title}</span>
                  <Badge 
                    variant="outline" 
                    className={r.status === 'in_progress' ? 'text-blue-600 border-blue-200' : ''}
                  >
                    {r.status === 'in_progress' ? 'In Progress' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Prompt */}
      {!hasPaymentMethod && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Payment Method</p>
                  <p className="text-xs text-muted-foreground">Add a card for automatic billing</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => onNavigate('payments')}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
