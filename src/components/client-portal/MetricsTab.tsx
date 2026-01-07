import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, Eye, TrendingUp, Users, Globe, MousePointer } from 'lucide-react';

interface MetricsTabProps {
  lead: {
    id: string;
    name?: string;
    website_url?: string;
  };
}

export function MetricsTab({ lead }: MetricsTabProps) {
  const hasWebsite = !!lead.website_url;

  // Placeholder metrics data - in production this would come from an analytics service
  const metricsData = {
    totalVisits: 0,
    uniqueVisitors: 0,
    avgTimeOnSite: '0:00',
    bounceRate: '0%',
    topPages: [] as { page: string; views: number }[],
    trafficSources: [] as { source: string; percentage: number }[],
  };

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
              <p>Your website is not yet live.</p>
              <p className="text-sm mt-1">Analytics will become available once your website is published.</p>
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
                  No page view data available yet. Analytics will appear once your website receives traffic.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Available once your website is live.
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
                Available once your website is live.
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
              <span className="text-muted-foreground">Tracking:</span>
              <Badge variant={hasWebsite ? "secondary" : "outline"}>
                {hasWebsite ? 'Active' : 'Pending'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="font-medium">--</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
