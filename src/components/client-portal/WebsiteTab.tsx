import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, Users, Clock, MousePointerClick, ExternalLink, Globe, CheckCircle2, AlertCircle, TrendingUp, Monitor, Smartphone, Tablet, Eye, Timer, Zap, ArrowUpRight, ArrowDownRight, Search, Filter, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface WebsiteTabProps {
  leadId: string;
  email: string;
  websiteUrl?: string;
  sessionToken: string;
}

interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  avgTimeOnPage: number;
  avgLoadTime: number;
  topPages: Array<{ page: string; views: number; avgTimeOnPage: number; bounceRate: number; exitRate: number }>;
  trafficSources: Array<{ source: string; visits: number; percentage: number }>;
  devices: { desktop: number; mobile: number; tablet: number };
  browsers: Array<{ browser: string; count: number; percentage: number }>;
  screenResolutions: Array<{ resolution: string; count: number; percentage: number }>;
  entryPages: Array<{ page: string; entries: number; bounceRate: number }>;
  exitPages: Array<{ page: string; exits: number; exitRate: number }>;
  hourlyTraffic: Array<{ hour: number; visits: number }>;
  dailyTraffic: Array<{ date: string; visits: number; uniqueVisitors: number }>;
  newVsReturning: { new: number; returning: number };
  avgPagesPerSession: number;
  totalPageViews: number;
  lastUpdated: string | null;
}

type AnalyticsStatus = 'not_setup' | 'pending' | 'active';

export function WebsiteTab({ leadId, email, websiteUrl, sessionToken }: WebsiteTabProps) {
  const [status, setStatus] = useState<AnalyticsStatus>('not_setup');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Filters
  const [dateRange, setDateRange] = useState('7d');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [pageSearch, setPageSearch] = useState('');

  useEffect(() => {
    loadAnalyticsStatus();
  }, [leadId]);

  const loadAnalyticsStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-client-data', {
        body: { lead_id: leadId, email, session_token: sessionToken },
      });

      if (!error && data?.lead) {
        const analyticsStatus = data.lead.analytics_status || 'not_setup';
        setStatus(analyticsStatus);

        // Fetch analytics if active
        if (analyticsStatus === 'active') {
          fetchAnalytics();
        }
      }
    } catch (err) {
      console.error('Error loading analytics status:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-analytics', {
        body: { 
          lead_id: leadId,
          date_range: dateRange,
          device_filter: deviceFilter,
          source_filter: sourceFilter,
        },
      });

      if (error) throw error;

      if (data) {
        setAnalytics(data);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'active') {
      fetchAnalytics();
    }
  }, [dateRange, deviceFilter, sourceFilter]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Website URL */}
      {websiteUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Your Website
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-2"
            >
              {websiteUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      )}

      {/* Tracking Not Enabled - shown for not_setup or pending status */}
      {(status === 'not_setup' || status === 'pending') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Website Analytics
            </CardTitle>
            <CardDescription>
              Track visitors, page views, and more for your website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Tracking not enabled</p>
                <p className="text-xs text-muted-foreground">
                  Analytics tracking will be available once our team has embedded the tracking script on your website.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'active' && (
        <>
          {/* Status Banner */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Analytics Active</p>
                  <p className="text-xs text-muted-foreground">
                    Tracking is live on your website
                  </p>
                </div>
                <Badge variant="outline" className="text-green-500 border-green-500/50">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Devices</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="organic">Organic</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchAnalytics}
                  disabled={analyticsLoading}
                >
                  {analyticsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {analyticsLoading && !analytics ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : analytics && analytics.totalVisits > 0 ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Eye className="h-4 w-4" />
                      <span className="text-xs">Page Views</span>
                    </div>
                    <p className="text-2xl font-semibold">{analytics.totalPageViews?.toLocaleString() || analytics.totalVisits?.toLocaleString() || 0}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Users className="h-4 w-4" />
                      <span className="text-xs">Unique Visitors</span>
                    </div>
                    <p className="text-2xl font-semibold">{analytics.uniqueVisitors?.toLocaleString() || 0}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <ArrowUpRight className="h-4 w-4" />
                      <span className="text-xs">Bounce Rate</span>
                    </div>
                    <p className="text-2xl font-semibold">{analytics.bounceRate?.toFixed(1) || 0}%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Avg Session</span>
                    </div>
                    <p className="text-2xl font-semibold">{formatDuration(analytics.avgSessionDuration || 0)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Timer className="h-4 w-4" />
                      <span className="text-xs">Avg Time on Page</span>
                    </div>
                    <p className="text-xl font-semibold">{formatDuration(analytics.avgTimeOnPage || 0)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <BarChart3 className="h-4 w-4" />
                      <span className="text-xs">Pages/Session</span>
                    </div>
                    <p className="text-xl font-semibold">{analytics.avgPagesPerSession?.toFixed(1) || 0}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Zap className="h-4 w-4" />
                      <span className="text-xs">Avg Load Time</span>
                    </div>
                    <p className="text-xl font-semibold">{analytics.avgLoadTime || 0}ms</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">Total Sessions</span>
                    </div>
                    <p className="text-xl font-semibold">{analytics.uniqueVisitors?.toLocaleString() || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* New vs Returning Visitors */}
              {analytics.newVsReturning && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">New vs Returning Visitors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-semibold text-green-500">{analytics.newVsReturning.new}%</p>
                        <p className="text-xs text-muted-foreground">New Visitors</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-semibold text-blue-500">{analytics.newVsReturning.returning}%</p>
                        <p className="text-xs text-muted-foreground">Returning Visitors</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Pages */}
              {analytics.topPages && analytics.topPages.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Top Pages</CardTitle>
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Filter pages..."
                          value={pageSearch}
                          onChange={(e) => setPageSearch(e.target.value)}
                          className="pl-8 h-8 w-40"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topPages
                        .filter(page => !pageSearch || page.page.toLowerCase().includes(pageSearch.toLowerCase()))
                        .slice(0, 10)
                        .map((page, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2">
                          <span className="truncate flex-1 mr-4 text-muted-foreground">{page.page}</span>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-xs text-muted-foreground">{formatDuration(page.avgTimeOnPage || 0)}</span>
                            <span className="font-medium">{page.views.toLocaleString()} views</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Traffic Sources */}
              {analytics.trafficSources && analytics.trafficSources.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Traffic Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.trafficSources.slice(0, 8).map((source, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-muted-foreground">{source.source}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${Math.min(source.percentage, 100)}%` }}
                              />
                            </div>
                            <span className="font-medium w-12 text-right">{source.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Devices */}
              {analytics.devices && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Devices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <Monitor className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-2xl font-semibold">{analytics.devices.desktop}%</p>
                        <p className="text-xs text-muted-foreground">Desktop</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <Smartphone className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-2xl font-semibold">{analytics.devices.mobile}%</p>
                        <p className="text-xs text-muted-foreground">Mobile</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <Tablet className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-2xl font-semibold">{analytics.devices.tablet}%</p>
                        <p className="text-xs text-muted-foreground">Tablet</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Browsers */}
              {analytics.browsers && analytics.browsers.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Browsers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {analytics.browsers.slice(0, 4).map((browser, index) => (
                        <div key={index} className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="font-semibold">{browser.percentage}%</p>
                          <p className="text-xs text-muted-foreground">{browser.browser}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Entry Pages */}
              {analytics.entryPages && analytics.entryPages.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4 text-green-500" />
                      Entry Pages
                    </CardTitle>
                    <CardDescription>Pages where visitors enter your site</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.entryPages.slice(0, 5).map((page, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="truncate flex-1 mr-4 text-muted-foreground">{page.page}</span>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-xs text-muted-foreground">{page.bounceRate?.toFixed(0) || 0}% bounce</span>
                            <span className="font-medium">{page.entries} entries</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Exit Pages */}
              {analytics.exitPages && analytics.exitPages.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                      Exit Pages
                    </CardTitle>
                    <CardDescription>Pages where visitors leave your site</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.exitPages.slice(0, 5).map((page, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="truncate flex-1 mr-4 text-muted-foreground">{page.page}</span>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-xs text-muted-foreground">{page.exitRate?.toFixed(0) || 0}% exit rate</span>
                            <span className="font-medium">{page.exits} exits</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {analytics.lastUpdated && (
                <p className="text-xs text-center text-muted-foreground">
                  Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
                </p>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No analytics data available yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Data will appear once visitors start browsing your website
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
