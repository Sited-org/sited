import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Globe, CheckCircle2, ExternalLink, TrendingUp, ChevronDown, ChevronUp, Check, Lock } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface BuildStep {
  id: string;
  step_key: string;
  step_number: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  is_locked: boolean;
  is_skipped: boolean;
  completed_at: string | null;
  order_index: number;
}

interface BuildPhase {
  id: string;
  phase_key: string;
  phase_number: number;
  title: string;
  description: string | null;
  is_locked: boolean;
  is_completed: boolean;
  is_skipped: boolean;
  order_index: number;
  steps: BuildStep[];
}

interface BuildFlowData {
  id: string;
  status: string;
  is_live: boolean;
  staging_url: string | null;
  client_view_enabled: boolean;
  phases: BuildPhase[];
  completions: any[];
}

interface WebsiteTabProps {
  leadId: string;
  websiteUrl?: string;
  workflowData?: any;
  buildFlowData?: BuildFlowData | null;
}

export function WebsiteTab({ leadId, websiteUrl, buildFlowData }: WebsiteTabProps) {
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

  const progress = useMemo(() => {
    if (!buildFlowData?.phases?.length) return null;
    let total = 0;
    let completed = 0;
    for (const phase of buildFlowData.phases) {
      if (phase.is_skipped) continue;
      for (const step of phase.steps) {
        if (step.is_skipped) continue;
        total++;
        if (step.is_completed) completed++;
      }
    }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [buildFlowData]);

  const togglePhase = (key: string) => {
    setExpandedPhases(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getPreviewImageUrl = (url: string) => {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    return `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
  };

  return (
    <div className="space-y-6">
      {/* Build Flow Progress */}
      {progress !== null && buildFlowData && (
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

            {/* Phase breakdown */}
            <div className="space-y-2 pt-2">
              {buildFlowData.phases
                .filter(p => !p.is_skipped)
                .map(phase => {
                  const totalSteps = phase.steps.filter(s => !s.is_skipped).length;
                  const completedSteps = phase.steps.filter(s => s.is_completed && !s.is_skipped).length;
                  const isExpanded = expandedPhases[phase.phase_key];

                  return (
                    <Collapsible key={phase.id} open={isExpanded} onOpenChange={() => togglePhase(phase.phase_key)}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                          <div className="flex items-center gap-2">
                            {phase.is_locked ? (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            ) : phase.is_completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-primary" />
                            )}
                            <span className="font-medium text-sm">{phase.title}</span>
                            <Badge 
                              variant={completedSteps >= totalSteps ? "default" : "outline"} 
                              className="text-xs"
                            >
                              {completedSteps}/{totalSteps}
                            </Badge>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="space-y-1 pl-2">
                          {phase.steps
                            .filter(s => !s.is_skipped)
                            .map(step => (
                              <div
                                key={step.id}
                                className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                                  step.is_completed 
                                    ? 'text-green-700 dark:text-green-400' 
                                    : step.is_locked 
                                      ? 'text-muted-foreground opacity-50' 
                                      : 'text-foreground'
                                }`}
                              >
                                {step.is_completed ? (
                                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                                ) : step.is_locked ? (
                                  <Lock className="h-3 w-3 shrink-0" />
                                ) : (
                                  <div className="h-3 w-3 rounded-full border border-muted-foreground shrink-0" />
                                )}
                                <span>{step.title}</span>
                              </div>
                            ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staging URL */}
      {buildFlowData?.staging_url && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Staging Preview</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{buildFlowData.staging_url}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={buildFlowData.staging_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
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

      {/* No build flow and no website */}
      {!buildFlowData && !websiteUrl && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Globe className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Your project hasn't started yet. We'll update your progress here once development begins.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
