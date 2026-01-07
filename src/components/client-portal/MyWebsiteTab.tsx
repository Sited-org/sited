import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  ExternalLink, 
  Smartphone, 
  Monitor,
  Zap,
  Shield,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface MyWebsiteTabProps {
  lead: {
    id: string;
    name: string;
    business_name?: string;
    project_type: string;
    status: string;
    form_data: any;
    created_at: string;
    website_url?: string;
  };
}

export function MyWebsiteTab({ lead }: MyWebsiteTabProps) {
  const previewUrl = lead.form_data?.preview_url || lead.form_data?.previewUrl;
  const websiteUrl = lead.website_url;
  const isLive = !!websiteUrl;

  return (
    <div className="space-y-6">
      {/* Website Status */}
      <Card className={isLive ? 'border-green-500/30 bg-green-500/5' : 'border-blue-500/30 bg-blue-500/5'}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${isLive ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                <Globe className={`h-7 w-7 ${isLive ? 'text-green-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {lead.business_name || lead.name || 'Your Website'}
                </h2>
                <p className="text-muted-foreground">
                  {isLive ? websiteUrl : 'Currently in development'}
                </p>
              </div>
            </div>
            <Badge className={`${isLive ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'} py-1.5 px-3`}>
              {isLive ? 'Live' : 'In Development'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {websiteUrl && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Live Website</h3>
                  <p className="text-sm text-muted-foreground">Visit your published website</p>
                </div>
                <Button asChild className="w-full">
                  <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {previewUrl && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Preview Link</h3>
                  <p className="text-sm text-muted-foreground">View the latest development version</p>
                </div>
                <Button variant="outline" asChild className="w-full">
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Preview
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Website Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Website Features</CardTitle>
          <CardDescription>What's included with your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Mobile Responsive</p>
                <p className="text-xs text-muted-foreground">Optimized for all devices</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Fast Loading</p>
                <p className="text-xs text-muted-foreground">Optimized performance</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">SSL Secure</p>
                <p className="text-xs text-muted-foreground">HTTPS enabled</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Regular Updates</p>
                <p className="text-xs text-muted-foreground">Maintained & updated</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Project Started</span>
              </div>
              <p className="font-medium">{format(new Date(lead.created_at), 'MMMM d, yyyy')}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Globe className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Project Type</span>
              </div>
              <p className="font-medium">{lead.project_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Website Yet */}
      {!websiteUrl && !previewUrl && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Website Coming Soon</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Your website is currently being developed. Once a preview is ready, you'll be able to view it here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
