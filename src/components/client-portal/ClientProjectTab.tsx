import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectUpdate {
  id: string;
  content: string;
  created_at: string;
}

interface ClientProjectTabProps {
  lead: {
    id: string;
    name: string;
    project_type: string;
    status: string;
    form_data: any;
  };
  projectUpdates: ProjectUpdate[];
}

export function ClientProjectTab({ lead, projectUpdates }: ClientProjectTabProps) {
  // Extract preview URL from form_data if available
  const previewUrl = lead.form_data?.preview_url || lead.form_data?.previewUrl;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'new':
        return { label: 'Getting Started', color: 'bg-blue-500/10 text-blue-600', icon: Clock };
      case 'contacted':
        return { label: 'In Discussion', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock };
      case 'booked_call':
        return { label: 'Call Scheduled', color: 'bg-purple-500/10 text-purple-600', icon: Clock };
      case 'sold':
        return { label: 'In Development', color: 'bg-green-500/10 text-green-600', icon: CheckCircle2 };
      case 'lost':
        return { label: 'On Hold', color: 'bg-gray-500/10 text-gray-600', icon: AlertCircle };
      default:
        return { label: status, color: 'bg-muted', icon: Clock };
    }
  };

  const statusInfo = getStatusInfo(lead.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Project Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Project Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            <span className="text-sm text-muted-foreground">
              {lead.project_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Project
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Preview Link */}
      {previewUrl && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Project Preview
            </CardTitle>
            <CardDescription>
              View the latest preview of your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Preview
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Project Progress Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Project Progress
          </CardTitle>
          <CardDescription>
            Updates from our development team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectUpdates.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No updates yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Updates will appear here as your project progresses
              </p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
              
              {projectUpdates.map((update, index) => (
                <div key={update.id} className="relative pl-10 pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(new Date(update.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                    </p>
                    <p className="whitespace-pre-wrap">{update.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
