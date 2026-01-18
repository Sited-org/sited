import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Clock, Pencil, Save, BarChart3, Eye, Users, Timer, Zap, Globe, Monitor, ArrowUpRight, RefreshCw, Sparkles, Copy, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { MilestoneTimeline } from './MilestoneTimeline';

const projectTypeLabels: Record<string, string> = {
  website: 'Website',
  app: 'App',
  ai: 'AI Integration',
};

interface ProjectTabProps {
  lead: any;
  canEdit: boolean;
  onLeadUpdate?: (updatedLead: any) => void;
}

interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgTimeOnPage: number;
  avgLoadTime: number;
  topPages: { page: string; views: number; avgTime: number }[];
  trafficSources: { source: string; visits: number; percentage: number }[];
  devices: { device: string; count: number; percentage: number }[];
  browsers: { browser: string; count: number; percentage: number }[];
  lastUpdated: string | null;
}

export function ProjectTab({ lead, canEdit, onLeadUpdate }: ProjectTabProps) {
  const { updates, loading, addUpdate, deleteUpdate } = useProjectUpdates(lead.id);
  const [newUpdate, setNewUpdate] = useState('');
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editedFormData, setEditedFormData] = useState<Record<string, any>>({ ...lead.form_data });
  const [isSavingForm, setIsSavingForm] = useState(false);
  const { toast } = useToast();

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [trackingScriptCopied, setTrackingScriptCopied] = useState(false);

  // AI Prompt state
  const [promptContext, setPromptContext] = useState('');
  const [designSuggestions, setDesignSuggestions] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState(lead.generated_prompt || '');
  const [researchInsights, setResearchInsights] = useState(lead.generated_prompt_research || '');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [promptGeneratedAt, setPromptGeneratedAt] = useState<string | null>(lead.prompt_generated_at || null);

  const fetchAnalytics = async () => {
    if (lead.analytics_status !== 'active') return;
    
    setAnalyticsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-analytics', {
        body: { lead_id: lead.id }
      });
      
      if (error) throw error;
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (lead.analytics_status === 'active') {
      fetchAnalytics();
    }
  }, [lead.id, lead.analytics_status]);

  const getTrackingScript = () => {
    const trackingId = lead.tracking_id;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `<script src="${supabaseUrl}/functions/v1/track-analytics?id=${trackingId}" defer></script>`;
  };

  const copyTrackingScript = async () => {
    const script = `<!-- Sited Analytics -->
<script>
(function() {
  var TRACKING_ID = '${lead.tracking_id}';
  var ENDPOINT = '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-analytics';
  var sessionId = sessionStorage.getItem('_sa_sid');
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    sessionStorage.setItem('_sa_sid', sessionId);
  }
  function trackPageView() {
    var data = {
      tracking_id: TRACKING_ID, session_id: sessionId, page_url: window.location.href,
      page_title: document.title, referrer: document.referrer, user_agent: navigator.userAgent,
      screen_width: window.screen.width, screen_height: window.screen.height,
      viewport_width: window.innerWidth, viewport_height: window.innerHeight,
      page_load_time: 0, event_type: 'page_view', language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      connection_type: navigator.connection ? navigator.connection.effectiveType : null,
      color_depth: window.screen.colorDepth, pixel_ratio: window.devicePixelRatio
    };
    if (window.performance && window.performance.timing) {
      var t = window.performance.timing;
      data.page_load_time = t.loadEventEnd - t.navigationStart;
      data.dom_content_loaded = t.domContentLoadedEventEnd - t.navigationStart;
      data.first_byte_time = t.responseStart - t.navigationStart;
    }
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), keepalive: true }).catch(function() {});
  }
  var pageLoadTime = Date.now(), maxScrollDepth = 0;
  function trackScrollDepth() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    if (scrollPercent > maxScrollDepth) maxScrollDepth = scrollPercent;
  }
  window.addEventListener('scroll', trackScrollDepth, { passive: true });
  function trackExit() {
    var timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);
    var data = { tracking_id: TRACKING_ID, session_id: sessionId, page_url: window.location.href, event_type: 'page_exit', time_on_page: timeOnPage, scroll_depth: maxScrollDepth };
    if (navigator.sendBeacon) { navigator.sendBeacon(ENDPOINT, JSON.stringify(data)); }
    else { fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), keepalive: true }).catch(function() {}); }
  }
  document.addEventListener('click', function(e) {
    var target = e.target.closest('a, button, [data-track]');
    if (!target) return;
    var data = { tracking_id: TRACKING_ID, session_id: sessionId, page_url: window.location.href, event_type: 'click', element_tag: target.tagName, element_text: (target.innerText || '').substring(0, 100), element_href: target.href || null, element_id: target.id || null, element_class: target.className || null };
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), keepalive: true }).catch(function() {});
  });
  document.addEventListener('visibilitychange', function() { if (document.visibilityState === 'hidden') trackExit(); });
  window.addEventListener('beforeunload', trackExit);
  window.addEventListener('pagehide', trackExit);
  if (document.readyState === 'complete') { trackPageView(); } else { window.addEventListener('load', trackPageView); }
})();
</script>`;
    await navigator.clipboard.writeText(script);
    setTrackingScriptCopied(true);
    toast({ title: 'Tracking script copied to clipboard' });
    setTimeout(() => setTrackingScriptCopied(false), 2000);
  };

  const handleActivateAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ analytics_status: 'active' })
        .eq('id', lead.id)
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Analytics activated', description: 'The client can now see their website metrics.' });
      
      if (onLeadUpdate && data) {
        onLeadUpdate(data);
      }
    } catch (error: any) {
      toast({ title: 'Error activating analytics', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;
    await addUpdate(newUpdate.trim());
    setNewUpdate('');
  };

  const handleSaveFormData = async () => {
    setIsSavingForm(true);
    const { error } = await supabase
      .from('leads')
      .update({ form_data: editedFormData })
      .eq('id', lead.id);

    if (error) {
      toast({ title: 'Error saving form data', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Form responses updated' });
      onLeadUpdate?.({ ...lead, form_data: editedFormData });
      setIsEditingForm(false);
    }
    setIsSavingForm(false);
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditedFormData(prev => ({ ...prev, [key]: value }));
  };

  const formatKey = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const handleGeneratePrompt = async () => {
    setIsGeneratingPrompt(true);
    setGeneratedPrompt('');
    setResearchInsights('');

    try {
      // Extract relevant info from form_data
      const formData = lead.form_data || {};
      const businessName = lead.business_name || formData.business_name || formData.businessName || 'Unknown Business';
      const location = formData.location || formData.city || formData.suburb || 'Australia';
      const industry = formData.industry || formData.business_type || formData.type || lead.project_type || 'General';
      const website = lead.website_url || formData.website || formData.current_website || '';
      
      // Combine admin context and design suggestions with form details
      let details = '';
      if (promptContext) details += `Context: ${promptContext}\n`;
      if (designSuggestions) details += `Design Suggestions: ${designSuggestions}\n`;
      
      // Add any other form data as additional details
      const excludeKeys = ['business_name', 'businessName', 'location', 'city', 'suburb', 'industry', 'business_type', 'type', 'website', 'current_website', 'email', 'phone', 'name'];
      Object.entries(formData).forEach(([key, value]) => {
        if (!excludeKeys.includes(key) && value) {
          details += `${formatKey(key)}: ${value}\n`;
        }
      });

      const { data, error } = await supabase.functions.invoke('generate-sales-prompt', {
        body: { businessName, location, industry, website, details: details.trim(), leadId: lead.id }
      });

      if (error) throw error;

      setGeneratedPrompt(data.prompt || '');
      setResearchInsights(data.research || '');
      setPromptGeneratedAt(new Date().toISOString());
      toast({ title: 'Prompt generated and saved' });
    } catch (error: any) {
      console.error('Error generating prompt:', error);
      toast({ 
        title: 'Error generating prompt', 
        description: error.message || 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const copyPromptToClipboard = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setPromptCopied(true);
    toast({ title: 'Prompt copied to clipboard' });
    setTimeout(() => setPromptCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Project Milestones - Horizontal Timeline */}
        <MilestoneTimeline leadId={lead.id} lead={lead} canEdit={canEdit} />
        
        {/* Tracking Script */}
        {lead.tracking_id && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Website Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tracking Script Line */}
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg font-mono truncate">
                  {`<!-- Sited Analytics: ${lead.tracking_id} -->`}
                </code>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyTrackingScript}
                  className="shrink-0"
                >
                  {trackingScriptCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {lead.analytics_status === 'active' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Tracking Active</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Not Active</span>
                    </>
                  )}
                </div>
                {lead.analytics_status !== 'active' && canEdit && (
                  <Button size="sm" variant="outline" onClick={handleActivateAnalytics}>
                    Activate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Website Metrics - Only show when active */}
        {lead.analytics_status === 'active' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Website Metrics
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={fetchAnalytics} disabled={analyticsLoading}>
                  <RefreshCw className={`h-4 w-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {analyticsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : analytics && analytics.totalVisits > 0 ? (
                <>
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <Eye className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{analytics.totalVisits}</p>
                      <p className="text-xs text-muted-foreground">Page Views</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{analytics.uniqueVisitors}</p>
                      <p className="text-xs text-muted-foreground">Unique Visitors</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <ArrowUpRight className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{analytics.bounceRate}%</p>
                      <p className="text-xs text-muted-foreground">Bounce Rate</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <Timer className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{analytics.avgTimeOnPage}s</p>
                      <p className="text-xs text-muted-foreground">Avg. Time on Page</p>
                    </div>
                  </div>

                  {/* Top Pages */}
                  {analytics.topPages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Top Pages
                      </h4>
                      <div className="space-y-2">
                        {analytics.topPages.map((page, i) => (
                          <div key={i} className="flex items-center justify-between text-sm bg-muted/30 rounded px-3 py-2">
                            <span className="truncate max-w-[200px]">{page.page}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">{page.avgTime}s avg</span>
                              <Badge variant="secondary">{page.views} views</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Traffic Sources & Devices */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analytics.trafficSources.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-3">Traffic Sources</h4>
                        <div className="space-y-2">
                          {analytics.trafficSources.map((source, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="truncate max-w-[150px]">{source.source}</span>
                              <span className="text-muted-foreground">{source.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analytics.devices.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Monitor className="h-4 w-4" /> Devices
                        </h4>
                        <div className="space-y-2">
                          {analytics.devices.map((device, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{device.device}</span>
                              <span className="text-muted-foreground">{device.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Load Time */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>Avg. Load Time: {analytics.avgLoadTime}ms</span>
                    {analytics.lastUpdated && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Last updated: {format(new Date(analytics.lastUpdated), 'PPp')}</span>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No analytics data yet. Data will appear once visitors start browsing the website.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Project Progress Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Project Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Update Form */}
            {canEdit && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Textarea
                  placeholder="Add a project update..."
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                  rows={3}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddUpdate}
                  disabled={!newUpdate.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Update
                </Button>
              </div>
            )}

            {/* Updates List */}
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading updates...</p>
            ) : updates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No project updates yet</p>
            ) : (
              <div className="space-y-4">
                {updates.map((update) => (
                  <div 
                    key={update.id} 
                    className="border-l-2 border-primary pl-4 py-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">
                          {format(new Date(update.created_at), 'PPp')}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{update.content}</p>
                      </div>
                      {canEdit && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive shrink-0"
                          onClick={() => deleteUpdate(update.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Prompt Generator */}
        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Prompt Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate an AI prompt for this project based on form data. Add context and design suggestions to customize the output.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Additional Context</label>
                  <Textarea
                    placeholder="Add any additional context about the client or project (e.g., 'Client wants a minimalist feel', 'Focus on their premium service')..."
                    value={promptContext}
                    onChange={(e) => setPromptContext(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Design Suggestions</label>
                  <Textarea
                    placeholder="Add design preferences (e.g., 'Dark mode, bold typography, hero video section', 'Earthy colors, organic shapes')..."
                    value={designSuggestions}
                    onChange={(e) => setDesignSuggestions(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <Button 
                  onClick={handleGeneratePrompt} 
                  disabled={isGeneratingPrompt}
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGeneratingPrompt ? 'Generating...' : 'Generate AI Prompt'}
                </Button>
              </div>

              {/* Research Insights */}
              {researchInsights && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Research Insights</h4>
                  <div className="bg-muted/30 rounded-lg p-4 text-sm max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {researchInsights}
                  </div>
                </div>
              )}

              {/* Generated Prompt */}
              {generatedPrompt && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">Generated Prompt</h4>
                      {promptGeneratedAt && (
                        <span className="text-xs text-muted-foreground">
                          (saved {format(new Date(promptGeneratedAt), 'PP')})
                        </span>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={copyPromptToClipboard}>
                      {promptCopied ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm max-h-96 overflow-y-auto whitespace-pre-wrap border">
                    {generatedPrompt}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Project Type</label>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-sm">
                    {projectTypeLabels[lead.project_type] || lead.project_type}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Lead Number</label>
                <p className="mt-2 font-medium">#{lead.lead_number}</p>
              </div>
            </div>

            {/* Form Responses */}
            {lead.form_data && Object.keys(lead.form_data).length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-muted-foreground">Form Responses</label>
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        {isEditingForm && (
                          <Button 
                            size="sm" 
                            onClick={handleSaveFormData} 
                            disabled={isSavingForm}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {isSavingForm ? 'Saving...' : 'Save'}
                          </Button>
                        )}
                        <Button 
                          variant={isEditingForm ? "secondary" : "outline"} 
                          size="sm" 
                          onClick={() => {
                            if (isEditingForm) {
                              setEditedFormData({ ...lead.form_data });
                            }
                            setIsEditingForm(!isEditingForm);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          {isEditingForm ? 'Cancel' : 'Edit'}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    {Object.entries(isEditingForm ? editedFormData : lead.form_data).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        {isEditingForm ? (
                          <>
                            <label className="text-sm font-medium text-muted-foreground">{formatKey(key)}</label>
                            <Input
                              value={typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
                              onChange={(e) => handleFieldChange(key, e.target.value)}
                            />
                          </>
                        ) : (
                          <div className="flex gap-2 text-sm">
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="text-muted-foreground">{String(value)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isEditingForm && canEdit && (
                      <div className="pt-2 flex justify-end">
                        <Button onClick={handleSaveFormData} disabled={isSavingForm}>
                          <Save className="h-4 w-4 mr-1" />
                          {isSavingForm ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Sidebar - Quick Info */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client</span>
              <span className="font-medium">{lead.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Business</span>
              <span className="font-medium">{lead.business_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate max-w-[150px]">{lead.email}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updates</span>
              <span className="font-medium">{updates.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
