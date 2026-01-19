import { useEffect, useRef } from 'react';
import { 
  Check, 
  Loader2, 
  Globe,
  Server,
} from 'lucide-react';
import { 
  useProjectMilestones, 
  ProjectMilestone, 
  MilestoneStatus,
} from '@/hooks/useProjectMilestones';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
    updateMilestoneStatus,
  } = useProjectMilestones(leadId);

  const { addUpdate } = useProjectUpdates(leadId);
  const hasInitializedRef = useRef(false);

  const showBackendLine = hasBackendMilestones || needsBackend(lead.form_data);

  // Auto-initialize frontend milestones if they don't exist
  useEffect(() => {
    if (!loading && !hasFrontendMilestones && !hasInitializedRef.current && leadId) {
      hasInitializedRef.current = true;
      initializeFrontendMilestones();
    }
  }, [loading, hasFrontendMilestones, leadId, initializeFrontendMilestones]);

  // Get current milestone index (first non-completed)
  const getCurrentIndex = (milestones: ProjectMilestone[]) => {
    const inProgressIdx = milestones.findIndex(m => m.status === 'in_progress');
    if (inProgressIdx >= 0) return inProgressIdx;
    
    const pendingIdx = milestones.findIndex(m => m.status === 'pending');
    if (pendingIdx >= 0) return pendingIdx;
    
    return milestones.length - 1; // All completed
  };

  const handleMilestoneClick = async (milestone: ProjectMilestone, milestones: ProjectMilestone[]) => {
    if (!canEdit) return;
    
    const milestoneIdx = milestones.findIndex(m => m.id === milestone.id);
    const currentIdx = getCurrentIndex(milestones);
    
    // Cannot click on completed milestones (no going back)
    if (milestone.status === 'completed') return;
    
    // Only allow clicking on current in-progress or the next pending milestone
    if (milestoneIdx > currentIdx + 1) return;
    
    // Determine next status based on current
    let newStatus: MilestoneStatus;
    if (milestone.status === 'pending') {
      newStatus = 'in_progress';
    } else if (milestone.status === 'in_progress') {
      newStatus = 'completed';
    } else {
      return; // Already completed - no action
    }
    
    try {
      await updateMilestoneStatus(milestone.id, newStatus);
      
      const statusLabel = newStatus === 'completed' ? 'completed' : 'started';
      const categoryLabel = milestone.category === 'frontend' ? '🌐 Frontend' : '⚙️ Backend';
      
      const updateContent = `${categoryLabel}: "${milestone.title}" ${statusLabel}`;
      await addUpdate(updateContent);
      
      toast.success(`Milestone ${statusLabel}`);
    } catch (error) {
      toast.error('Failed to update milestone');
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
            const isInProgress = milestone.status === 'in_progress';
            const isCurrent = idx === currentIdx;
            const isPast = idx < currentIdx || isCompleted;
            // Can only click if not completed and is current or next milestone
            const isClickable = canEdit && !isCompleted && idx <= currentIdx + 1;
            
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
                      isInProgress && "bg-primary border-primary ring-4 ring-primary/20",
                      !isCompleted && !isInProgress && isPast && "bg-muted-foreground border-muted-foreground",
                      !isCompleted && !isInProgress && !isPast && "bg-background border-muted-foreground/40",
                      isClickable && "hover:scale-125"
                    )}
                  >
                    {isCompleted && (
                      <Check className="h-2.5 w-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                    {isInProgress && (
                      <Loader2 className="h-2.5 w-2.5 text-primary-foreground animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  
                  {/* Label below dot - always visible */}
                  <span 
                    className={cn(
                      "absolute top-6 text-[10px] whitespace-nowrap max-w-[80px] truncate text-center",
                      isCompleted && "text-green-600 font-medium",
                      isInProgress && "text-primary font-semibold",
                      !isCompleted && !isInProgress && "text-muted-foreground"
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
                        isPast || isCompleted ? "bg-green-500" : "bg-muted-foreground/20"
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
  );
}
