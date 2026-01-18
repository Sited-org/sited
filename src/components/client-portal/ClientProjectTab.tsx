import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Clock, CheckCircle2, Circle, Loader2, Globe, Server, ChevronDown, ChevronUp, Check } from 'lucide-react';
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
  const [updatesExpanded, setUpdatesExpanded] = useState(true);

  // Extract preview URL from form_data if available
  const previewUrl = lead.form_data?.preview_url || lead.form_data?.previewUrl;

  // Separate milestones by category
  const frontendMilestones = projectMilestones.filter(m => m.category === 'frontend');
  const backendMilestones = projectMilestones.filter(m => m.category === 'backend');

  const hasFrontendMilestones = frontendMilestones.length > 0;
  const hasBackendMilestones = backendMilestones.length > 0;
  const hasMilestones = hasFrontendMilestones || hasBackendMilestones;

  // Calculate progress
  const getProgress = (milestones: ProjectMilestone[]) => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / milestones.length) * 100);
  };

  const frontendProgress = getProgress(frontendMilestones);
  const backendProgress = getProgress(backendMilestones);

  // Horizontal dot component for client view
  const MilestoneDot = ({ milestone }: { milestone: ProjectMilestone }) => {
    const isCompleted = milestone.status === 'completed';
    const isInProgress = milestone.status === 'in_progress';
    
    return (
      <div className="flex flex-col items-center relative group">
        <div
          className={`
            w-3.5 h-3.5 rounded-full border-2 transition-all z-10 relative flex items-center justify-center
            ${isCompleted 
              ? 'bg-green-500 border-green-500' 
              : isInProgress 
                ? 'bg-primary border-primary'
                : 'bg-background border-muted-foreground/30'
            }
          `}
        >
          {isCompleted && (
            <Check className="h-2 w-2 text-white" />
          )}
          {isInProgress && (
            <Loader2 className="h-2 w-2 text-primary-foreground animate-spin" />
          )}
        </div>
        
        {/* Tooltip on hover */}
        <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
          <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border">
            {milestone.title}
          </div>
        </div>
      </div>
    );
  };

  // Timeline line component
  const TimelineLine = ({ 
    milestones, 
    icon: Icon, 
    label 
  }: { 
    milestones: ProjectMilestone[]; 
    icon: typeof Globe;
    label: string;
  }) => {
    if (milestones.length === 0) return null;

    const completedCount = milestones.filter(m => m.status === 'completed').length;
    const progressPercent = (completedCount / milestones.length) * 100;
    const currentMilestone = milestones.find(m => m.status === 'in_progress');

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
            {currentMilestone && (
              <Badge variant="secondary" className="text-xs">
                {currentMilestone.title}
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">{Math.round(progressPercent)}%</span>
        </div>
        
        {/* Timeline */}
        <div className="relative">
          {/* Background line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted-foreground/20 transform -translate-y-1/2" />
          
          {/* Progress line */}
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-green-500 transform -translate-y-1/2 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
          
          {/* Dots */}
          <div className="relative flex justify-between items-center py-3">
            {milestones.map((milestone) => (
              <MilestoneDot key={milestone.id} milestone={milestone} />
            ))}
          </div>
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

      {/* Project Progress - Horizontal Timelines */}
      {hasMilestones && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Build Progress</CardTitle>
            <CardDescription>Track your project development</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {hasFrontendMilestones && (
              <TimelineLine 
                milestones={frontendMilestones} 
                icon={Globe} 
                label="Website" 
              />
            )}
            
            {hasBackendMilestones && (
              <TimelineLine 
                milestones={backendMilestones} 
                icon={Server} 
                label="Backend" 
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* No milestones message */}
      {!hasMilestones && (
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
                  
                  {projectUpdates.map((update) => (
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