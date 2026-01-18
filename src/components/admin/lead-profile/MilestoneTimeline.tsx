import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Check, 
  Loader2, 
  Globe,
  Server,
  RotateCcw,
  ArrowRight,
  X
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
} from '@/hooks/useProjectMilestones';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';

interface MilestoneTimelineProps {
  leadId: string;
  lead: any;
  canEdit: boolean;
}

// Helper to determine if backend is needed based on form_data
function needsBackend(formData: any): boolean {
  if (!formData) return false;
  
  const formString = JSON.stringify(formData).toLowerCase();
  
  // Keywords that suggest backend needs
  const backendKeywords = [
    'backend',
    'database',
    'authentication',
    'login',
    'user account',
    'payment',
    'stripe',
    'api',
    'booking',
    'crm',
    'admin',
    'dashboard',
    'integration',
    'automation',
    'email automation',
    'membership',
    'subscription',
    'e-commerce',
    'ecommerce',
    'shop',
    'store',
    'cart',
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
    clearMilestones,
  } = useProjectMilestones(leadId);

  const { addUpdate } = useProjectUpdates(leadId);
  
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null);
  const [note, setNote] = useState('');
  const [isAdvancing, setIsAdvancing] = useState(false);

  const showBackendLine = hasBackendMilestones || needsBackend(lead.form_data);

  const handleMilestoneClick = (milestone: ProjectMilestone) => {
    if (!canEdit) return;
    
    // Determine the next status
    const statusOrder: MilestoneStatus[] = ['pending', 'in_progress', 'completed'];
    const currentIndex = statusOrder.indexOf(milestone.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const nextStatus = statusOrder[nextIndex];
    
    // If moving to completed or in_progress, show dialog for optional note
    if (nextStatus === 'completed' || nextStatus === 'in_progress') {
      setSelectedMilestone({ ...milestone, status: nextStatus } as ProjectMilestone);
      setNote('');
      setAdvanceDialogOpen(true);
    } else {
      // If going back to pending, just update directly
      updateMilestoneStatus(milestone.id, nextStatus);
    }
  };

  const handleAdvanceMilestone = async () => {
    if (!selectedMilestone) return;
    
    setIsAdvancing(true);
    
    try {
      // Update milestone status
      await updateMilestoneStatus(selectedMilestone.id, selectedMilestone.status);
      
      // Create a project update with the note (or default message)
      const statusLabel = selectedMilestone.status === 'completed' ? 'completed' : 'started';
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
      await updateMilestoneStatus(selectedMilestone.id, selectedMilestone.status);
      setAdvanceDialogOpen(false);
      setSelectedMilestone(null);
      setNote('');
    } finally {
      setIsAdvancing(false);
    }
  };

  const MilestoneDot = ({ 
    milestone, 
    index, 
    total 
  }: { 
    milestone: ProjectMilestone; 
    index: number; 
    total: number;
  }) => {
    const isCompleted = milestone.status === 'completed';
    const isInProgress = milestone.status === 'in_progress';
    
    // Calculate which milestone is the "current" one (first non-completed)
    const isCurrent = isInProgress;
    
    return (
      <div className="flex flex-col items-center relative group">
        {/* Dot */}
        <button
          onClick={() => handleMilestoneClick(milestone)}
          disabled={!canEdit}
          className={`
            w-4 h-4 rounded-full border-2 transition-all z-10 relative
            ${isCompleted 
              ? 'bg-green-500 border-green-500' 
              : isInProgress 
                ? 'bg-primary border-primary animate-pulse'
                : 'bg-background border-muted-foreground/30 hover:border-muted-foreground/60'
            }
            ${canEdit ? 'cursor-pointer hover:scale-125' : 'cursor-default'}
          `}
          title={`${milestone.title} (${milestone.status})`}
        >
          {isCompleted && (
            <Check className="h-2.5 w-2.5 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          )}
          {isInProgress && (
            <Loader2 className="h-2.5 w-2.5 text-primary-foreground animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          )}
        </button>
        
        {/* Tooltip on hover */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
          <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border">
            {milestone.title}
          </div>
        </div>
        
        {/* Current indicator */}
        {isCurrent && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
              Current
            </Badge>
          </div>
        )}
      </div>
    );
  };

  const TimelineLine = ({ 
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
    if (milestones.length === 0) {
      // Show initialize button if no milestones
      if (category === 'frontend' && canEdit) {
        return (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-24 shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={initializeFrontendMilestones}
              className="h-7 text-xs"
            >
              Start Project
            </Button>
          </div>
        );
      }
      return null;
    }

    const completedCount = milestones.filter(m => m.status === 'completed').length;
    const progressPercent = (completedCount / milestones.length) * 100;

    return (
      <div className="flex items-center gap-3">
        {/* Label */}
        <div className="flex items-center gap-2 w-24 shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        
        {/* Timeline */}
        <div className="flex-1 relative">
          {/* Background line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted-foreground/20 transform -translate-y-1/2" />
          
          {/* Progress line */}
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-green-500 transform -translate-y-1/2 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
          
          {/* Dots */}
          <div className="relative flex justify-between items-center py-4">
            {milestones.map((milestone, index) => (
              <MilestoneDot 
                key={milestone.id} 
                milestone={milestone} 
                index={index}
                total={milestones.length}
              />
            ))}
          </div>
        </div>
        
        {/* Percentage */}
        <div className="w-12 text-right shrink-0">
          <span className="text-xs font-medium text-muted-foreground">
            {Math.round(progressPercent)}%
          </span>
        </div>
        
        {/* Reset button */}
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => clearMilestones(category)}
            title={`Reset ${label} milestones`}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-muted/30 rounded-lg p-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-muted/30 rounded-lg p-4 space-y-6">
        {/* Frontend Timeline */}
        <TimelineLine 
          milestones={frontendMilestones} 
          category="frontend"
          icon={Globe} 
          label="Frontend" 
        />
        
        {/* Backend Timeline - only show if backend is needed or already has milestones */}
        {showBackendLine && (
          <TimelineLine 
            milestones={backendMilestones} 
            category="backend"
            icon={Server} 
            label="Backend" 
          />
        )}
        
        {/* No milestones at all */}
        {!hasFrontendMilestones && !hasBackendMilestones && !canEdit && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Project milestones will appear here once development begins
          </div>
        )}
      </div>

      {/* Advance Milestone Dialog */}
      <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMilestone?.status === 'completed' ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Loader2 className="h-5 w-5 text-primary" />
              )}
              {selectedMilestone?.status === 'completed' ? 'Complete Milestone' : 'Start Milestone'}
            </DialogTitle>
            <DialogDescription>
              {selectedMilestone?.status === 'completed' 
                ? `Mark "${selectedMilestone?.title}" as complete` 
                : `Start working on "${selectedMilestone?.title}"`
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
                placeholder="e.g., 'First draft ready for review. Please check the homepage hero section...'"
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
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {selectedMilestone?.status === 'completed' ? 'Complete & Post Update' : 'Start & Post Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}