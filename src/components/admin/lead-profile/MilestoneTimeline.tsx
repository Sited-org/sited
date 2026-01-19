import { useEffect, useRef, useState } from 'react';
import { 
  Check, 
  Loader2, 
  Globe,
  Server,
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

// Helper to determine if backend is needed based on form_data
function needsBackend(formData: any): boolean {
  if (!formData) return false;
  
  const formString = JSON.stringify(formData).toLowerCase();
  
  const backendKeywords = [
    'backend', 'database', 'authentication', 'login', 'user account',
    'payment', 'stripe', 'api', 'booking', 'crm', 'admin', 'dashboard',
    'integration', 'automation', 'email automation', 'membership',
    'subscription', 'e-commerce', 'ecommerce', 'shop', 'store', 'cart',
  ];
  
  return backendKeywords.some(keyword => formString.includes(keyword));
}

export function MilestoneTimeline({ leadId, lead, canEdit }: MilestoneTimelineProps) {
  const {
    frontendMilestones,
    backendMilestones,
    hasFrontendMilestones,
    hasBackendMilestones,
    loading,
    initializeFrontendMilestones,
    initializeBackendMilestones,
    updateMilestoneStatus,
  } = useProjectMilestones(leadId);

  const { addUpdate } = useProjectUpdates(leadId);
  const hasInitializedFrontendRef = useRef(false);
  const hasInitializedBackendRef = useRef(false);

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingMilestone, setPendingMilestone] = useState<{ milestone: ProjectMilestone; milestones: ProjectMilestone[] } | null>(null);

  const showBackendLine = hasBackendMilestones || needsBackend(lead.form_data);

  // Auto-initialize frontend milestones if they don't exist
  useEffect(() => {
    if (!loading && !hasFrontendMilestones && !hasInitializedFrontendRef.current && leadId) {
      hasInitializedFrontendRef.current = true;
      initializeFrontendMilestones();
    }
  }, [loading, hasFrontendMilestones, leadId, initializeFrontendMilestones]);

  // Auto-initialize backend milestones if needed and they don't exist
  useEffect(() => {
    if (!loading && hasFrontendMilestones && !hasBackendMilestones && !hasInitializedBackendRef.current && leadId && needsBackend(lead.form_data)) {
      hasInitializedBackendRef.current = true;
      initializeBackendMilestones([]);
    }
  }, [loading, hasFrontendMilestones, hasBackendMilestones, leadId, lead.form_data, initializeBackendMilestones]);

  // Get current milestone index (first non-completed)
  const getCurrentIndex = (milestones: ProjectMilestone[]) => {
    const pendingIdx = milestones.findIndex(m => m.status === 'pending');
    if (pendingIdx >= 0) return pendingIdx;
    
    return milestones.length - 1; // All completed
  };

  const handleMilestoneClick = (milestone: ProjectMilestone, milestones: ProjectMilestone[]) => {
    if (!canEdit) return;
    
    const milestoneIdx = milestones.findIndex(m => m.id === milestone.id);
    const currentIdx = getCurrentIndex(milestones);
    
    // Cannot click on completed milestones (no going back)
    if (milestone.status === 'completed') return;
    
    // Can only click on the next pending milestone (currentIdx)
    if (milestoneIdx !== currentIdx) return;
    
    // Open confirmation dialog
    setPendingMilestone({ milestone, milestones });
    setConfirmDialogOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!pendingMilestone) return;
    
    const { milestone } = pendingMilestone;
    
    try {
      await updateMilestoneStatus(milestone.id, 'completed');
      
      const categoryLabel = milestone.category === 'frontend' ? '🌐 Frontend' : '⚙️ Backend';
      const updateContent = `${categoryLabel}: "${milestone.title}" completed`;
      await addUpdate(updateContent);
      
      toast.success(`Milestone completed`);
    } catch (error) {
      toast.error('Failed to update milestone');
    } finally {
      setConfirmDialogOpen(false);
      setPendingMilestone(null);
    }
  };

  // Train-rail style timeline row
  const TrainRailTimeline = ({ 
    milestones, 
    category, 
    icon: Icon, 
    label 
  }: { 
    milestones: ProjectMilestone[]; 
    category: 'frontend' | 'backend';
    icon: typeof Globe;
    label: string;
  }) => {
    if (milestones.length === 0) return null;

    const currentIdx = getCurrentIndex(milestones);

    return (
      <div className="space-y-2">
        {/* Label */}
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        
        {/* Train Rail */}
        <div className="relative flex items-center pt-1 pb-8">
          {milestones.map((milestone, idx) => {
            const isCompleted = milestone.status === 'completed';
            const isCurrent = idx === currentIdx && !isCompleted;
            const isPast = isCompleted;
            // Can only click the next pending milestone
            const isClickable = canEdit && !isCompleted && idx === currentIdx;
            
            return (
              <div key={milestone.id} className="flex items-center flex-1 last:flex-none">
                {/* Stop/Station */}
                <button
                  onClick={() => handleMilestoneClick(milestone, milestones)}
                  disabled={!isClickable}
                  className={cn(
                    "relative flex flex-col items-center",
                    isClickable ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  {/* Dot */}
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 transition-all z-10",
                      isCompleted && "bg-green-500 border-green-500",
                      isCurrent && "bg-primary border-primary ring-4 ring-primary/20",
                      !isCompleted && !isCurrent && "bg-background border-muted-foreground/40",
                      isClickable && "hover:scale-125"
                    )}
                  >
                    {isCompleted && (
                      <Check className="h-2.5 w-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  
                  {/* Label below dot - always visible */}
                  <span 
                    className={cn(
                      "absolute top-6 text-[10px] whitespace-nowrap max-w-[80px] truncate text-center",
                      isCompleted && "text-green-600 font-medium",
                      isCurrent && "text-primary font-semibold",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}
                    title={milestone.title}
                  >
                    {milestone.title}
                  </span>
                </button>
                
                {/* Rail between stations */}
                {idx < milestones.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1">
                    <div 
                      className={cn(
                        "h-full transition-colors",
                        isPast ? "bg-green-500" : "bg-muted-foreground/20"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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

  // Show placeholder if no milestones yet
  if (!hasFrontendMilestones && !hasBackendMilestones) {
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
      <div className="bg-muted/30 rounded-lg p-4 space-y-6">
        {/* Frontend Timeline */}
        <TrainRailTimeline 
          milestones={frontendMilestones} 
          category="frontend"
          icon={Globe} 
          label="Frontend" 
        />
        
        {/* Backend Timeline */}
        {showBackendLine && hasBackendMilestones && (
          <TrainRailTimeline 
            milestones={backendMilestones} 
            category="backend"
            icon={Server} 
            label="Backend" 
          />
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Milestone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark "{pendingMilestone?.milestone.title}" as completed? 
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
