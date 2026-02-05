import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface ClientProjectTabProps {
  lead: {
    id: string;
    name: string;
    project_type: string;
    status: string;
    form_data: any;
  };
}

export function ClientProjectTab({ lead }: ClientProjectTabProps) {
  // Extract preview URL from form_data if available
  const previewUrl = lead.form_data?.preview_url || lead.form_data?.previewUrl;

  return (
    <div className="space-y-6">
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

      {/* Project information placeholder */}
      {!previewUrl && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Project details will appear here</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
