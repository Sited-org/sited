import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Clock, Globe, ChevronDown, ChevronUp, Check } from 'lucide-react';
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
  category: string;
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

  // Only show frontend milestones
  const milestones = projectMilestones.filter(m => m.category === 'frontend');
  const hasMilestones = milestones.length > 0;
  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  // Get current index (first non-completed)
  const getCurrentIndex = () => {
    const pendingIdx = milestones.findIndex(m => m.status === 'pending');
    if (pendingIdx >= 0) return pendingIdx;
    return milestones.length - 1;
  };

  const currentIdx = getCurrentIndex();

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

      {/* Project Progress - Desktop Timeline */}
      {hasMilestones && (
        <Card className="hidden md:block">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Build Progress</CardTitle>
            <CardDescription>Track your project development</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Website</span>
              </div>
              
              <div className="relative pt-1 pb-7">
                {/* Background rail */}
                <div className="absolute top-[8px] left-1.5 right-1.5 h-0.5 bg-muted-foreground/20" />
                
                {/* Animated progress rail */}
                <div 
                  className="absolute top-[8px] left-1.5 h-0.5 bg-green-500 transition-all duration-700 ease-out"
                  style={{ 
                    width: completedCount > 0 
                      ? `calc(${(completedCount / milestones.length) * 100}% - 12px)` 
                      : '0%' 
                  }}
                />
                
                {/* Stops */}
                <div className="relative flex justify-between">
                  {milestones.map((milestone, idx) => {
                    const isCompleted = milestone.status === 'completed';
                    const isCurrent = idx === currentIdx && !isCompleted;

                    return (
                      <div 
                        key={milestone.id}
                        className="relative flex flex-col items-center shrink-0 group"
                      >
                        {/* Dot */}
                        <div
                          className={cn(
                            "w-3.5 h-3.5 rounded-full border-2 z-10 relative flex items-center justify-center transition-all duration-500",
                            isCompleted && "bg-green-500 border-green-500",
                            isCurrent && "bg-primary border-primary ring-4 ring-primary/20 animate-pulse",
                            !isCompleted && !isCurrent && "bg-background border-muted-foreground/40"
                          )}
                        >
                          {isCompleted && (
                            <Check className="h-2 w-2 text-white animate-scale-in" />
                          )}
                        </div>
                        
                        {/* Label */}
                        <span 
                          className={cn(
                            "absolute top-5 text-[9px] whitespace-nowrap text-center transition-colors duration-300",
                            isCompleted && "text-green-600 font-medium",
                            isCurrent && "text-primary font-semibold",
                            !isCompleted && !isCurrent && "text-muted-foreground"
                          )}
                        >
                          {milestone.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Progress Summary */}
      {hasMilestones && (
        <Card className="md:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Build Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Website</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {completedCount}/{milestones.length}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {milestones[currentIdx] && milestones[currentIdx].status !== 'completed' && (
                <p className="text-xs text-muted-foreground">
                  Current: <span className="text-primary font-medium">{milestones[currentIdx].title}</span>
                </p>
              )}
            </div>
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
