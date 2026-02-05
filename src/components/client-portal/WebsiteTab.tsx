import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Globe, CheckCircle2, ExternalLink, BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { toast } from 'sonner';
import { lovable } from '@/integrations/lovable/index';

interface WebsiteTabProps {
  leadId: string;
  email: string;
  websiteUrl?: string;
  sessionToken: string;
  workflowData?: any;
}

export function WebsiteTab({ leadId, email, websiteUrl, sessionToken, workflowData }: WebsiteTabProps) {
  const [loading, setLoading] = useState(true);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [analyticsConnected, setAnalyticsConnected] = useState(false);

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

  useEffect(() => {
    checkAnalyticsStatus();
  }, [leadId]);

  const checkAnalyticsStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-client-data', {
        body: { lead_id: leadId, email, session_token: sessionToken },
      });

      if (!error && data?.lead) {
        setAnalyticsConnected(data.lead.ga_status === 'connected');
      }
    } catch (err) {
      console.error('Error checking analytics status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + '/client-portal/dashboard',
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      });

      if (error) {
        console.error('Google sign-in error:', error);
        toast.error('Failed to connect Google Analytics. Please try again.');
      }
    } catch (err) {
      console.error('Error connecting Google:', err);
      toast.error('Failed to connect Google Analytics');
    } finally {
      setConnectingGoogle(false);
    }
  };

  // Generate website preview URL using a screenshot service
  const getPreviewImageUrl = (url: string) => {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    // Using a simple screenshot API - returns a thumbnail preview
    return `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

      {/* Google Analytics Integration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Google Analytics
          </CardTitle>
          <CardDescription>
            Connect your Google account to view website analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!analyticsConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-lg">
                <Sparkles className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Connect Google Analytics</p>
                  <p className="text-xs text-muted-foreground">
                    Sign in with Google to view your website analytics directly here
                  </p>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleConnectGoogle}
                disabled={connectingGoogle}
              >
                {connectingGoogle ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Analytics Connected</p>
                  <p className="text-xs text-muted-foreground">
                    Your Google Analytics is linked to your dashboard
                  </p>
                </div>
                <Badge variant="outline" className="text-green-500 border-green-500/50">
                  Connected
                </Badge>
              </div>
              
              <Button variant="outline" className="w-full" asChild>
                <a 
                  href="https://analytics.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in Google Analytics
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
