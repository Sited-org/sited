import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2, Globe, Mail, Phone, User, FileText, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FormResponsesDisplay } from '@/components/admin/lead-profile/FormResponsesDisplay';
import { DevWorkflowTracker } from './DevWorkflowTracker';
import { useQuery } from '@tanstack/react-query';

export default function DevProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchLead = async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        toast({ title: 'Access denied', description: 'Could not load project', variant: 'destructive' });
        navigate('/dev');
        return;
      }
      setLead(data);
      setLoading(false);
    };
    fetchLead();
  }, [id, navigate, toast]);

  // Fetch client requests (read-only)
  const { data: clientRequests } = useQuery({
    queryKey: ['dev-client-requests', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_requests')
        .select('id, title, description, status, priority, created_at')
        .eq('lead_id', id!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch project updates / notes (read-only)
  const { data: projectNotes } = useQuery({
    queryKey: ['dev-project-notes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_updates')
        .select('id, content, created_at')
        .eq('lead_id', id!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (loading || !lead) {
    return <div className="animate-pulse text-muted-foreground">Loading project...</div>;
  }

  const formData = (lead.form_data || {}) as Record<string, any>;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dev')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{lead.business_name || lead.name || 'Project'}</h1>
          <p className="text-sm text-muted-foreground capitalize">{lead.project_type}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Client Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{lead.name || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{lead.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{lead.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Business:</span>
                  <span className="font-medium">{lead.business_name || '—'}</span>
                </div>
                {lead.website_url && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Website:</span>
                    <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate">
                      {lead.website_url}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Brief / Form Data */}
          {Object.keys(formData).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Project Brief
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormResponsesDisplay formData={formData} />
              </CardContent>
            </Card>
          )}

          {/* AI Prompt / Website Brief */}
          {lead.generated_prompt && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">AI Website Brief</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {lead.generated_prompt}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Notes */}
          {lead.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Admin Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Client Requests (read-only) */}
          {clientRequests && clientRequests.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" /> Client Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {clientRequests.map((req: any) => (
                  <div key={req.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{req.title}</p>
                      {req.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{req.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge variant="outline" className="text-xs capitalize">{req.priority}</Badge>
                      <Badge variant={req.status === 'completed' ? 'default' : 'secondary'} className="text-xs capitalize">
                        {req.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Project Updates / Notes */}
          {projectNotes && projectNotes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Project Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectNotes.map((note: any) => (
                  <div key={note.id} className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Workflow Tracker */}
        <div className="space-y-6">
          <DevWorkflowTracker lead={lead} onLeadUpdate={setLead} />
        </div>
      </div>
    </div>
  );
}
