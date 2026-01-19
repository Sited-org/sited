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
    return milestones.length - 1;
  };

  const handleMilestoneClick = (milestone: ProjectMilestone, milestones: ProjectMilestone[]) => {
    if (!canEdit) return;
    
    const milestoneIdx = milestones.findIndex(m => m.id === milestone.id);
    const currentIdx = getCurrentIndex(milestones);
    
    if (milestone.status === 'completed') return;
    if (milestoneIdx !== currentIdx) return;
    
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

  // Milestone stop component
  const MilestoneStop = ({ 
    milestone, 
    milestones, 
    idx, 
    currentIdx,
  }: { 
    milestone: ProjectMilestone; 
    milestones: ProjectMilestone[];
    idx: number;
    currentIdx: number;
  }) => {
    const isCompleted = milestone.status === 'completed';
    const isCurrent = idx === currentIdx && !isCompleted;
    const isClickable = canEdit && !isCompleted && idx === currentIdx;

    return (
      <button
        onClick={() => handleMilestoneClick(milestone, milestones)}
        disabled={!isClickable}
        className={cn(
          "relative flex flex-col items-center shrink-0",
          isClickable ? "cursor-pointer" : "cursor-default"
        )}
      >
        <div
          className={cn(
            "w-4 h-4 rounded-full border-2 transition-all z-10 relative",
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
        
        <span 
          className={cn(
            "absolute top-6 text-[10px] whitespace-nowrap text-center",
            isCompleted && "text-green-600 font-medium",
            isCurrent && "text-primary font-semibold",
            !isCompleted && !isCurrent && "text-muted-foreground"
          )}
        >
          {milestone.title}
        </span>
      </button>
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
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        
        <div className="relative pt-1 pb-8">
          {/* Background rail */}
          <div className="absolute top-[9px] left-2 right-2 h-0.5 bg-muted-foreground/20" />
          
          {/* Progress rail */}
          {completedCount > 0 && (
            <div 
              className="absolute top-[9px] left-2 h-0.5 bg-green-500 transition-all"
              style={{ 
                width: `calc(${(completedCount / milestones.length) * 100}% - 16px)` 
              }}
            />
          )}
          
          <div className="relative flex justify-between">
            {milestones.map((milestone, idx) => (
              <MilestoneStop
                key={milestone.id}
                milestone={milestone}
                milestones={milestones}
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
    
    const splitAt = 5;
    const firstRow = milestones.slice(0, splitAt);
    const secondRow = milestones.slice(splitAt);
    const hasSecondRow = secondRow.length > 0;

    const completedInFirstRow = firstRow.filter(m => m.status === 'completed').length;
    const allFirstRowComplete = completedInFirstRow === firstRow.length;
    const completedInSecondRow = secondRow.filter(m => m.status === 'completed').length;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        
        <div className="relative">
          {/* First Row */}
          <div className="relative pt-1 pb-8 mr-10">
            {/* Background rail */}
            <div className="absolute top-[9px] left-2 right-0 h-0.5 bg-muted-foreground/20" />
            
            {/* Progress rail */}
            {completedInFirstRow > 0 && (
              <div 
                className="absolute top-[9px] left-2 h-0.5 bg-green-500 transition-all"
                style={{ 
                  width: allFirstRowComplete 
                    ? 'calc(100% - 8px)' 
                    : `calc(${(completedInFirstRow / firstRow.length) * 100}% - 16px)` 
                }}
              />
            )}
            
            <div className="relative flex justify-between">
              {firstRow.map((milestone, idx) => (
                <MilestoneStop
                  key={milestone.id}
                  milestone={milestone}
                  milestones={milestones}
                  idx={idx}
                  currentIdx={currentIdx}
                />
              ))}
            </div>
          </div>

          {/* U-Turn Connector SVG */}
          {hasSecondRow && (
            <svg 
              className="absolute right-0 top-[9px]" 
              width="40" 
              height="64" 
              viewBox="0 0 40 64"
              fill="none"
            >
              {/* Background connector */}
              <path 
                d="M0 1 L12 1 Q28 1 28 17 L28 47 Q28 63 12 63 L0 63" 
                stroke="hsl(var(--muted-foreground) / 0.2)" 
                strokeWidth="2" 
                strokeLinecap="round"
                fill="none"
              />
              
              {/* Progress connector */}
              {allFirstRowComplete && (
                <path 
                  d="M0 1 L12 1 Q28 1 28 17 L28 47 Q28 63 12 63 L0 63" 
                  stroke="#22c55e" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </svg>
          )}

          {/* Second Row */}
          {hasSecondRow && (
            <div className="relative pt-1 pb-8 ml-10">
              {/* Background rail */}
              <div className="absolute top-[9px] left-0 right-2 h-0.5 bg-muted-foreground/20" />
              
              {/* Progress rail */}
              {completedInSecondRow > 0 && (
                <div 
                  className="absolute top-[9px] left-0 h-0.5 bg-green-500 transition-all"
                  style={{ 
                    width: `calc(${(completedInSecondRow / secondRow.length) * 100}% - 8px)` 
                  }}
                />
              )}
              
              <div className="relative flex justify-between">
                {secondRow.map((milestone, idx) => {
                  const actualIdx = splitAt + idx;
                  return (
                    <MilestoneStop
                      key={milestone.id}
                      milestone={milestone}
                      milestones={milestones}
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

  // Mobile progress bars (simpler view)
  const MobileProgressView = () => {
    const frontendCompleted = frontendMilestones.filter(m => m.status === 'completed').length;
    const backendCompleted = backendMilestones.filter(m => m.status === 'completed').length;

    return (
      <div className="space-y-4">
        {hasFrontendMilestones && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Frontend</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {frontendCompleted}/{frontendMilestones.length}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(frontendCompleted / frontendMilestones.length) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        {showBackendLine && hasBackendMilestones && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Backend</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {backendCompleted}/{backendMilestones.length}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(backendCompleted / backendMilestones.length) * 100}%` }}
              />
            </div>
          </div>
        )}
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
      {/* Desktop view */}
      <div className="hidden md:block bg-muted/30 rounded-lg p-4 space-y-6">
        <TrainRailTimeline 
          milestones={frontendMilestones} 
          icon={Globe} 
          label="Frontend" 
        />
        
        {showBackendLine && hasBackendMilestones && (
          <WrappingTrainRailTimeline 
            milestones={backendMilestones} 
            icon={Server} 
            label="Backend" 
          />
        )}
      </div>

      {/* Mobile view */}
      <div className="md:hidden bg-muted/30 rounded-lg p-4">
        <MobileProgressView />
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
