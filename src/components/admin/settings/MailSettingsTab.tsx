import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEmailTemplates, useEmailAutomations, useEmailLogs, EmailTemplate, EmailAutomation } from '@/hooks/useEmailSettings';
import { Mail, Settings2, History, Pencil, Play, Clock, CheckCircle, XCircle, UserPlus, CreditCard, BarChart3, Receipt, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import EmailTemplateEditor from './EmailTemplateEditor';

const TEMPLATE_INFO: Record<string, { icon: React.ReactNode; title: string; description: string }> = {
  onboarding: {
    icon: <UserPlus className="h-5 w-5" />,
    title: 'Onboarding Email',
    description: 'Sent automatically when a new lead is added',
  },
  payment_receipt: {
    icon: <CreditCard className="h-5 w-5" />,
    title: 'Payment Receipt',
    description: 'Sent after a payment is processed via Stripe',
  },
  monthly_report: {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Monthly Report',
    description: 'AI-powered monthly business insights',
  },
  recurring_invoices: {
    icon: <Receipt className="h-5 w-5" />,
    title: 'Recurring Invoices',
    description: 'Sends Stripe invoices to clients with active memberships',
  },
  milestone_progress: {
    icon: <TrendingUp className="h-5 w-5" />,
    title: 'Milestone Progress',
    description: 'Sent when project reaches 25%, 50%, 75%, or 100%',
  },
  staff_invitation: {
    icon: <UserPlus className="h-5 w-5" />,
    title: 'Staff Invitation',
    description: 'Sent when inviting new staff members to the team',
  },
};


export default function MailSettingsTab() {
  const { templates, loading: templatesLoading, updateTemplate } = useEmailTemplates();
  const { automations, loading: automationsLoading, updateAutomation, triggerAutomation } = useEmailAutomations();
  const { logs, loading: logsLoading } = useEmailLogs();

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditedSubject(template.subject);
    setEditedBody(template.body_html);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    setSaving(true);
    await updateTemplate(editingTemplate.id, {
      subject: editedSubject,
      body_html: editedBody,
    });
    setSaving(false);
    setEditingTemplate(null);
  };

  const handleToggleTemplate = async (template: EmailTemplate) => {
    await updateTemplate(template.id, { is_enabled: !template.is_enabled });
  };

  const handleToggleAutomation = async (automation: EmailAutomation) => {
    await updateAutomation(automation.id, { is_enabled: !automation.is_enabled });
  };

  const handleTestAutomation = async (automationType: string) => {
    await triggerAutomation(automationType, {});
  };

  const getAutomationForTemplate = (templateType: string) => {
    return automations.find(a => a.automation_type === templateType);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Email Settings</h2>
        <p className="text-sm text-muted-foreground">Manage email templates and automation rules</p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          {templatesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-muted-foreground">Loading templates...</div>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => {
                const info = TEMPLATE_INFO[template.template_type] || {
                  icon: <Mail className="h-5 w-5" />,
                  title: template.template_type,
                  description: 'Email template',
                };
                const automation = getAutomationForTemplate(template.template_type);

                return (
                  <Card key={template.id} className={!template.is_enabled ? 'opacity-60' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            {info.icon}
                          </div>
                          <div>
                            <CardTitle className="text-base">{info.title}</CardTitle>
                            <CardDescription className="text-sm">{info.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.is_enabled}
                            onCheckedChange={() => handleToggleTemplate(template)}
                          />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit {info.title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <EmailTemplateEditor
                                  subject={editedSubject}
                                  bodyHtml={editedBody}
                                  templateType={template.template_type}
                                  onSubjectChange={setEditedSubject}
                                  onBodyHtmlChange={setEditedBody}
                                />
                                <div className="flex justify-end gap-2 pt-2">
                                  <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleSaveTemplate} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Template'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Subject:</span> {template.subject}
                      </div>
                      {automation && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={automation.is_enabled ? 'default' : 'secondary'}>
                            {automation.is_enabled ? 'Automation Active' : 'Automation Disabled'}
                          </Badge>
                          {automation.last_run_at && (
                            <span className="text-xs text-muted-foreground">
                              Last run: {format(new Date(automation.last_run_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-4 mt-4">
          {automationsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-muted-foreground">Loading automations...</div>
            </div>
          ) : (
            <div className="grid gap-4">
              {automations.map((automation) => {
                const info = TEMPLATE_INFO[automation.automation_type] || {
                  icon: <Settings2 className="h-5 w-5" />,
                  title: automation.automation_type,
                  description: 'Automation',
                };

                return (
                  <Card key={automation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            {info.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">{info.title}</h3>
                            <p className="text-sm text-muted-foreground">{info.description}</p>
                            {automation.schedule_cron && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                Schedule: {automation.schedule_cron}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`auto-${automation.id}`} className="text-sm">
                              {automation.is_enabled ? 'Enabled' : 'Disabled'}
                            </Label>
                            <Switch
                              id={`auto-${automation.id}`}
                              checked={automation.is_enabled}
                              onCheckedChange={() => handleToggleAutomation(automation)}
                            />
                          </div>
                          {(automation.automation_type === 'monthly_report' || automation.automation_type === 'recurring_invoices') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestAutomation(automation.automation_type)}
                              disabled={!automation.is_enabled}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {automation.automation_type === 'recurring_invoices' ? 'Send Invoices Now' : 'Run Now'}
                            </Button>
                          )}
                        </div>
                      </div>
                      {automation.last_run_at && (
                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                          Last triggered: {format(new Date(automation.last_run_at), 'MMMM d, yyyy \'at\' h:mm a')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Email Activity</CardTitle>
              <CardDescription>Last 50 emails sent from the system</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-pulse text-muted-foreground">Loading logs...</div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No emails sent yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {log.status === 'sent' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{log.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              To: {log.recipient_email}
                              {log.recipient_name && ` (${log.recipient_name})`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-xs">
                            {log.template_type.replace('_', ' ')}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.sent_at ? format(new Date(log.sent_at), 'MMM d, h:mm a') : 'Pending'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
