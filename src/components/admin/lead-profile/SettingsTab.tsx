import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle, Calendar, User, Mail, Send, Loader2, Check } from 'lucide-react';
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
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from('leads').delete().eq('id', lead.id);
    if (error) {
      toast({ title: 'Error deleting lead', description: error.message, variant: 'destructive' });
      setDeleting(false);
    } else {
      toast({ title: 'Lead deleted' });
      navigate('/admin/leads');
    }
  };

  const handleSendPortalInvite = async () => {
    setSendingInvite(true);
    try {
      const portalUrl = 'https://sited.co/client-portal';
      const { error: emailError } = await supabase.functions.invoke('send-client-credentials', {
        body: {
          clientName: lead.name || '',
          clientEmail: lead.email,
          portalUrl,
        }
      });

      if (emailError) throw emailError;

      setInviteSent(true);
      toast({ 
        title: 'Portal invite sent', 
        description: `Instructions emailed to ${lead.email}` 
      });
      setTimeout(() => setInviteSent(false), 3000);
    } catch (error: any) {
      toast({ 
        title: 'Error sending invite', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Client Portal Access */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Client Portal Access
          </CardTitle>
          <CardDescription>
            Send the client an email with instructions on how to access their portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              Clients log in using their email address. A one-time verification code is sent to their email for secure access.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Client email:</span>
              <span className="font-medium text-foreground">{lead.email}</span>
            </div>
          </div>
          {canEdit && (
            <Button
              onClick={handleSendPortalInvite}
              disabled={sendingInvite}
              className="w-full sm:w-auto"
            >
              {inviteSent ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  Invite Sent!
                </>
              ) : sendingInvite ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Portal Invite Email
                </>
              )}
            </Button>
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
            <CardDescription>Irreversible actions for this lead</CardDescription>
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
