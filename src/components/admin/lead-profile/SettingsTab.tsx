import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle, Calendar, User, Key, Copy, RefreshCw, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SettingsTabProps {
  lead: any;
  canEdit: boolean;
  onLeadUpdate?: (updatedLead: any) => void;
}

export function SettingsTab({ lead, canEdit, onLeadUpdate }: SettingsTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', lead.id);

    if (error) {
      toast({ title: 'Error deleting lead', description: error.message, variant: 'destructive' });
      setDeleting(false);
    } else {
      toast({ title: 'Lead deleted' });
      navigate('/admin/leads');
    }
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      // Call the database function to generate a unique code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_client_access_code');

      if (codeError) throw codeError;

      // Update the lead with the new code
      const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update({ client_access_code: codeData })
        .eq('id', lead.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Send credentials email to client
      const portalUrl = `${window.location.origin}/client`;
      const { error: emailError } = await supabase.functions.invoke('send-client-credentials', {
        body: {
          clientName: lead.name || '',
          clientEmail: lead.email,
          accessCode: codeData,
          portalUrl
        }
      });

      if (emailError) {
        console.error('Failed to send credentials email:', emailError);
        toast({ 
          title: 'Access code generated', 
          description: `Code: ${codeData}. Note: Email could not be sent.`,
          variant: 'default'
        });
      } else {
        toast({ 
          title: 'Access code generated & emailed', 
          description: `Code sent to ${lead.email}` 
        });
      }
      
      if (onLeadUpdate && updatedLead) {
        onLeadUpdate(updatedLead);
      }
    } catch (error: any) {
      toast({ 
        title: 'Error generating code', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyCode = async () => {
    if (lead.client_access_code) {
      await navigator.clipboard.writeText(lead.client_access_code);
      setCopied(true);
      toast({ title: 'Code copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Client Portal Access */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Client Portal Access
          </CardTitle>
          <CardDescription>
            Generate an access code for the client to log into their portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lead.client_access_code ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Access Code</p>
                  <p className="font-mono text-2xl font-bold tracking-widest">
                    {lead.client_access_code}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                  className="h-12 w-12"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Client email:</span>
                <span className="font-medium text-foreground">{lead.email}</span>
              </div>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                  className="mt-2"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${generatingCode ? 'animate-spin' : ''}`} />
                  Regenerate Code
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                No access code has been generated for this client yet.
              </p>
              {canEdit && (
                <Button
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                >
                  <Key className={`h-4 w-4 mr-2 ${generatingCode ? 'animate-spin' : ''}`} />
                  {generatingCode ? 'Generating...' : 'Generate Access Code'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lead Information</CardTitle>
          <CardDescription>Details about this lead record</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Lead ID</span>
              <p className="font-mono text-xs mt-1">{lead.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Lead Number</span>
              <p className="font-medium mt-1">#{lead.lead_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Created</span>
                <p className="font-medium">{format(new Date(lead.created_at), 'PPp')}</p>
              </div>
            </div>
            {lead.assigned_to && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Assigned To</span>
                  <p className="font-mono text-xs">{lead.assigned_to}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {canEdit && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions for this lead
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete this lead</p>
                <p className="text-sm text-muted-foreground">
                  Permanently remove this lead and all associated data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Lead
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete lead #{lead.lead_number} 
                      ({lead.name || lead.email}) and all associated transactions and project updates.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Lead
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
