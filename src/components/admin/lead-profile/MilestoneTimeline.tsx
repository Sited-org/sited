import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Check, 
  Loader2, 
  Globe,
  Server,
  ChevronRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  useProjectMilestones, 
  ProjectMilestone, 
  MilestoneStatus,
  FRONTEND_MILESTONES,
} from '@/hooks/useProjectMilestones';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import { cn } from '@/lib/utils';

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
  
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null);
  const [nextStatus, setNextStatus] = useState<MilestoneStatus>('in_progress');
  const [note, setNote] = useState('');
  const [isAdvancing, setIsAdvancing] = useState(false);
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

  const handleMilestoneClick = (milestone: ProjectMilestone, milestones: ProjectMilestone[]) => {
    if (!canEdit) return;
    
    const milestoneIdx = milestones.findIndex(m => m.id === milestone.id);
    const currentIdx = getCurrentIndex(milestones);
    
    // Only allow clicking on current or previous milestones
    if (milestoneIdx > currentIdx + 1) return;
    
    // Determine next status based on current
    let newStatus: MilestoneStatus;
    if (milestone.status === 'pending') {
      newStatus = 'in_progress';
    } else if (milestone.status === 'in_progress') {
      newStatus = 'completed';
    } else {
      // Already completed - clicking goes back to in_progress
      newStatus = 'in_progress';
    }
    
    setSelectedMilestone(milestone);
    setNextStatus(newStatus);
    setNote('');
    setAdvanceDialogOpen(true);
  };

  const handleAdvanceMilestone = async () => {
    if (!selectedMilestone) return;
    
    setIsAdvancing(true);
    
    try {
      await updateMilestoneStatus(selectedMilestone.id, nextStatus);
      
      const statusLabel = nextStatus === 'completed' ? 'completed' : 
                         nextStatus === 'in_progress' ? 'started' : 'reset';
      const categoryLabel = selectedMilestone.category === 'frontend' ? '🌐 Frontend' : '⚙️ Backend';
      
      let updateContent = `${categoryLabel}: "${selectedMilestone.title}" ${statusLabel}`;
      if (note.trim()) {
        updateContent += `\n\n${note.trim()}`;
      }
      
      await addUpdate(updateContent);
      
      setAdvanceDialogOpen(false);
      setSelectedMilestone(null);
      setNote('');
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleSkipNote = async () => {
    if (!selectedMilestone) return;
    
    setIsAdvancing(true);
    
    try {
      await updateMilestoneStatus(selectedMilestone.id, nextStatus);
      setAdvanceDialogOpen(false);
      setSelectedMilestone(null);
      setNote('');
    } finally {
      setIsAdvancing(false);
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
        <div className="relative flex items-center">
          {milestones.map((milestone, idx) => {
            const isCompleted = milestone.status === 'completed';
            const isInProgress = milestone.status === 'in_progress';
            const isCurrent = idx === currentIdx;
            const isPast = idx < currentIdx || isCompleted;
            const isClickable = canEdit && idx <= currentIdx + 1;
            
            return (
              <div key={milestone.id} className="flex items-center flex-1 last:flex-none">
                {/* Stop/Station */}
                <button
                  onClick={() => handleMilestoneClick(milestone, milestones)}
                  disabled={!isClickable}
                  className={cn(
                    "relative flex flex-col items-center group",
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
                  
                  {/* Label below dot */}
                  <span 
                    className={cn(
                      "absolute top-6 text-[10px] whitespace-nowrap max-w-[60px] truncate text-center",
                      isCurrent ? "text-foreground font-medium" : "text-muted-foreground",
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      isCurrent && "opacity-100"
                    )}
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

      {/* Advance Milestone Dialog */}
      <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {nextStatus === 'completed' ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : nextStatus === 'in_progress' ? (
                <Loader2 className="h-5 w-5 text-primary" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
              {nextStatus === 'completed' ? 'Complete Milestone' : 
               nextStatus === 'in_progress' ? 'Start Milestone' : 'Update Milestone'}
            </DialogTitle>
            <DialogDescription>
              {nextStatus === 'completed' 
                ? `Mark "${selectedMilestone?.title}" as complete` 
                : nextStatus === 'in_progress'
                ? `Start working on "${selectedMilestone?.title}"`
                : `Update "${selectedMilestone?.title}"`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">
                Add a note (optional)
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                This will be posted to Project Progress for the client to see
              </p>
              <Textarea
                placeholder="e.g., 'First draft ready for review...'"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              onClick={handleSkipNote}
              disabled={isAdvancing}
            >
              Skip Note
            </Button>
            <Button 
              onClick={handleAdvanceMilestone}
              disabled={isAdvancing}
            >
              {isAdvancing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              {note.trim() ? 'Update & Post' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
