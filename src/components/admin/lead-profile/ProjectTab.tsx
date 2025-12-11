import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Clock } from 'lucide-react';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import { format } from 'date-fns';

const projectTypeLabels: Record<string, string> = {
  website: 'Website',
  app: 'App',
  ai: 'AI Integration',
};

interface ProjectTabProps {
  lead: any;
  canEdit: boolean;
}

export function ProjectTab({ lead, canEdit }: ProjectTabProps) {
  const { updates, loading, addUpdate, deleteUpdate } = useProjectUpdates(lead.id);
  const [newUpdate, setNewUpdate] = useState('');

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;
    await addUpdate(newUpdate.trim());
    setNewUpdate('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
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
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Form Responses</label>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    {Object.entries(lead.form_data).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-muted-foreground">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

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
