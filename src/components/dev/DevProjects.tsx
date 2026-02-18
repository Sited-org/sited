import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Link } from 'react-router-dom';
import { Code, FolderOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const STAGE_STEPS: Record<string, number> = { frontend: 4, backend: 5, crm_setup: 4, email_automation: 4 };
const MULTI_STAGE_STEPS: Record<string, number> = { integrations: 4, ai: 7 };

function calculateProgress(data: WorkflowData | null): number {
  if (!data?.configured) return 0;
  let total = 0, completed = 0;
  for (const [key, stepCount] of Object.entries(STAGE_STEPS)) {
    const stage = data.stages[key as keyof typeof data.stages] as any;
    if (stage?.enabled) { total += stepCount; completed += stage.currentStep || 0; }
  }
  for (const [key, stepCount] of Object.entries(MULTI_STAGE_STEPS)) {
    const stage = data.stages[key as keyof typeof data.stages] as any;
    if (stage?.enabled && stage.selectedOptions) {
      total += stage.selectedOptions.length * stepCount;
      stage.selectedOptions.forEach((opt: string) => { completed += stage.progress?.[opt] || 0; });
    }
  }
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function ProjectCard({ project }: { project: any }) {
  return (
    <Link
      to={`/dev/project/${project.id}`}
      className="block p-4 border border-border rounded-lg bg-card hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{project.business_name || project.name || project.email}</p>
          <p className="text-xs text-muted-foreground capitalize">{project.project_type}</p>
        </div>
        <Badge variant="outline" className="text-xs ml-2 shrink-0">{project.progress}%</Badge>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${project.progress}%` }} />
      </div>
    </Link>
  );
}

export default function DevProjects() {
  const { leads, loading } = useLeads();

  const projects = useMemo(() => {
    return leads.map(lead => ({
      ...lead,
      progress: calculateProgress(lead.form_data as unknown as WorkflowData | null),
    }));
  }, [leads]);

  const newProjects = useMemo(() => projects.filter(p => p.progress === 0), [projects]);
  const inProgressProjects = useMemo(() => projects.filter(p => p.progress > 0 && p.progress < 100), [projects]);
  const completedProjects = useMemo(() => projects.filter(p => p.progress === 100), [projects]);

  if (loading) {
    return <div className="text-muted-foreground">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">{projects.length} assigned project{projects.length !== 1 ? 's' : ''}</p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No assigned projects</h3>
            <p className="text-sm text-muted-foreground">Projects assigned to you will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* New */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                New ({newProjects.length})
              </h2>
            </div>
            {newProjects.length === 0 ? (
              <p className="text-xs text-muted-foreground pl-6">No new projects</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {newProjects.map(p => <ProjectCard key={p.id} project={p} />)}
              </div>
            )}
          </div>

          {/* In Progress */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                In Progress ({inProgressProjects.length})
              </h2>
            </div>
            {inProgressProjects.length === 0 ? (
              <p className="text-xs text-muted-foreground pl-6">No projects in progress</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {inProgressProjects.map(p => <ProjectCard key={p.id} project={p} />)}
              </div>
            )}
          </div>

          {/* Completed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Completed ({completedProjects.length})
              </h2>
            </div>
            {completedProjects.length === 0 ? (
              <p className="text-xs text-muted-foreground pl-6">No completed projects yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {completedProjects.map(p => <ProjectCard key={p.id} project={p} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
