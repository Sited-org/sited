import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useClientRequests } from '@/hooks/useClientRequests';
import { Link } from 'react-router-dom';
import { Code, TrendingUp, ClipboardList, FolderOpen, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays } from 'date-fns';

interface WorkflowData {
  configured: boolean;
  stages: {
    frontend?: { enabled: boolean; currentStep: number };
    backend?: { enabled: boolean; currentStep: number };
    integrations?: { enabled: boolean; selectedOptions: string[]; progress: Record<string, number> };
    ai?: { enabled: boolean; selectedOptions: string[]; progress: Record<string, number> };
    crm_setup?: { enabled: boolean; currentStep: number };
    email_automation?: { enabled: boolean; currentStep: number };
  };
}

const STAGE_STEPS: Record<string, number> = {
  frontend: 4,
  backend: 5,
  crm_setup: 4,
  email_automation: 4,
};

const MULTI_STAGE_STEPS: Record<string, number> = {
  integrations: 4,
  ai: 7,
};

function calculateProgress(data: WorkflowData | null): number {
  if (!data?.configured) return 0;
  let total = 0, completed = 0;

  for (const [key, stepCount] of Object.entries(STAGE_STEPS)) {
    const stage = data.stages[key as keyof typeof data.stages] as any;
    if (stage?.enabled) {
      total += stepCount;
      completed += stage.currentStep || 0;
    }
  }

  for (const [key, stepCount] of Object.entries(MULTI_STAGE_STEPS)) {
    const stage = data.stages[key as keyof typeof data.stages] as any;
    if (stage?.enabled && stage.selectedOptions) {
      total += stage.selectedOptions.length * stepCount;
      stage.selectedOptions.forEach((opt: string) => {
        completed += stage.progress?.[opt] || 0;
      });
    }
  }

  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

export default function DevDashboard() {
  const { leads, loading } = useLeads();
  const { requests, loading: requestsLoading } = useClientRequests();

  const projects = useMemo(() => {
    return leads.map(lead => ({
      ...lead,
      progress: calculateProgress(lead.form_data as unknown as WorkflowData | null),
    }));
  }, [leads]);

  const pendingRequests = useMemo(() => {
    const assignedLeadIds = new Set(leads.map(l => l.id));
    return requests.filter(r => assignedLeadIds.has(r.lead_id) && (r.status === 'pending' || r.status === 'in_progress'));
  }, [requests, leads]);

  const newProjects = useMemo(() => projects.filter(p => p.progress === 0), [projects]);
  const inProgressProjects = useMemo(() => projects.filter(p => p.progress > 0 && p.progress < 100), [projects]);
  const completedProjects = useMemo(() => projects.filter(p => p.progress === 100), [projects]);

  const avgDevTime = useMemo(() => {
    const completed = projects.filter(p => p.progress === 100);
    if (completed.length === 0) return null;
    const totalDays = completed.reduce((sum, p) => sum + differenceInDays(new Date(), new Date(p.created_at)), 0);
    return Math.round(totalDays / completed.length);
  }, [projects]);

  const avgProgress = useMemo(() => {
    if (projects.length === 0) return 0;
    return Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length);
  }, [projects]);

  if (loading || requestsLoading) {
    return <div className="text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your assigned work</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ClipboardList className="h-4 w-4" />
              <span className="text-xs">Open Requests</span>
            </div>
            <p className="text-2xl font-bold">{pendingRequests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">New Projects</span>
            </div>
            <p className="text-2xl font-bold">{newProjects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FolderOpen className="h-4 w-4" />
              <span className="text-xs">In Progress</span>
            </div>
            <p className="text-2xl font-bold">{inProgressProjects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Code className="h-4 w-4" />
              <span className="text-xs">Total Projects</span>
            </div>
            <p className="text-2xl font-bold">{projects.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Avg. Completion</span>
            </div>
            <p className="text-2xl font-bold">{avgProgress}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Avg. Dev Time</span>
            </div>
            <p className="text-2xl font-bold">{avgDevTime !== null ? `${avgDevTime}d` : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Code className="h-4 w-4" />
              <span className="text-xs">Completed</span>
            </div>
            <p className="text-2xl font-bold">{completedProjects.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Outstanding Requests</h2>
            <Link to="/dev/requests" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {pendingRequests.slice(0, 5).map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{req.title}</p>
                  <p className="text-xs text-muted-foreground">{req.lead?.business_name || req.lead?.email}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Badge variant="outline" className="text-xs capitalize">{req.priority}</Badge>
                  <Badge variant={req.status === 'in_progress' ? 'default' : 'secondary'} className="text-xs capitalize">
                    {req.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects */}
      {projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Recent Projects</h2>
            <Link to="/dev/projects" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {projects.slice(0, 5).map(project => (
              <Link
                key={project.id}
                to={`/dev/project/${project.id}`}
                className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{project.business_name || project.name || project.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{project.project_type}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className="text-xs font-medium">{project.progress}%</span>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No assigned projects</h3>
            <p className="text-sm text-muted-foreground">Projects assigned to you will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
