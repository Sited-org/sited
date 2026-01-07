import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, Eye, TrendingUp, Users, Globe, MousePointer } from 'lucide-react';

interface MetricsTabProps {
  lead: any;
}

export function MetricsTab({ lead }: MetricsTabProps) {
  // Placeholder metrics data - in production this would come from an analytics service
  const hasWebsite = !!lead.website_url;

  const metricsData = {
    totalVisits: 0,
    uniqueVisitors: 0,
    avgTimeOnSite: '0:00',
    bounceRate: '0%',
    topPages: [] as { page: string; views: number }[],
    trafficSources: [] as { source: string; percentage: number }[],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Overview Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Website Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasWebsite ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Eye className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{metricsData.totalVisits.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{metricsData.uniqueVisitors.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Unique Visitors</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{metricsData.avgTimeOnSite}</p>
                  <p className="text-xs text-muted-foreground">Avg. Time/Visit</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <MousePointer className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{metricsData.bounceRate}</p>
                  <p className="text-xs text-muted-foreground">Bounce Rate</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No website URL configured for this lead.</p>
                <p className="text-sm mt-1">Add a website URL in the Profile tab to enable analytics tracking.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Visited Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Visited Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasWebsite ? (
              metricsData.topPages.length > 0 ? (
                <div className="space-y-3">
                  {metricsData.topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">{page.page}</span>
                      <Badge variant="secondary">{page.views.toLocaleString()} views</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No page view data available yet. Analytics will appear once the website receives traffic.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Configure a website URL to see page analytics.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {hasWebsite ? (
              metricsData.trafficSources.length > 0 ? (
                <div className="space-y-3">
                  {metricsData.trafficSources.map((source, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{source.source}</span>
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
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Configure a website URL to see traffic sources.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Analytics Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analytics Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Website</span>
              <span className="font-medium truncate max-w-[150px]">
                {lead.website_url || 'Not configured'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tracking</span>
              <Badge variant={hasWebsite ? "secondary" : "outline"}>
                {hasWebsite ? 'Ready' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium">--</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
