import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Clock, Pencil, Save, BarChart3, Globe, Sparkles, Copy, Check, CheckCircle2, AlertCircle, ExternalLink, Link2 } from 'lucide-react';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MilestoneTimeline } from './MilestoneTimeline';
import { FormResponsesDisplay } from './FormResponsesDisplay';

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

export function ProjectTab({ lead, canEdit, onLeadUpdate }: ProjectTabProps) {
  const { updates, loading, addUpdate, deleteUpdate } = useProjectUpdates(lead.id);
  const [newUpdate, setNewUpdate] = useState('');
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editedFormData, setEditedFormData] = useState<Record<string, any>>({ ...lead.form_data });
  const [isSavingForm, setIsSavingForm] = useState(false);
  const { toast } = useToast();

  // AI Prompt state
  const [promptContext, setPromptContext] = useState('');
  const [designSuggestions, setDesignSuggestions] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState(lead.generated_prompt || '');
  const [researchInsights, setResearchInsights] = useState(lead.generated_prompt_research || '');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [promptGeneratedAt, setPromptGeneratedAt] = useState<string | null>(lead.prompt_generated_at || null);

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

  const handleGeneratePrompt = async () => {
    setIsGeneratingPrompt(true);
    setGeneratedPrompt('');
    setResearchInsights('');

    try {
      // Extract relevant info from form_data
      const formData = lead.form_data || {};
      const businessName = lead.business_name || formData.business_name || formData.businessName || 'Unknown Business';
      const location = formData.location || formData.city || formData.suburb || 'Australia';
      const industry = formData.industry || formData.business_type || formData.type || lead.project_type || 'General';
      const website = lead.website_url || formData.website || formData.current_website || '';
      
      // Combine admin context and design suggestions with form details
      let details = '';
      if (promptContext) details += `Context: ${promptContext}\n`;
      if (designSuggestions) details += `Design Suggestions: ${designSuggestions}\n`;
      
      // Add any other form data as additional details
      const excludeKeys = ['business_name', 'businessName', 'location', 'city', 'suburb', 'industry', 'business_type', 'type', 'website', 'current_website', 'email', 'phone', 'name'];
      Object.entries(formData).forEach(([key, value]) => {
        if (!excludeKeys.includes(key) && value) {
          details += `${formatKey(key)}: ${value}\n`;
        }
      });

      const { data, error } = await supabase.functions.invoke('generate-sales-prompt', {
        body: { businessName, location, industry, website, details: details.trim(), leadId: lead.id }
      });

      if (error) throw error;

      setGeneratedPrompt(data.prompt || '');
      setResearchInsights(data.research || '');
      setPromptGeneratedAt(new Date().toISOString());
      toast({ title: 'Prompt generated and saved' });
    } catch (error: any) {
      console.error('Error generating prompt:', error);
      toast({ 
        title: 'Error generating prompt', 
        description: error.message || 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const copyPromptToClipboard = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setPromptCopied(true);
    toast({ title: 'Prompt copied to clipboard' });
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const handleUpdateGAStatus = async (newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ ga_status: newStatus })
        .eq('id', lead.id)
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Google Analytics status updated' });
      
      if (onLeadUpdate && data) {
        onLeadUpdate(data);
      }
    } catch (error: any) {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    }
  };

  const gaStatus = lead.ga_status || 'not_connected';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Project Milestones - Horizontal Timeline */}
        <MilestoneTimeline leadId={lead.id} lead={lead} canEdit={canEdit} />
        
        {/* Google Analytics Status */}
        {(lead.ga_property_id || gaStatus !== 'not_connected') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Google Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {gaStatus === 'connected' ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Connected</p>
                        <p className="text-xs text-muted-foreground font-mono">{lead.ga_property_id}</p>
                      </div>
                    </>
                  ) : gaStatus === 'pending' ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium">Pending Setup</p>
                        <p className="text-xs text-muted-foreground font-mono">{lead.ga_property_id}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Not Connected</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {gaStatus === 'pending' && canEdit && (
                    <Button size="sm" onClick={() => handleUpdateGAStatus('connected')}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Mark Connected
                    </Button>
                  )}
                  {lead.ga_property_id && (
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href="https://analytics.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open GA
                      </a>
                    </Button>
                  )}
                </div>
              </div>
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

            {/* Form Responses - Categorized Display */}
            {lead.form_data && Object.keys(lead.form_data).length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-muted-foreground">Project Details</label>
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
                  <FormResponsesDisplay
                    formData={lead.form_data}
                    isEditing={isEditingForm}
                    editedFormData={editedFormData}
                    onFieldChange={handleFieldChange}
                  />
                  {isEditingForm && canEdit && (
                    <div className="pt-4 flex justify-end">
                      <Button onClick={handleSaveFormData} disabled={isSavingForm}>
                        <Save className="h-4 w-4 mr-1" />
                        {isSavingForm ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Generated Prompt Display - Always show if prompt exists */}
        {generatedPrompt && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Website Brief
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Research Insights */}
              {researchInsights && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Research Insights</h4>
                  <div className="bg-muted/30 rounded-lg p-4 text-sm max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {researchInsights}
                  </div>
                </div>
              )}

              {/* Generated Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">Generated Prompt</h4>
                    {promptGeneratedAt && (
                      <span className="text-xs text-muted-foreground">
                        (generated {format(new Date(promptGeneratedAt), 'PP')})
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={copyPromptToClipboard}>
                    {promptCopied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-sm max-h-96 overflow-y-auto whitespace-pre-wrap border">
                  {generatedPrompt}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Prompt Generator - Only show if no prompt generated yet */}
        {canEdit && !generatedPrompt && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Prompt Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate an AI prompt for this project based on form data. Add context and design suggestions to customize the output.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Additional Context</label>
                  <Textarea
                    placeholder="Add any additional context about the client or project (e.g., 'Client wants a minimalist feel', 'Focus on their premium service')..."
                    value={promptContext}
                    onChange={(e) => setPromptContext(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Design Suggestions</label>
                  <Textarea
                    placeholder="Add design preferences (e.g., 'Dark mode, bold typography, hero video section', 'Earthy colors, organic shapes')..."
                    value={designSuggestions}
                    onChange={(e) => setDesignSuggestions(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <Button 
                  onClick={handleGeneratePrompt} 
                  disabled={isGeneratingPrompt}
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGeneratingPrompt ? 'Generating...' : 'Generate AI Prompt'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
