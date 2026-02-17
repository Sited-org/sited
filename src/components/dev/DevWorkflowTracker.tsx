import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings2, Check, ChevronDown, ChevronUp, Loader2,
  Monitor, Server, Plug, Bot, Save, Database, Mail, Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const STAGE_DEFINITIONS: Record<string, any> = {
  frontend: { name: 'Customer-Facing Website', icon: Monitor, steps: ['Started', 'V1 Complete', 'Revision', 'Complete'] },
  backend: { name: 'Back End', icon: Server, steps: ['Started', 'V1 Complete', 'Shared', 'V2', 'Complete'] },
  crm_setup: { name: 'CRM Setup', icon: Database, steps: ['Planning', 'Configuration', 'Testing', 'Live'] },
  email_automation: { name: 'Email Automation', icon: Mail, steps: ['Template Design', 'Flow Setup', 'Testing', 'Active'] },
  integrations: { name: 'Integrations', icon: Plug, options: ['Emails', 'Stripe', 'Google Calendar'], stepsPerOption: ['Started', 'Integrated', 'Tested', 'Approved'] },
  ai: { name: 'AI Automations', icon: Bot, options: ['Chat-Bot', 'Assistant', 'Emails'], stepsPerOption: ['Started', 'Built', 'Tested', 'V1', 'Shared', 'Confirmed', 'Complete'] },
};

interface WorkflowData {
  configured: boolean;
  stages: Record<string, any>;
  stage_notes?: Record<string, string>;
  review_requested?: Record<string, boolean>;
}

interface DevWorkflowTrackerProps {
  lead: any;
  onLeadUpdate?: (updatedLead: any) => void;
}

export function DevWorkflowTracker({ lead, onLeadUpdate }: DevWorkflowTrackerProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  const [workflowData, setWorkflowData] = useState<WorkflowData>(() => {
    const saved = lead.workflow_data as WorkflowData | null;
    if (saved?.configured) return saved;
    return { configured: false, stages: {}, stage_notes: {}, review_requested: {} };
  });

  const calculateProgress = (): number => {
    if (!workflowData.configured) return 0;
    let total = 0, completed = 0;

    for (const [key, def] of Object.entries(STAGE_DEFINITIONS)) {
      const stage = workflowData.stages[key];
      if (!stage?.enabled) continue;

      if (def.steps) {
        total += def.steps.length;
        completed += stage.currentStep || 0;
      } else if (def.options && stage.selectedOptions) {
        total += stage.selectedOptions.length * def.stepsPerOption.length;
        stage.selectedOptions.forEach((opt: string) => {
          completed += stage.progress?.[opt] || 0;
        });
      }
    }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const saveWorkflow = async (data: WorkflowData) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ workflow_data: JSON.parse(JSON.stringify(data)) })
        .eq('id', lead.id);
      if (error) throw error;
      onLeadUpdate?.({ ...lead, workflow_data: data });
      toast({ title: 'Progress saved' });

      const progress = calculateProgress();
      if (progress > 0) {
        supabase.functions.invoke('send-milestone-email', {
          body: { lead_id: lead.id, progress },
        }).catch(err => console.error('Milestone email error:', err));
      }
    } catch (error: any) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepProgress = (stageKey: string, stepIndex: number, optionKey?: string) => {
    setWorkflowData(prev => {
      const newData = { ...prev, stages: { ...prev.stages } };
      if (optionKey) {
        const stage = { ...newData.stages[stageKey] };
        stage.progress = { ...stage.progress, [optionKey]: stepIndex + 1 };
        newData.stages[stageKey] = stage;
      } else {
        newData.stages[stageKey] = { ...newData.stages[stageKey], currentStep: stepIndex + 1 };
      }
      return newData;
    });
  };

  const handleNoteChange = (stageKey: string, value: string) => {
    setWorkflowData(prev => ({
      ...prev,
      stage_notes: { ...(prev.stage_notes || {}), [stageKey]: value },
    }));
  };

  const handleToggleReview = (stageKey: string) => {
    setWorkflowData(prev => ({
      ...prev,
      review_requested: {
        ...(prev.review_requested || {}),
        [stageKey]: !(prev.review_requested?.[stageKey]),
      },
    }));
  };

  const toggleExpand = (key: string) => {
    setExpandedStages(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const progress = calculateProgress();

  if (!workflowData.configured) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Settings2 className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">Workflow not configured yet</p>
          <p className="text-sm">An admin needs to configure the build stages for this project.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Build Progress
          </CardTitle>
          <Badge variant="secondary" className="text-sm">{progress}% Complete</Badge>
        </div>
        <Progress value={progress} className="mt-3" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(STAGE_DEFINITIONS).map(([stageKey, def]) => {
          const stage = workflowData.stages[stageKey];
          if (!stage?.enabled) return null;

          const Icon = def.icon;
          const reviewRequested = workflowData.review_requested?.[stageKey];
          const stageNote = workflowData.stage_notes?.[stageKey] || '';

          if (def.steps) {
            return (
              <div key={stageKey} className="space-y-2">
                <Collapsible open={expandedStages[stageKey]} onOpenChange={() => toggleExpand(stageKey)}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{def.name}</span>
                        <Badge variant={stage.currentStep >= def.steps.length ? "default" : "outline"} className="text-xs">
                          {stage.currentStep || 0}/{def.steps.length}
                        </Badge>
                        {reviewRequested && (
                          <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400">
                            <Eye className="h-3 w-3 mr-1" /> Review
                          </Badge>
                        )}
                      </div>
                      {expandedStages[stageKey] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-3">
                    <StepIndicator
                      steps={def.steps}
                      currentStep={stage.currentStep || 0}
                      onStepClick={(idx) => handleStepProgress(stageKey, idx)}
                    />
                    <div className="px-2 space-y-2">
                      <Textarea
                        placeholder="Build notes for this stage..."
                        value={stageNote}
                        onChange={(e) => handleNoteChange(stageKey, e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                      <Button
                        variant={reviewRequested ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleReview(stageKey)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {reviewRequested ? 'Review Requested' : 'Request Review'}
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          }

          // Multi-option stages (integrations, ai)
          if (!stage.selectedOptions || stage.selectedOptions.length === 0) return null;

          return (
            <div key={stageKey} className="space-y-2">
              <Collapsible open={expandedStages[stageKey]} onOpenChange={() => toggleExpand(stageKey)}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{def.name}</span>
                      <Badge variant="outline" className="text-xs">{stage.selectedOptions.length} items</Badge>
                      {reviewRequested && (
                        <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400">
                          <Eye className="h-3 w-3 mr-1" /> Review
                        </Badge>
                      )}
                    </div>
                    {expandedStages[stageKey] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {stage.selectedOptions.map((option: string) => (
                    <div key={option} className="ml-4">
                      <p className="text-xs text-muted-foreground mb-1">{option}</p>
                      <StepIndicator
                        steps={def.stepsPerOption}
                        currentStep={stage.progress?.[option] || 0}
                        onStepClick={(idx) => handleStepProgress(stageKey, idx, option)}
                      />
                    </div>
                  ))}
                  <div className="px-2 space-y-2">
                    <Textarea
                      placeholder="Build notes for this stage..."
                      value={stageNote}
                      onChange={(e) => handleNoteChange(stageKey, e.target.value)}
                      className="min-h-[60px] text-sm"
                    />
                    <Button
                      variant={reviewRequested ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleReview(stageKey)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {reviewRequested ? 'Review Requested' : 'Request Review'}
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}

        <Button onClick={() => saveWorkflow(workflowData)} disabled={isSaving} className="w-full mt-4">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Progress
        </Button>
      </CardContent>
    </Card>
  );
}

function StepIndicator({ steps, currentStep, onStepClick }: {
  steps: string[];
  currentStep: number;
  onStepClick?: (idx: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 p-2">
      {steps.map((step, idx) => {
        const isComplete = idx < currentStep;
        const isCurrent = idx === currentStep;
        return (
          <button
            key={step}
            onClick={() => onStepClick?.(idx)}
            disabled={!onStepClick}
            className={`
              flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors
              ${isComplete ? 'bg-green-500/20 text-green-700 dark:text-green-400' : ''}
              ${isCurrent ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500/50' : ''}
              ${!isComplete && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
              ${onStepClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
            `}
          >
            {isComplete && <Check className="h-3 w-3" />}
            {step}
          </button>
        );
      })}
    </div>
  );
}
