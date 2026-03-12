import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CheckCircle2, Lock, Circle, ChevronRight, ChevronDown,
  Eye, EyeOff, Globe, SkipForward, ExternalLink, FileText, FileDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BuildFlow, BuildPhase, BuildStep } from '@/hooks/useBuildFlow';
import { StepCompleteModal } from './StepCompleteModal';
import { DiscoveryAnswersDialog } from './DiscoveryAnswersDialog';
import { ProposalGenerator } from './ProposalGenerator';

interface BuildFlowViewProps {
  buildFlow: BuildFlow;
  phases: BuildPhase[];
  canEdit: boolean;
  userId?: string;
  onMarkComplete: (step: BuildStep, description: string, screenshotUrl?: string | null, userId?: string) => Promise<void>;
  onSkipStep: (stepId: string) => Promise<void>;
  onToggleClientView: () => Promise<void>;
}

export function BuildFlowView({
  buildFlow,
  phases,
  canEdit,
  userId,
  onMarkComplete,
  onSkipStep,
  onToggleClientView,
}: BuildFlowViewProps) {
  const [activePhaseId, setActivePhaseId] = useState<string | null>(
    phases.find(p => !p.is_completed && !p.is_locked && !p.is_skipped)?.id || phases[0]?.id || null
  );
  const [completingStep, setCompletingStep] = useState<BuildStep | null>(null);
  const [showDiscoveryAnswers, setShowDiscoveryAnswers] = useState(false);
  const [showProposalGenerator, setShowProposalGenerator] = useState(false);

  const activePhase = phases.find(p => p.id === activePhaseId);

  const getPhaseProgress = (phase: BuildPhase) => {
    const total = phase.steps.filter(s => !s.is_skipped).length;
    const done = phase.steps.filter(s => s.is_completed || s.is_skipped).length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const getPhaseIcon = (phase: BuildPhase) => {
    if (phase.is_skipped) return <SkipForward className="h-4 w-4 text-muted-foreground" />;
    if (phase.is_completed) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (phase.is_locked) return <Lock className="h-4 w-4 text-muted-foreground" />;
    return <Circle className="h-4 w-4 text-primary" />;
  };

  const getStepStatusColor = (step: BuildStep) => {
    if (step.is_skipped) return 'border-muted bg-muted/30';
    if (step.is_completed) return 'border-green-500/30 bg-green-500/5';
    if (step.is_locked) return 'border-border bg-muted/20 opacity-60';
    return 'border-border hover:border-primary/50';
  };

  // Check if a step is the discovery_call step (P1S1) - show answers dialog instead of normal expand
  const isDiscoveryStep = (step: BuildStep) => step.step_key === 'discovery_call';
  // Check if a step is the proposal step (P1S2) - show proposal generator
  const isProposalStep = (step: BuildStep) => step.step_key === 'proposal_sent';

  // Derive business name from staging URL
  const businessName = buildFlow.staging_url
    ? buildFlow.staging_url.replace('.sited.co', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Client';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Build Flow</h2>
          <Badge variant={buildFlow.is_live ? 'default' : 'secondary'}>
            {buildFlow.is_live ? 'Live' : buildFlow.status}
          </Badge>
          {buildFlow.staging_url && (
            <a
              href={`https://${buildFlow.staging_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <Globe className="h-3 w-3" />
              {buildFlow.staging_url}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Label htmlFor="client-view" className="text-sm text-muted-foreground">Client View</Label>
            <Switch
              id="client-view"
              checked={buildFlow.client_view_enabled}
              onCheckedChange={onToggleClientView}
            />
            {buildFlow.client_view_enabled ? (
              <Eye className="h-4 w-4 text-green-500" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Phase Navigation */}
        <div className="lg:col-span-1 space-y-1">
          {phases.map(phase => {
            const progress = getPhaseProgress(phase);
            const isActive = phase.id === activePhaseId;
            return (
              <button
                key={phase.id}
                onClick={() => setActivePhaseId(phase.id)}
                disabled={phase.is_locked}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  isActive ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50',
                  phase.is_locked && 'opacity-50 cursor-not-allowed',
                  phase.is_skipped && 'line-through opacity-40'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getPhaseIcon(phase)}
                  <span className="text-xs font-medium text-muted-foreground">Phase {phase.phase_number}</span>
                </div>
                <p className="text-sm font-medium truncate">{phase.title}</p>
                {!phase.is_locked && !phase.is_skipped && (
                  <Progress value={progress} className="h-1 mt-2" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Phase Detail */}
        <div className="lg:col-span-3">
          {activePhase ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Phase {activePhase.phase_number}: {activePhase.title}
                    </CardTitle>
                    {activePhase.description && (
                      <p className="text-sm text-muted-foreground mt-1">{activePhase.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{getPhaseProgress(activePhase)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {activePhase.steps.filter(s => s.is_completed).length}/{activePhase.steps.filter(s => !s.is_skipped).length} steps
                    </p>
                  </div>
                </div>
                <Progress value={getPhaseProgress(activePhase)} className="h-2 mt-3" />
              </CardHeader>
              <CardContent className="space-y-2">
                {activePhase.steps.map(step => (
                  <Collapsible key={step.id}>
                    <div className={cn('rounded-lg border p-3 transition-colors', getStepStatusColor(step))}>
                      <CollapsibleTrigger className="w-full" onClick={(e) => {
                        // For completed discovery step, open the answers dialog instead
                        if (isDiscoveryStep(step) && step.is_completed) {
                          e.preventDefault();
                          setShowDiscoveryAnswers(true);
                        }
                      }}>
                        <div className="flex items-center gap-3">
                          {step.is_completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          ) : step.is_locked ? (
                            <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                          ) : step.is_skipped ? (
                            <SkipForward className="h-5 w-5 text-muted-foreground shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                          )}
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className={cn('text-sm font-medium', step.is_skipped && 'line-through text-muted-foreground')}>
                                {step.step_number}. {step.title}
                              </span>
                              {!step.is_required && (
                                <Badge variant="outline" className="text-xs">Optional</Badge>
                              )}
                              {isDiscoveryStep(step) && step.is_completed && (
                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                  <FileText className="h-3 w-3" /> View Answers
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-90" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-3 pl-8 space-y-3">
                          {step.description && (
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          )}
                          {step.guidance && (
                            <div className="bg-muted/50 rounded-lg p-3 text-sm">
                              <p className="font-medium text-xs text-muted-foreground mb-1">Guidance</p>
                              {step.guidance}
                            </div>
                          )}
                          {step.completion && (
                            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 space-y-2">
                              <p className="text-sm">{step.completion.description}</p>
                              {step.completion.screenshot_url && (
                                <img
                                  src={step.completion.screenshot_url}
                                  alt="Completion screenshot"
                                  className="rounded-lg max-h-48 object-cover"
                                />
                              )}
                              <p className="text-xs text-muted-foreground">
                                Completed {new Date(step.completion.completed_at).toLocaleDateString()}
                              </p>
                            </div>
                          )}

                          {/* Special: Proposal step - show generate button if not completed */}
                          {isProposalStep(step) && !step.is_completed && !step.is_locked && canEdit && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setShowProposalGenerator(true)}>
                                <FileDown className="h-4 w-4 mr-1" /> Generate Proposal
                              </Button>
                              <Button size="sm" onClick={() => setCompletingStep(step)}>
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Complete
                              </Button>
                              {!step.is_required && (
                                <Button size="sm" variant="outline" onClick={() => onSkipStep(step.id)}>
                                  <SkipForward className="h-4 w-4 mr-1" /> Skip
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Normal actions for non-special steps */}
                          {!isProposalStep(step) && canEdit && !step.is_completed && !step.is_locked && !step.is_skipped && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => setCompletingStep(step)}>
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Complete
                              </Button>
                              {!step.is_required && (
                                <Button size="sm" variant="outline" onClick={() => onSkipStep(step.id)}>
                                  <SkipForward className="h-4 w-4 mr-1" /> Skip
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a phase to view steps
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Step Complete Modal */}
      {completingStep && (
        <StepCompleteModal
          step={completingStep}
          buildFlowId={buildFlow.id}
          onClose={() => setCompletingStep(null)}
          onComplete={async (desc, screenshotUrl) => {
            await onMarkComplete(completingStep, desc, screenshotUrl, userId);
            setCompletingStep(null);
          }}
        />
      )}

      {/* Discovery Answers Dialog */}
      <DiscoveryAnswersDialog
        buildFlowId={buildFlow.id}
        open={showDiscoveryAnswers}
        onOpenChange={setShowDiscoveryAnswers}
      />

      {/* Proposal Generator Dialog */}
      <ProposalGenerator
        buildFlowId={buildFlow.id}
        leadId={buildFlow.lead_id}
        businessName={businessName}
        open={showProposalGenerator}
        onOpenChange={setShowProposalGenerator}
      />
    </div>
  );
}
