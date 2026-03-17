import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, StickyNote, Monitor, ShieldCheck, Users, Briefcase, Settings, MessageSquare } from 'lucide-react';
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

// Step notes mapped to their section
const STEP_NOTES_SECTION: Record<string, string> = {
  basics: 'general',
  portals: 'general',
  fe_pages: 'front_end',
  fe_marketing: 'front_end',
  fe_design: 'front_end',
  admin_features: 'admin_portal',
  client_features: 'client_portal',
  staff_features: 'staff_portal',
  integrations: 'general',
  expectations: 'general',
};

const STEP_NOTES_LABELS: Record<string, string> = {
  basics: 'Project Basics Notes',
  portals: 'Portal Selection Notes',
  fe_pages: 'Pages Notes',
  fe_marketing: 'Marketing & CTAs Notes',
  fe_design: 'Design & Branding Notes',
  admin_features: 'Features & Auth Notes',
  client_features: 'Features & Access Notes',
  staff_features: 'Features & Roles Notes',
  integrations: 'Integrations Notes',
  expectations: 'Expectations Notes',
};

// Keys belonging to each view tab
const GENERAL_KEYS = ['businessName', 'projectType', 'primaryGoal', 'desiredLaunchDate', 'existingWebsite', 'selectedPortals', 'budgetRange', 'revisionRounds', 'communicationMethod', 'competitorSites', 'notes', 'integrations.selected', 'integrations.customIntegrations'];
const FRONT_END_KEYS = ['selectedPages', 'frontEnd.corePages', 'frontEnd.marketingPages', 'frontEnd.customPages', 'frontEnd.ctas', 'frontEnd.customCtas', 'frontEnd.hasExistingBranding', 'frontEnd.designStyle', 'frontEnd.mainColour', 'frontEnd.secondaryColour', 'frontEnd.accentColour', 'frontEnd.needsLogo', 'frontEnd.logoType'];
const ADMIN_KEYS = ['adminPortal.features', 'adminPortal.dashboardWidgets', 'adminPortal.authMethod', 'adminPortal.userRoles', 'adminPortal.customRoles', 'adminPortal.notifications', 'adminPortal.customNeeds'];
const CLIENT_KEYS = ['clientPortal.features', 'clientPortal.loginMethod', 'clientPortal.selfServiceFeatures', 'clientPortal.communicationFeatures', 'clientPortal.customNeeds'];
const STAFF_KEYS = ['staffPortal.features', 'staffPortal.roleTypes', 'staffPortal.customRoles', 'staffPortal.permissions', 'staffPortal.managementFeatures', 'staffPortal.customNeeds'];

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

  const formatValue = (key: string, val: string): string | string[] => {
    if (key === 'budgetRange') return BUDGET_MAP[val] || val;
    if (key === 'projectType') return PROJECT_TYPE_MAP[val] || val;
    if (key === 'selectedPortals') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.map(p => PORTAL_LABEL_MAP[p] || p);
      } catch {}
      return val;
    }
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return val;
  };

  const isColourKey = (key: string) => key.includes('Colour') || key.includes('mainColour') || key.includes('secondaryColour') || key.includes('accentColour');

  const renderAnswerItem = (key: string, rawVal: string) => {
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
        ) : isColourKey(key) && val.startsWith('#') ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: val }} />
            <p className="text-sm">{val}</p>
          </div>
        ) : (
          <p className="text-sm">{val || '—'}</p>
        )}
      </div>
    );
  };

  // Parse stepNotes from answers
  const stepNotes: Record<string, string> = {};
  try {
    const notesStr = answers['stepNotes'];
    if (notesStr) {
      const parsed = JSON.parse(notesStr);
      if (typeof parsed === 'object' && parsed !== null) {
        Object.assign(stepNotes, parsed);
      }
    }
  } catch {}

  const renderNotesForSection = (section: string) => {
    const relevantNotes = Object.entries(STEP_NOTES_SECTION)
      .filter(([, sec]) => sec === section)
      .map(([stepId]) => ({ stepId, note: stepNotes[stepId] }))
      .filter(n => n.note && n.note.trim());

    if (relevantNotes.length === 0) return null;

    return (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <StickyNote className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</p>
        </div>
        <div className="space-y-3">
          {relevantNotes.map(({ stepId, note }) => (
            <div key={stepId} className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">{STEP_NOTES_LABELS[stepId] || stepId}</p>
              <p className="text-sm whitespace-pre-wrap">{note}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSection = (keys: string[], sectionId: string) => {
    const entries = keys
      .filter(k => answers[k] && answers[k] !== '[]' && answers[k] !== '' && answers[k] !== '""')
      .map(k => [k, answers[k]] as [string, string]);

    return (
      <div className="space-y-4">
        {entries.length === 0 && !renderNotesForSection(sectionId) ? (
          <div className="py-4 text-center text-muted-foreground text-sm">No answers recorded for this section.</div>
        ) : (
          <>
            {entries.map(([key, val]) => renderAnswerItem(key, val))}
            {renderNotesForSection(sectionId)}
          </>
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
            // Single tab — no need for tab UI
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
