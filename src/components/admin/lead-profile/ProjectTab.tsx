import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Clock, Pencil, Save, BarChart3, Eye, Users, Timer, Zap, Globe, Monitor, ArrowUpRight, RefreshCw } from 'lucide-react';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
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

  const fetchAnalytics = async () => {
    if (!lead.tracking_id) return;
    
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
    if (lead.tracking_id) {
      fetchAnalytics();
    }
  }, [lead.id, lead.tracking_id]);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
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

        {/* Website Metrics */}
        {lead.tracking_id && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
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
              ) : analytics ? (
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
                    <span>Avg. Page Load: {analytics.avgLoadTime}ms</span>
                    {analytics.lastUpdated && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Last data: {format(new Date(analytics.lastUpdated), 'PP')}</span>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No analytics data yet. Data will appear once visitors start using the client's website.
                </p>
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
