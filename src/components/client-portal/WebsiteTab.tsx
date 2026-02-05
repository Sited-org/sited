import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Globe, CheckCircle2, ExternalLink, TrendingUp } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface WebsiteTabProps {
  leadId: string;
  websiteUrl?: string;
  workflowData?: any;
}

export function WebsiteTab({ leadId, websiteUrl, workflowData }: WebsiteTabProps) {
  // Calculate workflow progress from workflow_data
  const workflowProgress = useMemo(() => {
    if (!workflowData?.config || !workflowData?.progress) return null;
    
    const { config, progress } = workflowData;
    let totalSteps = 0;
    let completedSteps = 0;
    
    // Stage 1: Front End (4 steps)
    if (config.frontEnd) {
      totalSteps += 4;
      completedSteps += progress.frontEnd || 0;
    }
    
    // Stage 2: Back End (5 steps)
    if (config.backEnd) {
      totalSteps += 5;
      completedSteps += progress.backEnd || 0;
    }
    
    // Stage 3: Integrations (4 steps each)
    const integrations = config.integrations || [];
    integrations.forEach((integration: string) => {
      totalSteps += 4;
      completedSteps += progress.integrations?.[integration] || 0;
    });
    
    // Stage 4: AI Automations (7 steps each)
    const aiAutomations = config.aiAutomations || [];
    aiAutomations.forEach((automation: string) => {
      totalSteps += 7;
      completedSteps += progress.aiAutomations?.[automation] || 0;
    });
    
    if (totalSteps === 0) return null;
    
    return Math.round((completedSteps / totalSteps) * 100);
  }, [workflowData]);

  // Generate website preview URL using a screenshot service
  const getPreviewImageUrl = (url: string) => {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    return `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
  };

  return (
    <div className="space-y-6">
      {/* Project Progress */}
      {workflowProgress !== null && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Project Progress
            </CardTitle>
            <CardDescription>
              Your website development is {workflowProgress}% complete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Completion</span>
                <span className="font-semibold">{workflowProgress}%</span>
              </div>
              <Progress value={workflowProgress} className="h-3" />
              {workflowProgress === 100 && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Your project is complete!</span>
                </div>
              )}
              {workflowProgress > 0 && workflowProgress < 100 && (
                <p className="text-xs text-muted-foreground mt-1">
                  We're actively working on your project. Check back for updates.
                </p>
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
            {/* Website Preview Image */}
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
                      // Fallback to a placeholder if the preview fails
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
              <span className="text-sm text-muted-foreground truncate flex-1 mr-2">
                {websiteUrl}
              </span>
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
