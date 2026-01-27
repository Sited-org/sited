import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Globe, CheckCircle2, AlertCircle, ExternalLink, BarChart3, Plus, HelpCircle, Link2, Unlink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface WebsiteTabProps {
  leadId: string;
  email: string;
  websiteUrl?: string;
  sessionToken: string;
}

type GAStatus = 'not_connected' | 'pending' | 'connected';

export function WebsiteTab({ leadId, email, websiteUrl, sessionToken }: WebsiteTabProps) {
  const [gaStatus, setGaStatus] = useState<GAStatus>('not_connected');
  const [gaPropertyId, setGaPropertyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [inputPropertyId, setInputPropertyId] = useState('');

  useEffect(() => {
    loadGAStatus();
  }, [leadId]);

  const loadGAStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-client-data', {
        body: { lead_id: leadId, email, session_token: sessionToken },
      });

      if (!error && data?.lead) {
        setGaStatus(data.lead.ga_status || 'not_connected');
        setGaPropertyId(data.lead.ga_property_id || '');
      }
    } catch (err) {
      console.error('Error loading GA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGA = async () => {
    if (!inputPropertyId.trim()) {
      toast.error('Please enter your Google Analytics Property ID');
      return;
    }

    // Validate format (G-XXXXXXXXXX or UA-XXXXXXXX-X)
    const gaPattern = /^(G-[A-Z0-9]+|UA-\d+-\d+)$/i;
    if (!gaPattern.test(inputPropertyId.trim())) {
      toast.error('Invalid Property ID format. Expected format: G-XXXXXXXXXX');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-ga-property', {
        body: { 
          lead_id: leadId, 
          ga_property_id: inputPropertyId.trim(),
          session_token: sessionToken 
        },
      });

      if (error) throw error;

      setGaStatus('pending');
      setGaPropertyId(inputPropertyId.trim());
      setDialogOpen(false);
      toast.success('Google Analytics submitted! Our team will connect it shortly.');
    } catch (err: any) {
      console.error('Error submitting GA:', err);
      toast.error(err.message || 'Failed to submit Google Analytics');
    } finally {
      setSubmitting(false);
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

      {/* Google Analytics Integration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Google Analytics
          </CardTitle>
          <CardDescription>
            Connect your Google Analytics to view website metrics in Sited
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gaStatus === 'not_connected' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-lg">
                <Unlink className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Analytics not connected</p>
                  <p className="text-xs text-muted-foreground">
                    Connect your Google Analytics to track visitors and page views
                  </p>
                </div>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Google Analytics
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Connect Google Analytics
                    </DialogTitle>
                    <DialogDescription>
                      Enter your Google Analytics Property ID to connect your website metrics
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="propertyId">Property ID</Label>
                      <Input
                        id="propertyId"
                        placeholder="G-XXXXXXXXXX"
                        value={inputPropertyId}
                        onChange={(e) => setInputPropertyId(e.target.value.toUpperCase())}
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: G-XXXXXXXXXX (Google Analytics 4)
                      </p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p className="font-medium text-foreground">How to find your Property ID:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Go to <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics</a></li>
                            <li>Click Admin (gear icon)</li>
                            <li>Under Property, click "Property Settings"</li>
                            <li>Copy the Property ID (starts with G-)</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitGA} disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {gaStatus === 'pending' && (
            <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Connection Pending</p>
                <p className="text-xs text-muted-foreground">
                  Property ID: <span className="font-mono">{gaPropertyId}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Our team is setting up your analytics. This usually takes 1-2 business days.
                </p>
              </div>
              <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
                Pending
              </Badge>
            </div>
          )}

          {gaStatus === 'connected' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Analytics Connected</p>
                  <p className="text-xs text-muted-foreground">
                    Property ID: <span className="font-mono">{gaPropertyId}</span>
                  </p>
                </div>
                <Badge variant="outline" className="text-green-500 border-green-500/50">
                  Connected
                </Badge>
              </div>
              
              <Button variant="outline" className="w-full" asChild>
                <a 
                  href={`https://analytics.google.com/analytics/web/#/p${gaPropertyId?.replace('G-', '')}/reports/intelligenthome`}
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
