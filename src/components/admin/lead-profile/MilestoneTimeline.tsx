import { useEffect, useRef, useState } from 'react';
import { 
  Check, 
  Loader2, 
  Globe,
} from 'lucide-react';
import { 
  useProjectMilestones, 
  ProjectMilestone, 
} from '@/hooks/useProjectMilestones';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MilestoneTimelineProps {
  leadId: string;
  lead: any;
  canEdit: boolean;
}

export function MilestoneTimeline({ leadId, lead, canEdit }: MilestoneTimelineProps) {
  const {
    milestones,
    hasMilestones,
    completedCount,
    progress,
    loading,
    initializeMilestones,
    updateMilestoneStatus,
  } = useProjectMilestones(leadId);

  const { addUpdate } = useProjectUpdates(leadId);
  const hasInitializedRef = useRef(false);

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingMilestone, setPendingMilestone] = useState<ProjectMilestone | null>(null);

  // Auto-initialize milestones if they don't exist
  useEffect(() => {
    if (!loading && !hasMilestones && !hasInitializedRef.current && leadId) {
      hasInitializedRef.current = true;
      initializeMilestones();
    }
  }, [loading, hasMilestones, leadId, initializeMilestones]);

  // Get current milestone index (first non-completed)
  const getCurrentIndex = () => {
    const pendingIdx = milestones.findIndex(m => m.status === 'pending');
    if (pendingIdx >= 0) return pendingIdx;
    return milestones.length - 1;
  };

  const handleMilestoneClick = (milestone: ProjectMilestone) => {
    if (!canEdit) return;
    
    const milestoneIdx = milestones.findIndex(m => m.id === milestone.id);
    const currentIdx = getCurrentIndex();
    
    if (milestone.status === 'completed') return;
    if (milestoneIdx !== currentIdx) return;
    
    setPendingMilestone(milestone);
    setConfirmDialogOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!pendingMilestone) return;
    
    try {
      await updateMilestoneStatus(pendingMilestone.id, 'completed');
      
      const updateContent = `🌐 Website: "${pendingMilestone.title}" completed`;
      await addUpdate(updateContent);
      
      toast.success(`Milestone completed`);
    } catch (error) {
      toast.error('Failed to update milestone');
    } finally {
      setConfirmDialogOpen(false);
      setPendingMilestone(null);
    }
  };

  const currentIdx = getCurrentIndex();

  if (loading) {
    return (
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading milestones...
        </div>
      </div>
    );
  }

  if (!hasMilestones) {
    return (
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Initializing milestones...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop view */}
      <div className="hidden md:block bg-muted/30 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Website Progress</span>
          </div>
          
          <div className="relative pt-1 pb-8">
            {/* Background rail */}
            <div className="absolute top-[9px] left-2 right-2 h-0.5 bg-muted-foreground/20" />
            
            {/* Animated progress rail */}
            <div 
              className="absolute top-[9px] left-2 h-0.5 bg-green-500 transition-all duration-700 ease-out"
              style={{ 
                width: completedCount > 0 
                  ? `calc(${(completedCount / milestones.length) * 100}% - 16px)` 
                  : '0%' 
              }}
            />
            
            <div className="relative flex justify-between">
              {milestones.map((milestone, idx) => {
                const isCompleted = milestone.status === 'completed';
                const isCurrent = idx === currentIdx && !isCompleted;
                const isClickable = canEdit && !isCompleted && idx === currentIdx;

                return (
                  <button
                    key={milestone.id}
                    onClick={() => handleMilestoneClick(milestone)}
                    disabled={!isClickable}
                    className={cn(
                      "relative flex flex-col items-center shrink-0 transition-transform duration-300",
                      isClickable ? "cursor-pointer hover:scale-110" : "cursor-default"
                    )}
                  >
                    {/* Dot with animation */}
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 z-10 relative transition-all duration-500",
                        isCompleted && "bg-green-500 border-green-500 scale-100",
                        isCurrent && "bg-primary border-primary ring-4 ring-primary/20 animate-pulse",
                        !isCompleted && !isCurrent && "bg-background border-muted-foreground/40"
                      )}
                    >
                      {isCompleted && (
                        <Check className="h-2.5 w-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-scale-in" />
                      )}
                    </div>
                    
                    {/* Label */}
                    <span 
                      className={cn(
                        "absolute top-6 text-[10px] whitespace-nowrap text-center transition-colors duration-300",
                        isCompleted && "text-green-600 font-medium",
                        isCurrent && "text-primary font-semibold",
                        !isCompleted && !isCurrent && "text-muted-foreground"
                      )}
                    >
                      {milestone.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile view - simple progress bar */}
      <div className="md:hidden bg-muted/30 rounded-lg p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Website Progress</span>
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
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Milestone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark "{pendingMilestone?.title}" as completed? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingMilestone(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmComplete}>
              Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
