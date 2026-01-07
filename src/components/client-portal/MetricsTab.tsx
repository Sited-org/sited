import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Clock, Eye, TrendingUp, Users, Globe, MousePointer, Copy, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MetricsTabProps {
  lead: {
    id: string;
    name?: string;
    website_url?: string;
    tracking_id?: string;
  };
}

interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  topPages: { page: string; views: number }[];
  trafficSources: { source: string; percentage: number }[];
  lastUpdated: string | null;
}

export function MetricsTab({ lead }: MetricsTabProps) {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalVisits: 0,
    uniqueVisitors: 0,
    topPages: [],
    trafficSources: [],
    lastUpdated: null,
  });

  const hasWebsite = !!lead.website_url;
  const trackingId = lead.tracking_id;

  useEffect(() => {
    if (lead.id) {
      fetchAnalytics();
    }
  }, [lead.id]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-analytics', {
        body: { lead_id: lead.id },
      });

      if (error) throw error;

      if (data) {
        setAnalytics({
          totalVisits: data.totalVisits || 0,
          uniqueVisitors: data.uniqueVisitors || 0,
          topPages: data.topPages || [],
          trafficSources: data.trafficSources || [],
          lastUpdated: data.lastUpdated,
        });
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const trackingScript = `<!-- Analytics Tracking Script -->
<script>
(function() {
  var tid = "${trackingId || 'YOUR_TRACKING_ID'}";
  var sid = sessionStorage.getItem('_sid') || Math.random().toString(36).substr(2, 9);
  sessionStorage.setItem('_sid', sid);
  
  function track() {
    fetch("${window.location.origin.includes('localhost') ? 'https://xwjoqaflrynemntyzwmw.supabase.co' : 'https://xwjoqaflrynemntyzwmw.supabase.co'}/functions/v1/track-analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tracking_id: tid,
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        session_id: sid
      })
    }).catch(function() {});
  }
  
  if (document.readyState === 'complete') { track(); }
  else { window.addEventListener('load', track); }
})();
</script>`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(trackingScript);
    setCopied(true);
    toast.success('Tracking script copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Website Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasWebsite || analytics.totalVisits > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <Eye className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{analytics.totalVisits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Page Views</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{analytics.uniqueVisitors.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Unique Sessions</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{analytics.topPages.length}</p>
                <p className="text-xs text-muted-foreground">Pages Tracked</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <Globe className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{analytics.trafficSources.length}</p>
                <p className="text-xs text-muted-foreground">Traffic Sources</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No analytics data yet.</p>
              <p className="text-sm mt-1">Data will appear once your website starts receiving traffic with the tracking script installed.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Visited Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Visited Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topPages.length > 0 ? (
              <div className="space-y-3">
                {analytics.topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium truncate max-w-[200px]" title={page.page}>
                      {page.page}
                    </span>
                    <Badge variant="secondary">{page.views.toLocaleString()} views</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No page view data available yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.trafficSources.length > 0 ? (
              <div className="space-y-3">
                {analytics.trafficSources.map((source, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate max-w-[200px]" title={source.source}>{source.source}</span>
                      <span className="font-medium">{source.percentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No traffic source data available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analytics Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Website:</span>
              <span className="font-medium">
                {lead.website_url || 'Not yet published'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Tracking ID:</span>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">
                {trackingId || 'Not assigned'}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={analytics.totalVisits > 0 ? "default" : "secondary"}>
                {analytics.totalVisits > 0 ? 'Receiving Data' : 'Awaiting Data'}
              </Badge>
            </div>
            {analytics.lastUpdated && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Last Event:</span>
                <span className="font-medium">
                  {new Date(analytics.lastUpdated).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracking Script - Only show if tracking_id exists */}
      {trackingId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tracking Script</CardTitle>
            <CardDescription>
              Add this script to your website's HTML (before the closing &lt;/body&gt; tag) to start collecting analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                <code>{trackingScript}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={handleCopyScript}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
