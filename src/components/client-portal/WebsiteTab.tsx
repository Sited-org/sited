import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, Users, Clock, MousePointerClick, ExternalLink, Globe, Key, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WebsiteTabProps {
  leadId: string;
  websiteUrl?: string;
  sessionToken: string;
}

interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: Array<{ page: string; views: number; avgTimeOnPage: number }>;
  trafficSources: Array<{ source: string; visits: number; percentage: number }>;
  devices: { desktop: number; mobile: number; tablet: number };
  lastUpdated: string | null;
}

type GAStatus = 'not_connected' | 'pending' | 'connected';

export function WebsiteTab({ leadId, websiteUrl, sessionToken }: WebsiteTabProps) {
  const [gaPropertyId, setGaPropertyId] = useState('');
  const [savedPropertyId, setSavedPropertyId] = useState('');
  const [gaStatus, setGaStatus] = useState<GAStatus>('not_connected');
  const [showPropertyId, setShowPropertyId] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadGAStatus();
  }, [leadId]);

  const loadGAStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-client-data', {
        body: { lead_id: leadId, email: '', session_token: sessionToken },
      });

      if (!error && data?.lead) {
        const status = data.lead.ga_status || 'not_connected';
        const propertyId = data.lead.ga_property_id || '';
        setGaStatus(status);
        setSavedPropertyId(propertyId);
        setGaPropertyId(propertyId);

        // If connected, fetch analytics
        if (status === 'connected' && propertyId) {
          fetchAnalytics();
        }
      }
    } catch (err) {
      console.error('Error loading GA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitPropertyId = async () => {
    if (!gaPropertyId.trim()) {
      toast.error('Please enter a Google Analytics Property ID');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-ga-property', {
        body: { 
          lead_id: leadId, 
          ga_property_id: gaPropertyId.trim(),
          session_token: sessionToken,
        },
      });

      if (error) throw error;

      setSavedPropertyId(gaPropertyId.trim());
      setGaStatus('pending');
      toast.success('Property ID submitted! Our team will verify and connect it shortly.');
    } catch (err: any) {
      console.error('Error submitting property ID:', err);
      toast.error(err.message || 'Failed to submit property ID');
    } finally {
      setSaving(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-analytics', {
        body: { lead_id: leadId },
      });

      if (error) throw error;

      if (data) {
        setAnalytics(data);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const maskPropertyId = (id: string): string => {
    if (id.length <= 8) return id;
    return id.substring(0, 4) + '••••' + id.substring(id.length - 4);
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

      {/* Google Analytics Connection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            Google Analytics
          </CardTitle>
          <CardDescription>
            Connect your Google Analytics to view website metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Display */}
          {gaStatus === 'pending' && (
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">Verifying Connection</p>
                <p className="text-xs text-muted-foreground">
                  Our team is setting up analytics on your website. This usually takes 24-48 hours.
                </p>
              </div>
              <Badge variant="outline" className="ml-auto text-amber-500 border-amber-500/50">
                Pending
              </Badge>
            </div>
          )}

          {gaStatus === 'connected' && (
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Analytics Connected</p>
                <p className="text-xs text-muted-foreground">
                  Your Google Analytics is connected and tracking visitors.
                </p>
              </div>
              <Badge variant="outline" className="ml-auto text-green-500 border-green-500/50">
                Connected
              </Badge>
            </div>
          )}

          {/* Property ID Input - only show if not connected */}
          {gaStatus !== 'connected' && (
            <div className="space-y-2">
              <Label htmlFor="ga-property">Property ID</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="ga-property"
                    type={showPropertyId ? 'text' : 'password'}
                    placeholder="e.g., 123456789"
                    value={gaPropertyId}
                    onChange={(e) => setGaPropertyId(e.target.value)}
                    disabled={gaStatus === 'pending'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPropertyId(!showPropertyId)}
                  >
                    {showPropertyId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {gaStatus === 'not_connected' && (
                  <Button onClick={submitPropertyId} disabled={saving || !gaPropertyId.trim()}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Find this in Google Analytics → Admin → Property Settings → Property ID
              </p>
            </div>
          )}

          {/* Show saved property ID when pending or connected */}
          {(gaStatus === 'pending' || gaStatus === 'connected') && savedPropertyId && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Property ID</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {showPropertyId ? savedPropertyId : maskPropertyId(savedPropertyId)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPropertyId(!showPropertyId)}
              >
                {showPropertyId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Display - only show when connected */}
      {gaStatus === 'connected' && analytics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs">Total Visits</span>
                </div>
                <p className="text-2xl font-semibold">{analytics.totalVisits.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Unique Visitors</span>
                </div>
                <p className="text-2xl font-semibold">{analytics.uniqueVisitors.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MousePointerClick className="h-4 w-4" />
                  <span className="text-xs">Bounce Rate</span>
                </div>
                <p className="text-2xl font-semibold">{analytics.bounceRate.toFixed(1)}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Avg Session</span>
                </div>
                <p className="text-2xl font-semibold">{formatDuration(analytics.avgSessionDuration)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Pages */}
          {analytics.topPages && analytics.topPages.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topPages.slice(0, 5).map((page, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 mr-4 text-muted-foreground">{page.page}</span>
                      <span className="font-medium">{page.views.toLocaleString()} views</span>
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
                  {analytics.trafficSources.slice(0, 5).map((source, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-muted-foreground">{source.source}</span>
                      <span className="font-medium">{source.percentage.toFixed(1)}%</span>
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
                  <div>
                    <p className="text-2xl font-semibold">{analytics.devices.desktop}%</p>
                    <p className="text-xs text-muted-foreground">Desktop</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{analytics.devices.mobile}%</p>
                    <p className="text-xs text-muted-foreground">Mobile</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{analytics.devices.tablet}%</p>
                    <p className="text-xs text-muted-foreground">Tablet</p>
                  </div>
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
      )}

      {/* No analytics yet when connected */}
      {gaStatus === 'connected' && !analytics && (
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
    </div>
  );
}
