import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, Clock, CheckCircle2, AlertCircle, Circle, Loader2, Globe, Server, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ProjectUpdate {
  id: string;
  content: string;
  created_at: string;
}

interface ProjectMilestone {
  id: string;
  category: 'frontend' | 'backend';
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at: string | null;
}

interface ClientProjectTabProps {
  lead: {
    id: string;
    name: string;
    project_type: string;
    status: string;
    form_data: any;
  };
  projectUpdates: ProjectUpdate[];
  projectMilestones?: ProjectMilestone[];
}

export function ClientProjectTab({ lead, projectUpdates, projectMilestones = [] }: ClientProjectTabProps) {
  const [frontendExpanded, setFrontendExpanded] = useState(true);
  const [backendExpanded, setBackendExpanded] = useState(true);
  const [updatesExpanded, setUpdatesExpanded] = useState(true);

  // Extract preview URL from form_data if available
  const previewUrl = lead.form_data?.preview_url || lead.form_data?.previewUrl;

  // Separate milestones by category
  const frontendMilestones = projectMilestones.filter(m => m.category === 'frontend');
  const backendMilestones = projectMilestones.filter(m => m.category === 'backend');

  const hasFrontendMilestones = frontendMilestones.length > 0;
  const hasBackendMilestones = backendMilestones.length > 0;

  const completedFrontend = frontendMilestones.filter(m => m.status === 'completed').length;
  const completedBackend = backendMilestones.filter(m => m.status === 'completed').length;

  const frontendProgress = frontendMilestones.length > 0 
    ? Math.round((completedFrontend / frontendMilestones.length) * 100) 
    : 0;
  const backendProgress = backendMilestones.length > 0 
    ? Math.round((completedBackend / backendMilestones.length) * 100) 
    : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const MilestoneItem = ({ milestone, index, total }: { milestone: ProjectMilestone; index: number; total: number }) => {
    const isLast = index === total - 1;
    const isCompleted = milestone.status === 'completed';
    const isInProgress = milestone.status === 'in_progress';

    return (
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
            isCompleted 
              ? 'bg-green-500 text-white border-green-500' 
              : isInProgress 
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-border'
          }`}>
            {getStatusIcon(milestone.status)}
          </div>
          {!isLast && (
            <div className={`w-0.5 flex-1 min-h-6 ${isCompleted ? 'bg-green-500' : 'bg-border'}`} />
          )}
        </div>
        
        <div className="flex-1 pb-4">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isCompleted || isInProgress ? 'text-foreground' : 'text-muted-foreground'}`}>
              {milestone.title}
            </span>
            {isInProgress && (
              <Badge variant="secondary" className="text-xs">Current</Badge>
            )}
          </div>
          {milestone.completed_at && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(milestone.completed_at), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Preview Link */}
      {previewUrl && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Project Preview
            </CardTitle>
            <CardDescription>
              View the latest preview of your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Preview
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Frontend Progress */}
      {hasFrontendMilestones && (
        <Card>
          <Collapsible open={frontendExpanded} onOpenChange={setFrontendExpanded}>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">Website Development</CardTitle>
                      <CardDescription className="text-sm">Your website build progress</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Progress value={frontendProgress} className="w-20 h-2" />
                      <span className="text-sm font-medium">{frontendProgress}%</span>
                    </div>
                    {frontendExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                {frontendMilestones.map((milestone, index) => (
                  <MilestoneItem 
                    key={milestone.id} 
                    milestone={milestone} 
                    index={index}
                    total={frontendMilestones.length}
                  />
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Backend Progress */}
      {hasBackendMilestones && (
        <Card>
          <Collapsible open={backendExpanded} onOpenChange={setBackendExpanded}>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">Backend Development</CardTitle>
                      <CardDescription className="text-sm">Backend & integrations progress</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Progress value={backendProgress} className="w-20 h-2" />
                      <span className="text-sm font-medium">{backendProgress}%</span>
                    </div>
                    {backendExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                {backendMilestones.map((milestone, index) => (
                  <MilestoneItem 
                    key={milestone.id} 
                    milestone={milestone} 
                    index={index}
                    total={backendMilestones.length}
                  />
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* No milestones message */}
      {!hasFrontendMilestones && !hasBackendMilestones && (
        <Card>
          <CardContent className="py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Project milestones will appear here once development begins</p>
          </CardContent>
        </Card>
      )}

      {/* Project Updates */}
      <Card>
        <Collapsible open={updatesExpanded} onOpenChange={setUpdatesExpanded}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-lg">Development Updates</CardTitle>
                    <CardDescription className="text-sm">Updates from our team</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {projectUpdates.length > 0 && (
                    <Badge variant="secondary">{projectUpdates.length}</Badge>
                  )}
                  {updatesExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {projectUpdates.length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No updates yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Updates will appear here as your project progresses
                  </p>
                </div>
              ) : (
                <div className="relative space-y-0">
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
                  
                  {projectUpdates.map((update, index) => (
                    <div key={update.id} className="relative pl-10 pb-4 last:pb-0">
                      <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          {format(new Date(update.created_at), 'MMMM d, yyyy')}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{update.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
