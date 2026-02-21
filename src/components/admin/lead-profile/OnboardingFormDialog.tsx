import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Send, CheckCircle2, Loader2 } from 'lucide-react';

const ONBOARDING_FIELDS = [
  { key: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g. Plumbing, Real Estate, Hospitality' },
  { key: 'businessDescription', label: 'Business Description', type: 'textarea', placeholder: 'Describe what the business does...' },
  { key: 'targetAudience', label: 'Target Audience', type: 'text', placeholder: 'Who are their ideal customers?' },
  { key: 'primaryGoal', label: 'Primary Goal', type: 'text', placeholder: 'e.g. Generate leads, Sell products, Build brand' },
  { key: 'designStyle', label: 'Design Style', type: 'text', placeholder: 'e.g. Modern, Minimalist, Bold, Corporate' },
  { key: 'currentWebsite', label: 'Current Website', type: 'text', placeholder: 'https://...' },
  { key: 'budget', label: 'Budget', type: 'text', placeholder: 'e.g. $2,000 - $5,000' },
  { key: 'timeline', label: 'Timeline', type: 'text', placeholder: 'e.g. 2 weeks, 1 month' },
  { key: 'brandColors', label: 'Brand Colours', type: 'text', placeholder: 'e.g. Navy blue, Gold, White' },
  { key: 'requiredPages', label: 'Required Pages', type: 'textarea', placeholder: 'e.g. Home, About, Services, Contact, Blog' },
  { key: 'integrations', label: 'Integrations Needed', type: 'text', placeholder: 'e.g. Google Maps, Booking system, Payment' },
  { key: 'inspirationSite1', label: 'Inspiration Site 1', type: 'text', placeholder: 'https://...' },
  { key: 'inspirationSite2', label: 'Inspiration Site 2', type: 'text', placeholder: 'https://...' },
  { key: 'contentReady', label: 'Content Ready?', type: 'text', placeholder: 'Yes / No / Need help' },
];

interface OnboardingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  onLeadUpdate?: (updatedLead: any) => void;
}

export function OnboardingFormDialog({ open, onOpenChange, lead, onLeadUpdate }: OnboardingFormDialogProps) {
  const { toast } = useToast();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Initialize form values from existing lead data
  useEffect(() => {
    if (open && lead?.form_data) {
      const initial: Record<string, string> = {};
      ONBOARDING_FIELDS.forEach(f => {
        initial[f.key] = lead.form_data[f.key] || '';
      });
      setFormValues(initial);
      setLastSaved(null);
    }
  }, [open, lead?.id]);

  // Auto-save with debounce
  const autoSave = useCallback(async (values: Record<string, string>) => {
    if (!lead?.id) return;
    const updatedFormData = { ...lead.form_data, ...values };
    const { error } = await supabase
      .from('leads')
      .update({ form_data: updatedFormData })
      .eq('id', lead.id);

    if (!error) {
      setLastSaved(new Date());
      onLeadUpdate?.({ ...lead, form_data: updatedFormData });
    }
  }, [lead, onLeadUpdate]);

  // Debounced save
  useEffect(() => {
    if (!open) return;
    const hasValues = Object.values(formValues).some(v => v.trim() !== '');
    if (!hasValues) return;

    const timer = setTimeout(() => autoSave(formValues), 1500);
    return () => clearTimeout(timer);
  }, [formValues, open, autoSave]);

  const handleChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const handleManualSave = async () => {
    setSaving(true);
    await autoSave(formValues);
    setSaving(false);
    toast({ title: 'Onboarding details saved' });
  };

  const handleSendToClient = async () => {
    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-onboarding-email', {
        body: { leadId: lead.id, email: lead.email, name: lead.name }
      });
      if (error) throw error;
      toast({ title: 'Onboarding form sent to client' });
    } catch (err: any) {
      toast({ title: 'Error sending email', description: err.message, variant: 'destructive' });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">Full Onboarding Details</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fill in during the call or send to the client's email. Changes auto-save.
          </p>
        </DialogHeader>

        <div className="flex items-center gap-2 pb-2">
          <Button size="sm" onClick={handleManualSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Now
          </Button>
          <Button size="sm" variant="outline" onClick={handleSendToClient} disabled={sendingEmail}>
            {sendingEmail ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Send to Client
          </Button>
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Auto-saved
            </span>
          )}
        </div>

        <Separator />

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {ONBOARDING_FIELDS.map(field => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key} className="text-sm font-medium">
                  {field.label}
                </Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    id={field.key}
                    value={formValues[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={field.key}
                    value={formValues[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
