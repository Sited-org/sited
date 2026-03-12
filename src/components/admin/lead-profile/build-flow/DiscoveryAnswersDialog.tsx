import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiscoveryAnswersDialogProps {
  buildFlowId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LABEL_MAP: Record<string, string> = {
  businessName: 'Business Name',
  projectType: 'Project Type',
  primaryGoal: 'Primary Goal',
  targetAudience: 'Target Audience',
  desiredLaunchDate: 'Desired Launch Date',
  selectedPages: 'Selected Pages',
  selectedFeatures: 'Selected Features',
  selectedIntegrations: 'Selected Integrations',
  budgetRange: 'Budget Range',
  revisionRounds: 'Revision Rounds',
  communicationMethod: 'Communication Method',
  notes: 'Additional Notes',
  existingWebsite: 'Existing Website',
  competitorSites: 'Competitor Sites',
};

const BUDGET_MAP: Record<string, string> = {
  under_1k: 'Under $1k',
  '1k_3k': '$1k – $3k',
  '3k_5k': '$3k – $5k',
  '5k_10k': '$5k – $10k',
  '10k_plus': '$10k+',
};

const PROJECT_TYPE_MAP: Record<string, string> = {
  brochure: 'Brochure / Info Site',
  ecommerce: 'E-Commerce Store',
  webapp: 'Web App / SaaS / Portal',
  booking: 'Booking / Service Site',
};

export function DiscoveryAnswersDialog({ buildFlowId, open, onOpenChange }: DiscoveryAnswersDialogProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from('discovery_answers')
      .select('question_key, answer_value')
      .eq('build_flow_id', buildFlowId)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach((row: any) => {
          map[row.question_key] = row.answer_value;
        });
        setAnswers(map);
        setLoading(false);
      });
  }, [open, buildFlowId]);

  const formatValue = (key: string, val: string) => {
    if (key === 'budgetRange') return BUDGET_MAP[val] || val;
    if (key === 'projectType') return PROJECT_TYPE_MAP[val] || val;
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return val;
  };

  const orderedKeys = [
    'businessName', 'projectType', 'primaryGoal', 'targetAudience', 'desiredLaunchDate',
    'selectedPages', 'selectedFeatures', 'selectedIntegrations',
    'budgetRange', 'revisionRounds', 'communicationMethod',
    'existingWebsite', 'competitorSites', 'notes',
  ];

  const sortedEntries = orderedKeys
    .filter(k => answers[k] && answers[k] !== '[]' && answers[k] !== '')
    .map(k => [k, answers[k]] as [string, string]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Discovery Form Answers
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading answers...</div>
          ) : sortedEntries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No discovery answers found.</div>
          ) : (
            <div className="space-y-4">
              {sortedEntries.map(([key, rawVal]) => {
                const label = LABEL_MAP[key] || key;
                const val = formatValue(key, rawVal);
                return (
                  <div key={key} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                    {Array.isArray(val) ? (
                      <div className="flex flex-wrap gap-1.5">
                        {val.map((item: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">{val || '—'}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
