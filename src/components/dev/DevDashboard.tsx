import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Link } from 'react-router-dom';
import { Code, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

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

  const projects = useMemo(() => {
    return leads.map(lead => ({
      ...lead,
      progress: calculateProgress(lead.form_data as unknown as WorkflowData | null),
    }));
  }, [leads]);

  const avgProgress = useMemo(() => {
    if (projects.length === 0) return 0;
    return Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length);
  }, [projects]);

  if (loading) {
    return <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Projects</h1>
        <p className="text-muted-foreground">Assigned client builds and progress</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Code className="h-4 w-4" />
            <span className="text-xs">Assigned Projects</span>
          </div>
          <p className="text-2xl font-bold">{projects.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Avg. Completion</span>
          </div>
          <p className="text-2xl font-bold">{avgProgress}%</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Code className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg mb-1">No assigned projects</h3>
          <p className="text-sm text-muted-foreground">Projects assigned to you will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/dev/project/${project.id}`}
              className="block bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold truncate">{project.name || project.email}</h4>
                  <p className="text-sm text-muted-foreground truncate">{project.business_name || 'No business name'}</p>
                </div>
                <Badge variant="outline" className="text-xs ml-2 shrink-0 capitalize">
                  {project.project_type}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Build Progress</span>
                  <span className="font-medium text-foreground">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
