import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Clock, CheckCircle2, Circle, Loader2, Globe, Server, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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

  // Get current index (first non-completed)
  const getCurrentIndex = (milestones: ProjectMilestone[]) => {
    const pendingIdx = milestones.findIndex(m => m.status === 'pending');
    if (pendingIdx >= 0) return pendingIdx;
    return milestones.length - 1;
  };

  // Milestone stop component
  const MilestoneStop = ({ 
    milestone, 
    idx, 
    currentIdx,
  }: { 
    milestone: ProjectMilestone; 
    idx: number;
    currentIdx: number;
  }) => {
    const isCompleted = milestone.status === 'completed';
    const isCurrent = idx === currentIdx && !isCompleted;

    return (
      <div className="relative flex flex-col items-center shrink-0 group">
        {/* Dot */}
        <div
          className={cn(
            "w-3.5 h-3.5 rounded-full border-2 transition-all z-10 relative flex items-center justify-center",
            isCompleted && "bg-green-500 border-green-500",
            isCurrent && "bg-primary border-primary ring-4 ring-primary/20",
            !isCompleted && !isCurrent && "bg-background border-muted-foreground/40"
          )}
        >
          {isCompleted && (
            <Check className="h-2 w-2 text-white" />
          )}
        </div>
        
        {/* Label below dot */}
        <span 
          className={cn(
            "absolute top-5 text-[9px] whitespace-nowrap text-center",
            isCompleted && "text-green-600 font-medium",
            isCurrent && "text-primary font-semibold",
            !isCompleted && !isCurrent && "text-muted-foreground"
          )}
        >
          {milestone.title}
        </span>
      </div>
    );
  };

  // Single line timeline (for frontend)
  const TrainRailTimeline = ({ 
    milestones, 
    icon: Icon, 
    label 
  }: { 
    milestones: ProjectMilestone[]; 
    icon: typeof Globe;
    label: string;
  }) => {
    if (milestones.length === 0) return null;

    const currentIdx = getCurrentIndex(milestones);
    const completedCount = milestones.filter(m => m.status === 'completed').length;

    return (
      <div className="space-y-2">
        {/* Label */}
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        
        {/* Train Rail */}
        <div className="relative pt-1 pb-7">
          {/* Background rail */}
          <div className="absolute top-[8px] left-1.5 right-1.5 h-0.5 bg-muted-foreground/20" />
          
          {/* Progress rail */}
          {completedCount > 0 && (
            <div 
              className="absolute top-[8px] left-1.5 h-0.5 bg-green-500 transition-all"
              style={{ 
                width: `calc(${(completedCount / milestones.length) * 100}% - 12px)` 
              }}
            />
          )}
          
          {/* Stops */}
          <div className="relative flex justify-between">
            {milestones.map((milestone, idx) => (
              <MilestoneStop
                key={milestone.id}
                milestone={milestone}
                idx={idx}
                currentIdx={currentIdx}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Wrapping timeline for backend with U-turn
  const WrappingTrainRailTimeline = ({ 
    milestones, 
    icon: Icon, 
    label 
  }: { 
    milestones: ProjectMilestone[]; 
    icon: typeof Globe;
    label: string;
  }) => {
    if (milestones.length === 0) return null;

    const currentIdx = getCurrentIndex(milestones);
    
    // Split: first 5 on row 1, rest on row 2
    const splitAt = 5;
    const firstRow = milestones.slice(0, splitAt);
    const secondRow = milestones.slice(splitAt);
    const hasSecondRow = secondRow.length > 0;

    const completedInFirstRow = firstRow.filter(m => m.status === 'completed').length;
    const allFirstRowComplete = completedInFirstRow === firstRow.length;
    const completedInSecondRow = secondRow.filter(m => m.status === 'completed').length;

    return (
      <div className="space-y-2">
        {/* Label */}
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        
        <div className="relative">
          {/* First Row */}
          <div className="relative pt-1 pb-7 pr-7">
            {/* Background rail */}
            <div className="absolute top-[8px] left-1.5 right-7 h-0.5 bg-muted-foreground/20" />
            
            {/* Progress rail */}
            {completedInFirstRow > 0 && (
              <div 
                className="absolute top-[8px] left-1.5 h-0.5 bg-green-500 transition-all"
                style={{ 
                  width: `calc(${(completedInFirstRow / firstRow.length) * 100}% - ${allFirstRowComplete ? 28 : 12}px)` 
                }}
              />
            )}
            
            {/* Stops */}
            <div className="relative flex justify-between">
              {firstRow.map((milestone, idx) => (
                <MilestoneStop
                  key={milestone.id}
                  milestone={milestone}
                  idx={idx}
                  currentIdx={currentIdx}
                />
              ))}
            </div>
          </div>

          {/* U-Turn Connector */}
          {hasSecondRow && (
            <div className="absolute right-0 top-[8px]">
              <svg width="28" height="48" viewBox="0 0 28 48" fill="none">
                {/* Background path */}
                <line x1="0" y1="0" x2="6" y2="0" stroke="hsl(var(--muted-foreground) / 0.2)" strokeWidth="2" />
                <path d="M6 0 Q20 0 20 14 L20 34 Q20 48 6 48 L0 48" stroke="hsl(var(--muted-foreground) / 0.2)" strokeWidth="2" fill="none" />
                
                {/* Progress overlay */}
                {allFirstRowComplete && (
                  <>
                    <line x1="0" y1="0" x2="6" y2="0" stroke="#22c55e" strokeWidth="2" />
                    <path 
                      d="M6 0 Q20 0 20 14 L20 34 Q20 48 6 48 L0 48" 
                      stroke="#22c55e" 
                      strokeWidth="2" 
                      fill="none"
                    />
                  </>
                )}
              </svg>
            </div>
          )}

          {/* Second Row */}
          {hasSecondRow && (
            <div className="relative pt-1 pb-7 pl-7">
              {/* Background rail */}
              <div className="absolute top-[8px] left-7 right-1.5 h-0.5 bg-muted-foreground/20" />
              
              {/* Progress rail */}
              {completedInSecondRow > 0 && (
                <div 
                  className="absolute top-[8px] left-7 h-0.5 bg-green-500 transition-all"
                  style={{ 
                    width: `calc(${(completedInSecondRow / secondRow.length) * 100}% - 12px)` 
                  }}
                />
              )}
              
              {/* Stops */}
              <div className="relative flex justify-between">
                {secondRow.map((milestone, idx) => {
                  const actualIdx = splitAt + idx;
                  return (
                    <MilestoneStop
                      key={milestone.id}
                      milestone={milestone}
                      idx={actualIdx}
                      currentIdx={currentIdx}
                    />
                  );
                })}
              </div>
            </div>
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

      {/* Project Progress - Hidden on mobile */}
      {hasMilestones && (
        <Card className="hidden md:block">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Build Progress</CardTitle>
            <CardDescription>Track your project development</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {hasFrontendMilestones && (
              <TrainRailTimeline 
                milestones={frontendMilestones} 
                icon={Globe} 
                label="Website" 
              />
            )}
            
            {hasBackendMilestones && (
              <WrappingTrainRailTimeline 
                milestones={backendMilestones} 
                icon={Server} 
                label="Backend" 
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Mobile Progress Summary */}
      {hasMilestones && (
        <Card className="md:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Build Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasFrontendMilestones && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Website</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {frontendMilestones.filter(m => m.status === 'completed').length}/{frontendMilestones.length}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all"
                    style={{ 
                      width: `${(frontendMilestones.filter(m => m.status === 'completed').length / frontendMilestones.length) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}
            
            {hasBackendMilestones && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Backend</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {backendMilestones.filter(m => m.status === 'completed').length}/{backendMilestones.length}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all"
                    style={{ 
                      width: `${(backendMilestones.filter(m => m.status === 'completed').length / backendMilestones.length) * 100}%` 
                    }}
                  />
                </div>
              </div>
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
