import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Check, 
  Circle, 
  Clock, 
  Loader2, 
  Play, 
  Rocket, 
  Server, 
  Globe,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  useProjectMilestones, 
  ProjectMilestone, 
  MilestoneStatus,
  BACKEND_FEATURE_OPTIONS 
} from '@/hooks/useProjectMilestones';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ProjectMilestonesProps {
  leadId: string;
  canEdit: boolean;
}

export function ProjectMilestones({ leadId, canEdit }: ProjectMilestonesProps) {
  const {
    frontendMilestones,
    backendMilestones,
    hasFrontendMilestones,
    hasBackendMilestones,
    frontendProgress,
    backendProgress,
    loading,
    initializeFrontendMilestones,
    initializeBackendMilestones,
    updateMilestoneStatus,
    clearMilestones,
  } = useProjectMilestones(leadId);

  const [selectedBackendFeatures, setSelectedBackendFeatures] = useState<string[]>([]);
  const [showBackendSetup, setShowBackendSetup] = useState(false);
  const [frontendExpanded, setFrontendExpanded] = useState(true);
  const [backendExpanded, setBackendExpanded] = useState(true);

  const handleFeatureToggle = (feature: string) => {
    setSelectedBackendFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleInitializeBackend = () => {
    initializeBackendMilestones(selectedBackendFeatures);
    setShowBackendSetup(false);
    setSelectedBackendFeatures([]);
  };

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500';
      case 'in_progress':
        return 'bg-primary text-primary-foreground border-primary';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const cycleStatus = (milestone: ProjectMilestone) => {
    if (!canEdit) return;
    
    const statusOrder: MilestoneStatus[] = ['pending', 'in_progress', 'completed'];
    const currentIndex = statusOrder.indexOf(milestone.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    updateMilestoneStatus(milestone.id, nextStatus);
  };

  const MilestoneStep = ({ milestone, index, total }: { milestone: ProjectMilestone; index: number; total: number }) => {
    const isLast = index === total - 1;
    
    return (
      <div className="flex gap-3">
        {/* Timeline */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => cycleStatus(milestone)}
            disabled={!canEdit}
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${getStatusColor(milestone.status)} ${canEdit ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          >
            {getStatusIcon(milestone.status)}
          </button>
          {!isLast && (
            <div className={`w-0.5 flex-1 min-h-8 ${milestone.status === 'completed' ? 'bg-green-500' : 'bg-border'}`} />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-medium ${milestone.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'}`}>
              {milestone.title}
            </span>
            {milestone.status === 'in_progress' && (
              <Badge variant="secondary" className="text-xs">In Progress</Badge>
            )}
          </div>
          {milestone.description && (
            <p className="text-sm text-muted-foreground">{milestone.description}</p>
          )}
          {milestone.completed_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Completed {format(new Date(milestone.completed_at), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Frontend Progress */}
      <Card>
        <Collapsible open={frontendExpanded} onOpenChange={setFrontendExpanded}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">Website Development</CardTitle>
                    <CardDescription className="text-sm">Frontend build progress</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasFrontendMilestones && (
                    <div className="flex items-center gap-2">
                      <Progress value={frontendProgress} className="w-24 h-2" />
                      <span className="text-sm font-medium text-muted-foreground">{frontendProgress}%</span>
                    </div>
                  )}
                  {frontendExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {hasFrontendMilestones ? (
                <div className="space-y-2">
                  {frontendMilestones.map((milestone, index) => (
                    <MilestoneStep 
                      key={milestone.id} 
                      milestone={milestone} 
                      index={index}
                      total={frontendMilestones.length}
                    />
                  ))}
                  
                  {canEdit && (
                    <div className="pt-4 border-t flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => clearMilestones('frontend')}
                        className="text-destructive hover:text-destructive"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Milestones
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Globe className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No frontend milestones set up yet</p>
                  {canEdit && (
                    <Button onClick={initializeFrontendMilestones}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Frontend Build
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Backend Progress */}
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
                  {hasBackendMilestones && (
                    <div className="flex items-center gap-2">
                      <Progress value={backendProgress} className="w-24 h-2" />
                      <span className="text-sm font-medium text-muted-foreground">{backendProgress}%</span>
                    </div>
                  )}
                  {backendExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {hasBackendMilestones ? (
                <div className="space-y-2">
                  {backendMilestones.map((milestone, index) => (
                    <MilestoneStep 
                      key={milestone.id} 
                      milestone={milestone} 
                      index={index}
                      total={backendMilestones.length}
                    />
                  ))}
                  
                  {canEdit && (
                    <div className="pt-4 border-t flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => clearMilestones('backend')}
                        className="text-destructive hover:text-destructive"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Milestones
                      </Button>
                    </div>
                  )}
                </div>
              ) : showBackendSetup ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Select Required Backend Features
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {BACKEND_FEATURE_OPTIONS.map(feature => (
                        <label 
                          key={feature}
                          className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedBackendFeatures.includes(feature)}
                            onCheckedChange={() => handleFeatureToggle(feature)}
                          />
                          <span className="text-sm">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowBackendSetup(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInitializeBackend}>
                      <Rocket className="h-4 w-4 mr-2" />
                      Initialize Backend
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Server className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No backend required or not set up yet</p>
                  {canEdit && (
                    <Button variant="outline" onClick={() => setShowBackendSetup(true)}>
                      <Server className="h-4 w-4 mr-2" />
                      Add Backend
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
