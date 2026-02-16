import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Globe, CheckCircle2, ExternalLink, TrendingUp, Monitor, Server, Plug, Bot, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Must match admin WorkflowTracker definitions
const STAGE_DEFINITIONS = {
  frontend: {
    name: 'Front End',
    icon: Monitor,
    color: 'text-blue-500',
    steps: ['Started', 'V1 Complete', 'Revision', 'Complete'],
  },
  backend: {
    name: 'Back End',
    icon: Server,
    color: 'text-green-500',
    steps: ['Started', 'V1 Complete', 'Shared', 'V2', 'Complete'],
  },
  integrations: {
    name: 'Integrations',
    icon: Plug,
    color: 'text-purple-500',
    stepsPerOption: ['Started', 'Integrated', 'Tested', 'Approved'],
  },
  ai: {
    name: 'AI Automations',
    icon: Bot,
    color: 'text-orange-500',
    stepsPerOption: ['Started', 'Built', 'Tested', 'V1', 'Shared', 'Confirmed', 'Complete'],
  },
};

interface WorkflowData {
  configured: boolean;
  stages: {
    frontend?: { enabled: boolean; currentStep: number };
    backend?: { enabled: boolean; currentStep: number };
    integrations?: { enabled: boolean; selectedOptions: string[]; progress: Record<string, number> };
    ai?: { enabled: boolean; selectedOptions: string[]; progress: Record<string, number> };
  };
}

interface WebsiteTabProps {
  leadId: string;
  websiteUrl?: string;
  workflowData?: any;
}

export function WebsiteTab({ leadId, websiteUrl, workflowData }: WebsiteTabProps) {
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  const parsedWorkflow = workflowData as WorkflowData | null;

  const progress = useMemo(() => {
    if (!parsedWorkflow?.configured) return null;
    const stages = parsedWorkflow.stages;
    let total = 0, completed = 0;

    if (stages.frontend?.enabled) {
      total += STAGE_DEFINITIONS.frontend.steps.length;
      completed += stages.frontend.currentStep;
    }
    if (stages.backend?.enabled) {
      total += STAGE_DEFINITIONS.backend.steps.length;
      completed += stages.backend.currentStep;
    }
    if (stages.integrations?.enabled) {
      const opts = stages.integrations.selectedOptions;
      total += opts.length * STAGE_DEFINITIONS.integrations.stepsPerOption.length;
      opts.forEach(o => { completed += stages.integrations?.progress[o] || 0; });
    }
    if (stages.ai?.enabled) {
      const opts = stages.ai.selectedOptions;
      total += opts.length * STAGE_DEFINITIONS.ai.stepsPerOption.length;
      opts.forEach(o => { completed += stages.ai?.progress[o] || 0; });
    }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [parsedWorkflow]);

  const toggleExpand = (key: string) => {
    setExpandedStages(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getPreviewImageUrl = (url: string) => {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    return `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
  };

  return (
    <div className="space-y-6">
      {/* Project Progress */}
      {progress !== null && parsedWorkflow?.configured && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Development Progress
            </CardTitle>
            <CardDescription>
              Your website development is {progress}% complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Completion</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              {progress === 100 && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Your project is complete!</span>
                </div>
              )}
            </div>

            {/* Stage breakdown */}
            <div className="space-y-2 pt-2">
              {/* Frontend */}
              {parsedWorkflow.stages.frontend?.enabled && (
                <ReadOnlyStage
                  title={STAGE_DEFINITIONS.frontend.name}
                  icon={<Monitor className="h-4 w-4 text-blue-500" />}
                  steps={STAGE_DEFINITIONS.frontend.steps}
                  currentStep={parsedWorkflow.stages.frontend.currentStep}
                  expanded={expandedStages.frontend}
                  onToggle={() => toggleExpand('frontend')}
                />
              )}

              {/* Backend */}
              {parsedWorkflow.stages.backend?.enabled && (
                <ReadOnlyStage
                  title={STAGE_DEFINITIONS.backend.name}
                  icon={<Server className="h-4 w-4 text-green-500" />}
                  steps={STAGE_DEFINITIONS.backend.steps}
                  currentStep={parsedWorkflow.stages.backend.currentStep}
                  expanded={expandedStages.backend}
                  onToggle={() => toggleExpand('backend')}
                />
              )}

              {/* Integrations */}
              {parsedWorkflow.stages.integrations?.enabled && parsedWorkflow.stages.integrations.selectedOptions.length > 0 && (
                <Collapsible open={expandedStages.integrations} onOpenChange={() => toggleExpand('integrations')}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-2">
                        <Plug className="h-4 w-4 text-purple-500" />
                        <span className="font-medium text-sm">Integrations</span>
                        <Badge variant="outline" className="text-xs">
                          {parsedWorkflow.stages.integrations.selectedOptions.length} items
                        </Badge>
                      </div>
                      {expandedStages.integrations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {parsedWorkflow.stages.integrations.selectedOptions.map(option => (
                      <div key={option} className="ml-4">
                        <p className="text-xs text-muted-foreground mb-1">{option}</p>
                        <ReadOnlySteps
                          steps={STAGE_DEFINITIONS.integrations.stepsPerOption}
                          currentStep={parsedWorkflow.stages.integrations?.progress[option] || 0}
                        />
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* AI */}
              {parsedWorkflow.stages.ai?.enabled && parsedWorkflow.stages.ai.selectedOptions.length > 0 && (
                <Collapsible open={expandedStages.ai} onOpenChange={() => toggleExpand('ai')}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-sm">AI Automations</span>
                        <Badge variant="outline" className="text-xs">
                          {parsedWorkflow.stages.ai.selectedOptions.length} items
                        </Badge>
                      </div>
                      {expandedStages.ai ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {parsedWorkflow.stages.ai.selectedOptions.map(option => (
                      <div key={option} className="ml-4">
                        <p className="text-xs text-muted-foreground mb-1">{option}</p>
                        <ReadOnlySteps
                          steps={STAGE_DEFINITIONS.ai.stepsPerOption}
                          currentStep={parsedWorkflow.stages.ai?.progress[option] || 0}
                        />
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Website URL */}
      {websiteUrl && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Your Website
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <a 
              href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="relative rounded-lg overflow-hidden border bg-muted/30">
                <AspectRatio ratio={16/9}>
                  <img
                    src={getPreviewImageUrl(websiteUrl)}
                    alt={`Preview of ${websiteUrl}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-full p-3">
                      <ExternalLink className="h-5 w-5" />
                    </div>
                  </div>
                </AspectRatio>
              </div>
            </a>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground truncate flex-1 mr-2">{websiteUrl}</span>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Site
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReadOnlyStage({ title, icon, steps, currentStep, expanded, onToggle }: {
  title: string;
  icon: React.ReactNode;
  steps: string[];
  currentStep: number;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
            <Badge variant={currentStep >= steps.length ? "default" : "outline"} className="text-xs">
              {currentStep}/{steps.length}
            </Badge>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <ReadOnlySteps steps={steps} currentStep={currentStep} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function ReadOnlySteps({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="flex flex-wrap gap-2 p-2">
      {steps.map((step, idx) => {
        const isComplete = idx < currentStep;
        const isCurrent = idx === currentStep;
        return (
          <div
            key={step}
            className={`
              flex items-center gap-1 px-2 py-1 rounded text-xs
              ${isComplete ? 'bg-green-500/20 text-green-700 dark:text-green-400' : ''}
              ${isCurrent ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500/50' : ''}
              ${!isComplete && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
            `}
          >
            {isComplete && <Check className="h-3 w-3" />}
            {step}
          </div>
        );
      })}
    </div>
  );
}
