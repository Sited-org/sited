import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, StickyNote, Monitor, ShieldCheck, Users, Briefcase, Settings, Wrench, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  selectedPortals: 'Selected Portals',
  // Front End
  'frontEnd.corePages': 'Core Pages',
  'frontEnd.marketingPages': 'Marketing Pages',
  'frontEnd.customPages': 'Custom Pages',
  'frontEnd.ctas': 'Call-to-Actions',
  'frontEnd.customCtas': 'Custom CTAs',
  'frontEnd.hasExistingBranding': 'Has Existing Branding',
  'frontEnd.designStyle': 'Design Style',
  'frontEnd.mainColour': 'Main Colour',
  'frontEnd.secondaryColour': 'Secondary Colour',
  'frontEnd.accentColour': 'Accent Colour',
  'frontEnd.needsLogo': 'Needs Logo',
  'frontEnd.logoType': 'Logo Type',
  // Admin
  'adminPortal.features': 'Admin Features',
  'adminPortal.dashboardWidgets': 'Dashboard Widgets',
  'adminPortal.authMethod': 'Auth Method',
  'adminPortal.userRoles': 'User Roles',
  'adminPortal.customRoles': 'Custom Roles',
  'adminPortal.notifications': 'Notifications',
  'adminPortal.customNeeds': 'Additional Requirements',
  // Client
  'clientPortal.features': 'Client Features',
  'clientPortal.loginMethod': 'Login Method',
  'clientPortal.selfServiceFeatures': 'Self-Service Features',
  'clientPortal.communicationFeatures': 'Communication Features',
  'clientPortal.customNeeds': 'Additional Requirements',
  // Staff
  'staffPortal.features': 'Staff Features',
  'staffPortal.roleTypes': 'Staff Role Types',
  'staffPortal.customRoles': 'Custom Roles',
  'staffPortal.permissions': 'Permissions',
  'staffPortal.managementFeatures': 'Management Features',
  'staffPortal.customNeeds': 'Additional Requirements',
  // Integrations
  'integrations.selected': 'Selected Integrations',
  'integrations.customIntegrations': 'Custom Integrations',
  // Step Notes (flattened)
  'stepNotes.basics': 'Project Basics Notes',
  'stepNotes.portals': 'Portal Selection Notes',
  'stepNotes.fe_pages': 'Pages Notes',
  'stepNotes.fe_marketing': 'Marketing & CTAs Notes',
  'stepNotes.fe_design': 'Design & Branding Notes',
  'stepNotes.admin_features': 'Admin Features & Auth Notes',
  'stepNotes.client_features': 'Client Features & Access Notes',
  'stepNotes.staff_features': 'Staff Features & Roles Notes',
  'stepNotes.integrations': 'Integrations Notes',
  'stepNotes.expectations': 'Expectations Notes',
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

const PORTAL_LABEL_MAP: Record<string, string> = {
  front_end: 'Front End',
  admin_portal: 'Admin Portal',
  client_portal: 'Client Portal',
  staff_portal: 'Staff Portal',
};

// Map stepNote keys to their section for rendering
const STEP_NOTE_SECTION: Record<string, string> = {
  'stepNotes.basics': 'general',
  'stepNotes.portals': 'general',
  'stepNotes.fe_pages': 'front_end',
  'stepNotes.fe_marketing': 'front_end',
  'stepNotes.fe_design': 'front_end',
  'stepNotes.admin_features': 'admin_portal',
  'stepNotes.client_features': 'client_portal',
  'stepNotes.staff_features': 'staff_portal',
  'stepNotes.integrations': 'general',
  'stepNotes.expectations': 'general',
};

// Keys belonging to each view tab (data keys, excluding notes)
const GENERAL_KEYS = ['businessName', 'projectType', 'primaryGoal', 'desiredLaunchDate', 'existingWebsite', 'selectedPortals', 'budgetRange', 'revisionRounds', 'communicationMethod', 'competitorSites', 'notes', 'integrations.selected', 'integrations.customIntegrations'];
const FRONT_END_KEYS = ['frontEnd.corePages', 'frontEnd.marketingPages', 'frontEnd.customPages', 'frontEnd.ctas', 'frontEnd.customCtas', 'frontEnd.hasExistingBranding', 'frontEnd.designStyle', 'frontEnd.mainColour', 'frontEnd.secondaryColour', 'frontEnd.accentColour', 'frontEnd.needsLogo', 'frontEnd.logoType'];
const ADMIN_KEYS = ['adminPortal.features', 'adminPortal.dashboardWidgets', 'adminPortal.authMethod', 'adminPortal.userRoles', 'adminPortal.customRoles', 'adminPortal.notifications', 'adminPortal.customNeeds'];
const CLIENT_KEYS = ['clientPortal.features', 'clientPortal.loginMethod', 'clientPortal.selfServiceFeatures', 'clientPortal.communicationFeatures', 'clientPortal.customNeeds'];
const STAFF_KEYS = ['staffPortal.features', 'staffPortal.roleTypes', 'staffPortal.customRoles', 'staffPortal.permissions', 'staffPortal.managementFeatures', 'staffPortal.customNeeds'];

export function DiscoveryAnswersDialog({ buildFlowId, open, onOpenChange }: DiscoveryAnswersDialogProps) {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

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
          const key = row.question_key;
          const val = row.answer_value;

          // Handle legacy shallow keys: if a key like "frontEnd" has a JSON object value,
          // expand it into dot-notation keys
          if (!key.includes('.') && ['frontEnd', 'adminPortal', 'clientPortal', 'staffPortal', 'integrations', 'stepNotes'].includes(key)) {
            try {
              const parsed = JSON.parse(val);
              if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                for (const [subKey, subVal] of Object.entries(parsed)) {
                  map[`${key}.${subKey}`] = typeof subVal === 'string' ? subVal : JSON.stringify(subVal);
                }
                return; // don't store the parent key
              }
            } catch { /* not JSON, store as-is */ }
          }

          map[key] = val;
        });
        setAnswers(map);
        setLoading(false);
      });
  }, [open, buildFlowId]);

  const formatValue = (key: string, val: string): string | string[] => {
    if (key === 'budgetRange') return BUDGET_MAP[val] || val;
    if (key === 'projectType') return PROJECT_TYPE_MAP[val] || val;
    if (key === 'selectedPortals') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.map((p: string) => PORTAL_LABEL_MAP[p] || p);
      } catch {}
      return val;
    }
    if (key === 'frontEnd.hasExistingBranding') {
      const map: Record<string, string> = { yes: 'Yes', no: 'No', partial: 'Partial' };
      return map[val] || val;
    }
    if (key === 'frontEnd.needsLogo') {
      return val === 'yes' ? 'Yes' : val === 'no' ? 'No' : val;
    }
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return val;
  };

  const isColourKey = (key: string) => key.includes('Colour');
  const isNoteKey = (key: string) => key.startsWith('stepNotes.');
  const isEmptyValue = (val: string) => !val || val === '[]' || val === '' || val === '""' || val === '0';

  const renderAnswerItem = (key: string, rawVal: string) => {
    const label = LABEL_MAP[key] || key;
    const val = formatValue(key, rawVal);

    // Render notes differently
    if (isNoteKey(key)) {
      return (
        <div key={key} className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-sm whitespace-pre-wrap">{rawVal}</p>
        </div>
      );
    }

    return (
      <div key={key} className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        {Array.isArray(val) ? (
          <div className="flex flex-wrap gap-1.5">
            {val.map((item: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
            ))}
          </div>
        ) : isColourKey(key) && typeof val === 'string' && val.startsWith('#') ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: val }} />
            <p className="text-sm">{val}</p>
          </div>
        ) : (
          <p className="text-sm">{(typeof val === 'string' ? val : String(val)) || '—'}</p>
        )}
      </div>
    );
  };

  // Get notes for a given section
  const getNotesForSection = (sectionId: string) => {
    return Object.entries(STEP_NOTE_SECTION)
      .filter(([, sec]) => sec === sectionId)
      .map(([noteKey]) => ({ noteKey, value: answers[noteKey] }))
      .filter(n => n.value && n.value.trim());
  };

  const renderSection = (keys: string[], sectionId: string) => {
    const dataEntries = keys
      .filter(k => answers[k] && !isEmptyValue(answers[k]))
      .map(k => [k, answers[k]] as [string, string]);

    const sectionNotes = getNotesForSection(sectionId);

    if (dataEntries.length === 0 && sectionNotes.length === 0) {
      return (
        <div className="py-4 text-center text-muted-foreground text-sm">No answers recorded for this section.</div>
      );
    }

    return (
      <div className="space-y-4">
        {dataEntries.map(([key, val]) => renderAnswerItem(key, val))}

        {sectionNotes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</p>
            </div>
            <div className="space-y-3">
              {sectionNotes.map(({ noteKey, value }) => renderAnswerItem(noteKey, value))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Determine which portals were selected
  const selectedPortals: string[] = [];
  try {
    const p = JSON.parse(answers['selectedPortals'] || '[]');
    if (Array.isArray(p)) selectedPortals.push(...p);
  } catch {}

  const tabs: { id: string; label: string; icon: React.ReactNode; keys: string[]; section: string }[] = [
    { id: 'general', label: 'General', icon: <Settings className="h-4 w-4" />, keys: GENERAL_KEYS, section: 'general' },
  ];

  if (selectedPortals.includes('front_end')) {
    tabs.push({ id: 'front_end', label: 'Front End', icon: <Monitor className="h-4 w-4" />, keys: FRONT_END_KEYS, section: 'front_end' });
  }
  if (selectedPortals.includes('admin_portal')) {
    tabs.push({ id: 'admin_portal', label: 'Admin', icon: <ShieldCheck className="h-4 w-4" />, keys: ADMIN_KEYS, section: 'admin_portal' });
  }
  if (selectedPortals.includes('client_portal')) {
    tabs.push({ id: 'client_portal', label: 'Client', icon: <Users className="h-4 w-4" />, keys: CLIENT_KEYS, section: 'client_portal' });
  }
  if (selectedPortals.includes('staff_portal')) {
    tabs.push({ id: 'staff_portal', label: 'Staff', icon: <Briefcase className="h-4 w-4" />, keys: STAFF_KEYS, section: 'staff_portal' });
  }

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
          ) : Object.keys(answers).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No discovery answers found.</div>
          ) : tabs.length <= 1 ? (
            renderSection(GENERAL_KEYS, 'general')
          ) : (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full flex-wrap h-auto gap-1 mb-4">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5 text-xs">
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map(tab => (
                <TabsContent key={tab.id} value={tab.id}>
                  {renderSection(tab.keys, tab.section)}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
