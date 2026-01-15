import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, BarChart3, Users, Clock, MousePointerClick, ExternalLink, Globe, Key, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WebsiteTabProps {
  leadId: string;
  websiteUrl?: string;
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

export function WebsiteTab({ leadId, websiteUrl }: WebsiteTabProps) {
  const [gaPropertyId, setGaPropertyId] = useState('');
  const [savedPropertyId, setSavedPropertyId] = useState('');
  const [showPropertyId, setShowPropertyId] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [hasAnalytics, setHasAnalytics] = useState(false);

  // Load saved property ID on mount
  useEffect(() => {
    loadSavedPropertyId();
  }, [leadId]);

  const loadSavedPropertyId = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('form_data')
        .eq('id', leadId)
        .single();

      if (!error && data?.form_data) {
        const formData = data.form_data as Record<string, unknown>;
        const propertyId = formData.ga_property_id as string | undefined;
        if (propertyId) {
          setSavedPropertyId(propertyId);
          setGaPropertyId(propertyId);
          // Automatically fetch analytics if we have a property ID
          fetchAnalytics(propertyId);
        }
      }
    } catch (err) {
      console.error('Error loading property ID:', err);
    }
  };

  const savePropertyId = async () => {
    if (!gaPropertyId.trim()) {
      toast.error('Please enter a Google Analytics Property ID');
      return;
    }

    setSaving(true);
    try {
      // Get current form_data
      const { data: currentData, error: fetchError } = await supabase
        .from('leads')
        .select('form_data')
        .eq('id', leadId)
        .single();

      if (fetchError) throw fetchError;

      const currentFormData = (currentData?.form_data as Record<string, unknown>) || {};
      const updatedFormData = {
        ...currentFormData,
        ga_property_id: gaPropertyId.trim(),
      };

      // Update the lead with the new property ID
      const { error: updateError } = await supabase
        .from('leads')
        .update({ form_data: updatedFormData })
        .eq('id', leadId);

      if (updateError) throw updateError;

      setSavedPropertyId(gaPropertyId.trim());
      toast.success('Analytics property ID saved');
      
      // Fetch analytics with the new property ID
      fetchAnalytics(gaPropertyId.trim());
    } catch (err) {
      console.error('Error saving property ID:', err);
      toast.error('Failed to save property ID');
    } finally {
      setSaving(false);
    }
  };

  const fetchAnalytics = async (propertyId?: string) => {
    const idToUse = propertyId || savedPropertyId;
    if (!idToUse) {
      toast.error('Please save your Google Analytics Property ID first');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-analytics', {
        body: { lead_id: leadId, ga_property_id: idToUse },
      });

      if (error) throw error;

      if (data) {
        setAnalytics(data);
        setHasAnalytics(true);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      // If analytics fetch fails, show the input form
      setHasAnalytics(false);
      if (err.message?.includes('credentials') || err.message?.includes('property')) {
        toast.error('Unable to connect to Google Analytics. Please check your Property ID.');
      }
    } finally {
      setLoading(false);
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

      {/* Google Analytics Setup */}
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
              <Button onClick={savePropertyId} disabled={saving || !gaPropertyId.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Find this in Google Analytics → Admin → Property Settings → Property ID
            </p>
          </div>

          {savedPropertyId && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Connected Property</p>
                <p className="text-xs text-muted-foreground">
                  {showPropertyId ? savedPropertyId : maskPropertyId(savedPropertyId)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAnalytics()}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh Data'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Display */}
      {loading && !analytics && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {analytics && (
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
          {analytics.topPages.length > 0 && (
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
          {analytics.trafficSources.length > 0 && (
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

          {analytics.lastUpdated && (
            <p className="text-xs text-center text-muted-foreground">
              Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
            </p>
          )}
        </>
      )}

      {!loading && !analytics && savedPropertyId && (
        <Card>
          <CardContent className="py-8 text-center">
            <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No analytics data available yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => fetchAnalytics()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
