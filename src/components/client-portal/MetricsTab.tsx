import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, Eye, TrendingUp, Users, MousePointer, 
  Loader2, Monitor, Smartphone, Tablet, Zap 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  bounceRate: number;
  avgTimeOnPage: number;
  avgLoadTime: number;
  topPages: { page: string; views: number; avgTime: number }[];
  trafficSources: { source: string; visits: number; percentage: number }[];
  devices: { device: string; count: number; percentage: number }[];
  browsers: { browser: string; count: number; percentage: number }[];
  lastUpdated: string | null;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function MetricsTab({ lead }: MetricsTabProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalVisits: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    avgTimeOnPage: 0,
    avgLoadTime: 0,
    topPages: [],
    trafficSources: [],
    devices: [],
    browsers: [],
    lastUpdated: null,
  });

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
          bounceRate: data.bounceRate || 0,
          avgTimeOnPage: data.avgTimeOnPage || 0,
          avgLoadTime: data.avgLoadTime || 0,
          topPages: data.topPages || [],
          trafficSources: data.trafficSources || [],
          devices: data.devices || [],
          browsers: data.browsers || [],
          lastUpdated: data.lastUpdated,
        });
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Eye className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{analytics.totalVisits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Page Views</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{analytics.uniqueVisitors.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MousePointer className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{analytics.bounceRate}%</p>
              <p className="text-xs text-muted-foreground">Bounce Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{formatTime(analytics.avgTimeOnPage)}</p>
              <p className="text-xs text-muted-foreground">Avg. Session</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Zap className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{analytics.avgLoadTime}ms</p>
              <p className="text-xs text-muted-foreground">Load Time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{analytics.topPages.length}</p>
              <p className="text-xs text-muted-foreground">Pages</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block" title={page.page}>
                        {page.page}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Avg. {formatTime(page.avgTime)} per visit
                      </span>
                    </div>
                    <Badge variant="secondary" className="ml-2">{page.views.toLocaleString()}</Badge>
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
                        className="h-full bg-primary rounded-full transition-all" 
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

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Devices</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.devices.length > 0 ? (
              <div className="space-y-3">
                {analytics.devices.map((device, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.device)}
                      <span className="text-sm font-medium capitalize">{device.device}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{device.count}</span>
                      <Badge variant="secondary">{device.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No device data available yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Browser Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.browsers.length > 0 ? (
              <div className="space-y-3">
                {analytics.browsers.map((browser, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{browser.browser}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{browser.count}</span>
                      <Badge variant="secondary">{browser.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No browser data available yet.
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
    </div>
  );
}
