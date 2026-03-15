import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Rocket, Calendar, Plus, X, Monitor, ShieldCheck, Users, Briefcase, Send, StickyNote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiscoveryFormProps {
  leadId: string;
  leadName: string;
  leadBusinessName: string;
  onSubmit: (data: DiscoveryData) => Promise<void>;
}

export interface DiscoveryData {
  businessName: string;
  projectType: 'brochure' | 'ecommerce' | 'webapp' | 'booking';
  primaryGoal: string;
  desiredLaunchDate: string;
  selectedPages: string[];
  selectedFeatures: string[];
  selectedIntegrations: string[];
  budgetRange: string;
  revisionRounds: number;
  communicationMethod: string;
  notes: string;
  existingWebsite: string;
  competitorSites: string;
  selectedPortals: string[];
  frontEnd: FrontEndData;
  adminPortal: AdminPortalData;
  clientPortal: ClientPortalData;
  staffPortal: StaffPortalData;
  stepNotes: Record<string, string>;
}

interface FrontEndData {
  corePages: string[];
  marketingPages: string[];
  customPages: string[];
  ctas: string[];
  customCtas: string[];
  hasExistingBranding: 'yes' | 'no' | 'partial' | '';
  designStyle: string;
  mainColour: string;
  secondaryColour: string;
  accentColour: string;
  needsLogo: 'yes' | 'no' | '';
  logoType: string;
  integrations: string[];
  customIntegrations: string;
}

interface AdminPortalData {
  features: string[];
  dashboardWidgets: string[];
  authMethod: string;
  userRoles: string[];
  customRoles: string[];
  notifications: string[];
  integrations: string[];
  customIntegrations: string;
  customNeeds: string;
}

interface ClientPortalData {
  features: string[];
  loginMethod: string;
  selfServiceFeatures: string[];
  communicationFeatures: string[];
  integrations: string[];
  customIntegrations: string;
  customNeeds: string;
}

interface StaffPortalData {
  features: string[];
  roleTypes: string[];
  customRoles: string[];
  permissions: string[];
  managementFeatures: string[];
  integrations: string[];
  customIntegrations: string;
  customNeeds: string;
}

// ─── Options ───────────────────────────────────────────────────────────────────

const PORTAL_OPTIONS = [
  { value: 'front_end', label: 'Front End', icon: Monitor, desc: 'Public-facing website' },
  { value: 'admin_portal', label: 'Admin Portal', icon: ShieldCheck, desc: 'Internal management dashboard' },
  { value: 'client_portal', label: 'Client Portal', icon: Users, desc: 'Client self-service area' },
  { value: 'staff_portal', label: 'Staff Portal', icon: Briefcase, desc: 'Employee/team workspace' },
];

// Front End options
const FE_CORE_PAGES = ['Home', 'Our Services', 'Our Products', 'Contact', 'Testimonials', 'Portfolio', 'Pricing', 'About'];
const FE_MARKETING_PAGES = ['Landing Page (Campaign)', 'Offer', 'Book'];
const FE_CTAS = ['Book a Call', 'Enquire', 'Free Quote', 'Get Quote', 'Contact', 'Buy Now'];
const FE_DESIGN_STYLES = ['Professional / Minimalist', 'Bold / Maximalist', 'Artistic / Colourful'];
const FE_LOGO_TYPES = ['Icon', 'Mascot', 'Text'];
const FE_INTEGRATIONS = [
  'Calendar / Booking', 'Google Maps', 'Social Media Feed', 'AI Chatbot', 'Reviews Widget', 'Payments',
];

// Admin Portal options
const ADMIN_FEATURES = [
  'Lead / CRM Management', 'Content Management', 'User Management', 'Analytics Dashboard',
  'Financial / Invoicing', 'Email Automation', 'Booking Management', 'File Management',
];
const ADMIN_WIDGETS = ['Revenue Chart', 'Lead Pipeline', 'Recent Activity', 'Upcoming Bookings', 'Task Summary', 'Conversion Funnel'];
const ADMIN_AUTH_METHODS = ['Email + OTP', 'Email + Password', 'SSO / Google OAuth'];
const ADMIN_ROLES = ['Owner', 'Admin', 'Editor', 'Viewer'];
const ADMIN_NOTIFICATIONS = ['Email Alerts', 'Slack Integration', 'SMS Alerts'];
const ADMIN_INTEGRATIONS = ['Stripe', 'Slack', 'Resend', 'Zapier', 'Google Analytics', 'Blog / CMS', 'Service M8', 'Xero', 'HubSpot', 'Mailchimp', 'Salesforce', 'GHL'];

// Client Portal options
const CLIENT_FEATURES = [
  'Project Progress Tracker', 'Invoice / Payment History', 'File Uploads', 'Request System',
  'Messaging / Chat', 'Document Signing', 'Subscription Management',
];
const CLIENT_LOGIN_METHODS = ['Email + OTP (Passwordless)', 'Email + Password', 'Access Code', 'Magic Link'];
const CLIENT_SELF_SERVICE = ['Update Profile', 'View Invoices', 'Make Payments', 'Submit Requests', 'Download Files', 'View Project Status'];
const CLIENT_COMMS = ['In-Portal Messaging', 'Email Notifications', 'SMS Updates', 'File Sharing'];

// Staff Portal options
const STAFF_FEATURES = [
  'Task Management', 'Time Tracking', 'Client Project View', 'Internal Chat',
  'Schedule / Calendar', 'Knowledge Base', 'Performance Metrics',
];
const STAFF_ROLE_TYPES = ['Developer', 'Designer', 'Project Manager', 'Sales Rep', 'Support'];
const STAFF_PERMISSIONS = ['View All Projects', 'Edit Assigned Only', 'Manage Team', 'Access Financials', 'Admin Override'];
const STAFF_MANAGEMENT = ['Kanban Board', 'Gantt Chart', 'Daily Standup Notes', 'Sprint Planning', 'Bug Tracker'];
const STAFF_INTEGRATIONS = ['GitHub', 'Figma', 'Slack', 'Jira', 'Notion', 'Linear'];

// ─── Component ─────────────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'discovery_draft_';

function getDefaultData(leadBusinessName: string): DiscoveryData {
  return {
    businessName: leadBusinessName || '',
    projectType: 'brochure',
    primaryGoal: '',
    desiredLaunchDate: '',
    selectedPages: [],
    selectedFeatures: [],
    selectedIntegrations: [],
    budgetRange: '',
    revisionRounds: 2,
    communicationMethod: 'Email',
    notes: '',
    existingWebsite: '',
    competitorSites: '',
    selectedPortals: [],
    stepNotes: {},
    frontEnd: {
      corePages: [], marketingPages: [], customPages: [], ctas: [], customCtas: [],
      hasExistingBranding: '', designStyle: '', mainColour: '', secondaryColour: '', accentColour: '',
      needsLogo: '', logoType: '', integrations: [], customIntegrations: '',
    },
    adminPortal: {
      features: [], dashboardWidgets: [], authMethod: '', userRoles: [], customRoles: [],
      notifications: [], integrations: [], customIntegrations: '', customNeeds: '',
    },
    clientPortal: {
      features: [], loginMethod: '', selfServiceFeatures: [], communicationFeatures: [],
      integrations: [], customIntegrations: '', customNeeds: '',
    },
    staffPortal: {
      features: [], roleTypes: [], customRoles: [], permissions: [], managementFeatures: [],
      integrations: [], customIntegrations: '', customNeeds: '',
    },
  };
}

export function DiscoveryForm({ leadId, leadName, leadBusinessName, onSubmit }: DiscoveryFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const storageKey = `${STORAGE_KEY_PREFIX}${leadId}`;
  const initialised = useRef(false);

  // Restore draft from localStorage on mount
  const [data, setData] = useState<DiscoveryData>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.data) return { ...getDefaultData(leadBusinessName), ...parsed.data };
      }
    } catch { /* ignore corrupt data */ }
    return getDefaultData(leadBusinessName);
  });

  // ─── Dynamic step calculation ────────────────────────────────────────────
  const buildSteps = useCallback(() => {
    const steps: { id: string; label: string; portalLabel?: string }[] = [
      { id: 'basics', label: 'Project Basics' },
      { id: 'portals', label: 'Select Portals' },
    ];

    if (data.selectedPortals.includes('front_end')) {
      steps.push({ id: 'fe_pages', label: 'Pages', portalLabel: 'Front End' });
      steps.push({ id: 'fe_marketing', label: 'Marketing & CTAs', portalLabel: 'Front End' });
      steps.push({ id: 'fe_design', label: 'Design & Branding', portalLabel: 'Front End' });
      steps.push({ id: 'fe_integrations', label: 'Integrations', portalLabel: 'Front End' });
    }

    if (data.selectedPortals.includes('admin_portal')) {
      steps.push({ id: 'admin_features', label: 'Features & Auth', portalLabel: 'Admin Portal' });
      steps.push({ id: 'admin_integrations', label: 'Integrations', portalLabel: 'Admin Portal' });
    }

    if (data.selectedPortals.includes('client_portal')) {
      steps.push({ id: 'client_features', label: 'Features & Access', portalLabel: 'Client Portal' });
    }

    if (data.selectedPortals.includes('staff_portal')) {
      steps.push({ id: 'staff_features', label: 'Features & Roles', portalLabel: 'Staff Portal' });
      steps.push({ id: 'staff_integrations', label: 'Integrations', portalLabel: 'Staff Portal' });
    }

    steps.push({ id: 'expectations', label: 'Client Expectations' });
    return steps;
  }, [data.selectedPortals]);

  const steps = buildSteps();
  const [stepIndex, setStepIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.stepIndex === 'number') return Math.min(parsed.stepIndex, steps.length - 1);
      }
    } catch { /* ignore */ }
    return 0;
  });

  // Auto-save draft to localStorage (debounced 500ms)
  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      return;
    }
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ data, stepIndex }));
      } catch { /* storage full — silently ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [data, stepIndex, storageKey]);

  // beforeunload guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (data.selectedPortals.length > 0 || data.businessName !== leadBusinessName) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [data, leadBusinessName]);

  const currentStep = steps[stepIndex] || steps[0];
  const totalSteps = steps.length;
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  const canGoNext = () => {
    if (currentStep.id === 'basics') return !!data.businessName;
    if (currentStep.id === 'portals') return data.selectedPortals.length > 0;
    return true;
  };

  const goNext = () => {
    const newSteps = buildSteps();
    if (stepIndex < newSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const toggleItem = (list: string[], item: string) =>
    list.includes(item) ? list.filter(i => i !== item) : [...list, item];

  const updateFE = (partial: Partial<FrontEndData>) =>
    setData(d => ({ ...d, frontEnd: { ...d.frontEnd, ...partial } }));

  const updateAdmin = (partial: Partial<AdminPortalData>) =>
    setData(d => ({ ...d, adminPortal: { ...d.adminPortal, ...partial } }));

  const updateClient = (partial: Partial<ClientPortalData>) =>
    setData(d => ({ ...d, clientPortal: { ...d.clientPortal, ...partial } }));

  const updateStaff = (partial: Partial<StaffPortalData>) =>
    setData(d => ({ ...d, staffPortal: { ...d.staffPortal, ...partial } }));

  const updateStepNote = (stepId: string, value: string) =>
    setData(d => ({ ...d, stepNotes: { ...d.stepNotes, [stepId]: value } }));

  const flattenForSubmit = (): DiscoveryData => {
    const allPages = [...data.frontEnd.corePages, ...data.frontEnd.marketingPages, ...data.frontEnd.customPages];
    const allFeatures = [
      ...data.adminPortal.features, ...data.clientPortal.features, ...data.staffPortal.features,
    ];
    const allIntegrations = [
      ...data.frontEnd.integrations, ...data.adminPortal.integrations,
      ...data.clientPortal.integrations, ...data.staffPortal.integrations,
    ];
    return { ...data, selectedPages: allPages, selectedFeatures: allFeatures, selectedIntegrations: [...new Set(allIntegrations)] };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(flattenForSubmit());
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    setSubmitting(false);
  };

  const handleSendBrandingAcquisition = () => {
    toast({
      title: 'Branding acquisition sent',
      description: 'A branding collection form has been sent to the client portal.',
    });
    // TODO: Implement backend — create client portal task, send notification, log in comms
  };

  // ─── Reusable sub-components ─────────────────────────────────────────────

  const CheckboxGroup = ({ items, selected, onToggle, cols = 2 }: { items: string[]; selected: string[]; onToggle: (item: string) => void; cols?: number }) => (
    <div className={`grid grid-cols-1 ${cols === 2 ? 'sm:grid-cols-2' : cols === 3 ? 'sm:grid-cols-3' : ''} gap-2`}>
      {items.map(item => (
        <label key={item} className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
          <Checkbox checked={selected.includes(item)} onCheckedChange={() => onToggle(item)} />
          <span className="text-sm">{item}</span>
        </label>
      ))}
    </div>
  );

  const AddCustomField = ({ items, onAdd, onRemove, placeholder }: { items: string[]; onAdd: (val: string) => void; onRemove: (val: string) => void; placeholder: string }) => {
    const [val, setVal] = useState('');
    return (
      <div className="space-y-2">
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {items.map(item => (
              <Badge key={item} variant="secondary" className="gap-1 pr-1">
                {item}
                <button onClick={() => onRemove(item)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} className="flex-1" onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { e.preventDefault(); onAdd(val.trim()); setVal(''); } }} />
          <Button type="button" size="sm" variant="outline" onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>
    );
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <Label className="text-muted-foreground mb-2 block text-xs uppercase tracking-wider font-semibold">{children}</Label>
  );

  const StepNotesSection = ({ stepId }: { stepId: string }) => (
    <div className="mt-6 pt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Notes</Label>
      </div>
      <Textarea
        value={data.stepNotes?.[stepId] || ''}
        onChange={e => updateStepNote(stepId, e.target.value)}
        placeholder="Add any specific notes, client requests, or details discussed for this section..."
        rows={3}
        className="text-sm"
      />
    </div>
  );

  // ─── Step content ────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep.id) {
      // ── BASICS ──
      case 'basics':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Project Basics</h3>
            <div>
              <Label>Client / Business Name</Label>
              <Input value={data.businessName} onChange={e => setData({ ...data, businessName: e.target.value })} placeholder="Business name" className="mt-1" />
            </div>
            <div>
              <Label>Primary Goal</Label>
              <Textarea value={data.primaryGoal} onChange={e => setData({ ...data, primaryGoal: e.target.value })} placeholder="What is the main purpose of this website?" className="mt-1" rows={3} />
            </div>
            <div>
              <Label>Existing Website URL</Label>
              <Input value={data.existingWebsite} onChange={e => setData({ ...data, existingWebsite: e.target.value })} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Desired Launch Date</Label>
              <Input type="date" value={data.desiredLaunchDate} onChange={e => setData({ ...data, desiredLaunchDate: e.target.value })} className="mt-1" />
            </div>
            <StepNotesSection stepId="basics" />
          </div>
        );

      // ── PORTAL SELECTION ──
      case 'portals':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What are we building?</h3>
            <p className="text-sm text-muted-foreground">Select all that apply — we'll gather details for each one.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PORTAL_OPTIONS.map(opt => {
                const selected = data.selectedPortals.includes(opt.value);
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setData(d => ({ ...d, selectedPortals: toggleItem(d.selectedPortals, opt.value) }))}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-muted-foreground/40'}`}
                  >
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <StepNotesSection stepId="portals" />
          </div>
        );

      // ── FRONT END: PAGES ──
      case 'fe_pages':
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Front End — Required Pages</h3>
            <div>
              <SectionLabel>Core Pages</SectionLabel>
              <CheckboxGroup items={FE_CORE_PAGES} selected={data.frontEnd.corePages} onToggle={item => updateFE({ corePages: toggleItem(data.frontEnd.corePages, item) })} />
            </div>
            <div>
              <SectionLabel>Marketing Pages</SectionLabel>
              <CheckboxGroup items={FE_MARKETING_PAGES} selected={data.frontEnd.marketingPages} onToggle={item => updateFE({ marketingPages: toggleItem(data.frontEnd.marketingPages, item) })} />
            </div>
            <div>
              <SectionLabel>Custom Pages</SectionLabel>
              <AddCustomField
                items={data.frontEnd.customPages}
                onAdd={val => updateFE({ customPages: [...data.frontEnd.customPages, val] })}
                onRemove={val => updateFE({ customPages: data.frontEnd.customPages.filter(p => p !== val) })}
                placeholder="Enter custom page name"
              />
            </div>
            <StepNotesSection stepId="fe_pages" />
          </div>
        );

      // ── FRONT END: MARKETING ──
      case 'fe_marketing':
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Front End — Marketing & CTAs</h3>
            <div>
              <SectionLabel>Call-to-Actions (Select all that apply)</SectionLabel>
              <CheckboxGroup items={FE_CTAS} selected={data.frontEnd.ctas} onToggle={item => updateFE({ ctas: toggleItem(data.frontEnd.ctas, item) })} />
            </div>
            <div>
              <SectionLabel>Custom CTAs</SectionLabel>
              <AddCustomField
                items={data.frontEnd.customCtas}
                onAdd={val => updateFE({ customCtas: [...data.frontEnd.customCtas, val] })}
                onRemove={val => updateFE({ customCtas: data.frontEnd.customCtas.filter(c => c !== val) })}
                placeholder="Enter custom CTA text"
              />
            </div>
            <StepNotesSection stepId="fe_marketing" />
          </div>
        );

      // ── FRONT END: DESIGN ──
      case 'fe_design':
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Front End — Design & Branding</h3>
            <div>
              <Label>Do you already have logos / branding?</Label>
              <div className="flex gap-2 mt-2">
                {(['yes', 'no', 'partial'] as const).map(v => (
                  <Button key={v} type="button" size="sm" variant={data.frontEnd.hasExistingBranding === v ? 'default' : 'outline'} onClick={() => updateFE({ hasExistingBranding: v })} className="capitalize">
                    {v}
                  </Button>
                ))}
              </div>
            </div>

            {/* Send Branding Acquisition button for Yes or Partial */}
            {(data.frontEnd.hasExistingBranding === 'yes' || data.frontEnd.hasExistingBranding === 'partial') && (
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      {data.frontEnd.hasExistingBranding === 'yes'
                        ? 'Collect existing branding assets from the client'
                        : 'Collect partial branding & gather remaining preferences'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sends a branding collection form to the client portal as a pending task.
                    </p>
                  </div>
                  <Button type="button" size="sm" onClick={handleSendBrandingAcquisition} className="flex-shrink-0">
                    <Send className="h-4 w-4 mr-2" /> Send Branding Acquisition
                  </Button>
                </div>
              </div>
            )}

            {(data.frontEnd.hasExistingBranding === 'no' || data.frontEnd.hasExistingBranding === 'partial') && (
              <>
                <div>
                  <Label>What style do you like?</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {FE_DESIGN_STYLES.map(style => (
                      <Button key={style} type="button" size="sm" variant={data.frontEnd.designStyle === style ? 'default' : 'outline'} onClick={() => updateFE({ designStyle: style })}>
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Main Colour</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="color" value={data.frontEnd.mainColour || '#000000'} onChange={e => updateFE({ mainColour: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                      <Input value={data.frontEnd.mainColour} onChange={e => updateFE({ mainColour: e.target.value })} placeholder="#000000" className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <Label>Secondary Colour</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="color" value={data.frontEnd.secondaryColour || '#666666'} onChange={e => updateFE({ secondaryColour: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                      <Input value={data.frontEnd.secondaryColour} onChange={e => updateFE({ secondaryColour: e.target.value })} placeholder="#666666" className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <Label>Accent Colour</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="color" value={data.frontEnd.accentColour || '#0066ff'} onChange={e => updateFE({ accentColour: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                      <Input value={data.frontEnd.accentColour} onChange={e => updateFE({ accentColour: e.target.value })} placeholder="#0066ff" className="flex-1" />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Should we create a logo for you?</Label>
                  <div className="flex gap-2 mt-2">
                    {(['yes', 'no'] as const).map(v => (
                      <Button key={v} type="button" size="sm" variant={data.frontEnd.needsLogo === v ? 'default' : 'outline'} onClick={() => updateFE({ needsLogo: v })} className="capitalize">
                        {v}
                      </Button>
                    ))}
                  </div>
                </div>
                {data.frontEnd.needsLogo === 'yes' && (
                  <div>
                    <Label>What type of logo do you like?</Label>
                    <div className="flex gap-2 mt-2">
                      {FE_LOGO_TYPES.map(t => (
                        <Button key={t} type="button" size="sm" variant={data.frontEnd.logoType === t ? 'default' : 'outline'} onClick={() => updateFE({ logoType: t })}>
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <StepNotesSection stepId="fe_design" />
          </div>
        );

      // ── FRONT END: INTEGRATIONS ──
      case 'fe_integrations':
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Front End — Integrations</h3>
            <CheckboxGroup items={FE_INTEGRATIONS} selected={data.frontEnd.integrations} onToggle={item => updateFE({ integrations: toggleItem(data.frontEnd.integrations, item) })} />
            <div>
              <SectionLabel>Other Integrations</SectionLabel>
              <Textarea value={data.frontEnd.customIntegrations} onChange={e => updateFE({ customIntegrations: e.target.value })} placeholder="List any other integrations needed..." rows={2} />
            </div>
            <StepNotesSection stepId="fe_integrations" />
          </div>
        );

      // ── ADMIN PORTAL: FEATURES ──
      case 'admin_features':
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Admin Portal — Features & Auth</h3>
            <div>
              <SectionLabel>Core Features</SectionLabel>
              <CheckboxGroup items={ADMIN_FEATURES} selected={data.adminPortal.features} onToggle={item => updateAdmin({ features: toggleItem(data.adminPortal.features, item) })} />
            </div>
            {data.adminPortal.features.includes('Analytics Dashboard') && (
              <div>
                <SectionLabel>Dashboard Widgets</SectionLabel>
                <CheckboxGroup items={ADMIN_WIDGETS} selected={data.adminPortal.dashboardWidgets} onToggle={item => updateAdmin({ dashboardWidgets: toggleItem(data.adminPortal.dashboardWidgets, item) })} cols={3} />
              </div>
            )}
            <div>
              <Label>Authentication Method</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ADMIN_AUTH_METHODS.map(m => (
                  <Button key={m} type="button" size="sm" variant={data.adminPortal.authMethod === m ? 'default' : 'outline'} onClick={() => updateAdmin({ authMethod: m })}>
                    {m}
                  </Button>
                ))}
              </div>
            </div>
            {data.adminPortal.features.includes('User Management') && (
              <div>
                <SectionLabel>User Roles</SectionLabel>
                <CheckboxGroup items={ADMIN_ROLES} selected={data.adminPortal.userRoles} onToggle={item => updateAdmin({ userRoles: toggleItem(data.adminPortal.userRoles, item) })} />
                <div className="mt-2">
                  <AddCustomField
                    items={data.adminPortal.customRoles}
                    onAdd={val => updateAdmin({ customRoles: [...data.adminPortal.customRoles, val] })}
                    onRemove={val => updateAdmin({ customRoles: data.adminPortal.customRoles.filter(r => r !== val) })}
                    placeholder="Add custom role"
                  />
                </div>
              </div>
            )}
            <div>
              <SectionLabel>Notifications</SectionLabel>
              <CheckboxGroup items={ADMIN_NOTIFICATIONS} selected={data.adminPortal.notifications} onToggle={item => updateAdmin({ notifications: toggleItem(data.adminPortal.notifications, item) })} />
            </div>
            <div>
              <Label>Additional Requirements</Label>
              <Textarea value={data.adminPortal.customNeeds} onChange={e => updateAdmin({ customNeeds: e.target.value })} placeholder="Any other admin portal needs..." className="mt-1" rows={2} />
            </div>
            <StepNotesSection stepId="admin_features" />
          </div>
        );

      // ── ADMIN PORTAL: INTEGRATIONS ──
      case 'admin_integrations':
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Admin Portal — Integrations</h3>
            <CheckboxGroup items={ADMIN_INTEGRATIONS} selected={data.adminPortal.integrations} onToggle={item => updateAdmin({ integrations: toggleItem(data.adminPortal.integrations, item) })} cols={3} />
            <div>
              <SectionLabel>Other Integrations</SectionLabel>
              <Textarea value={data.adminPortal.customIntegrations} onChange={e => updateAdmin({ customIntegrations: e.target.value })} placeholder="List any other integrations..." rows={2} />
            </div>
            <StepNotesSection stepId="admin_integrations" />
          </div>
        );

      // ── CLIENT PORTAL: FEATURES ──
      case 'client_features':
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Client Portal — Features & Access</h3>
            <div>
              <SectionLabel>Core Features</SectionLabel>
              <CheckboxGroup items={CLIENT_FEATURES} selected={data.clientPortal.features} onToggle={item => updateClient({ features: toggleItem(data.clientPortal.features, item) })} />
            </div>
            <div>
              <Label>Login Method</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CLIENT_LOGIN_METHODS.map(m => (
                  <Button key={m} type="button" size="sm" variant={data.clientPortal.loginMethod === m ? 'default' : 'outline'} onClick={() => updateClient({ loginMethod: m })}>
                    {m}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <SectionLabel>Self-Service Features</SectionLabel>
              <CheckboxGroup items={CLIENT_SELF_SERVICE} selected={data.clientPortal.selfServiceFeatures} onToggle={item => updateClient({ selfServiceFeatures: toggleItem(data.clientPortal.selfServiceFeatures, item) })} />
            </div>
            <div>
              <SectionLabel>Communication</SectionLabel>
              <CheckboxGroup items={CLIENT_COMMS} selected={data.clientPortal.communicationFeatures} onToggle={item => updateClient({ communicationFeatures: toggleItem(data.clientPortal.communicationFeatures, item) })} />
            </div>
            <div>
              <Label>Additional Requirements</Label>
              <Textarea value={data.clientPortal.customNeeds} onChange={e => updateClient({ customNeeds: e.target.value })} placeholder="Any other client portal needs..." className="mt-1" rows={2} />
            </div>
            <StepNotesSection stepId="client_features" />
          </div>
        );

      // ── STAFF PORTAL: FEATURES ──
      case 'staff_features':
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Staff Portal — Features & Roles</h3>
            <div>
              <SectionLabel>Core Features</SectionLabel>
              <CheckboxGroup items={STAFF_FEATURES} selected={data.staffPortal.features} onToggle={item => updateStaff({ features: toggleItem(data.staffPortal.features, item) })} />
            </div>
            <div>
              <SectionLabel>Staff Role Types</SectionLabel>
              <CheckboxGroup items={STAFF_ROLE_TYPES} selected={data.staffPortal.roleTypes} onToggle={item => updateStaff({ roleTypes: toggleItem(data.staffPortal.roleTypes, item) })} />
              <div className="mt-2">
                <AddCustomField
                  items={data.staffPortal.customRoles}
                  onAdd={val => updateStaff({ customRoles: [...data.staffPortal.customRoles, val] })}
                  onRemove={val => updateStaff({ customRoles: data.staffPortal.customRoles.filter(r => r !== val) })}
                  placeholder="Add custom role"
                />
              </div>
            </div>
            <div>
              <SectionLabel>Permissions</SectionLabel>
              <CheckboxGroup items={STAFF_PERMISSIONS} selected={data.staffPortal.permissions} onToggle={item => updateStaff({ permissions: toggleItem(data.staffPortal.permissions, item) })} />
            </div>
            {data.staffPortal.features.includes('Task Management') && (
              <div>
                <SectionLabel>Project Management Tools</SectionLabel>
                <CheckboxGroup items={STAFF_MANAGEMENT} selected={data.staffPortal.managementFeatures} onToggle={item => updateStaff({ managementFeatures: toggleItem(data.staffPortal.managementFeatures, item) })} />
              </div>
            )}
            <div>
              <Label>Additional Requirements</Label>
              <Textarea value={data.staffPortal.customNeeds} onChange={e => updateStaff({ customNeeds: e.target.value })} placeholder="Any other staff portal needs..." className="mt-1" rows={2} />
            </div>
            <StepNotesSection stepId="staff_features" />
          </div>
        );

      // ── STAFF PORTAL: INTEGRATIONS ──
      case 'staff_integrations':
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Staff Portal — Integrations</h3>
            <CheckboxGroup items={STAFF_INTEGRATIONS} selected={data.staffPortal.integrations} onToggle={item => updateStaff({ integrations: toggleItem(data.staffPortal.integrations, item) })} />
            <div>
              <SectionLabel>Other Integrations</SectionLabel>
              <Textarea value={data.staffPortal.customIntegrations} onChange={e => updateStaff({ customIntegrations: e.target.value })} placeholder="List any other integrations..." rows={2} />
            </div>
            <StepNotesSection stepId="staff_integrations" />
          </div>
        );

      // ── EXPECTATIONS ──
      case 'expectations':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Client Expectations</h3>
            <div>
              <Label>Budget Range</Label>
              <Select value={data.budgetRange} onValueChange={v => setData({ ...data, budgetRange: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select budget range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_1k">Under $1k</SelectItem>
                  <SelectItem value="1k_3k">$1k – $3k</SelectItem>
                  <SelectItem value="3k_5k">$3k – $5k</SelectItem>
                  <SelectItem value="5k_10k">$5k – $10k</SelectItem>
                  <SelectItem value="10k_plus">$10k+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Revision Rounds Agreed</Label>
              <Input type="number" min={1} max={10} value={data.revisionRounds} onChange={e => setData({ ...data, revisionRounds: parseInt(e.target.value) || 2 })} className="mt-1" />
            </div>
            <div>
              <Label>Preferred Communication</Label>
              <Select value={data.communicationMethod} onValueChange={v => setData({ ...data, communicationMethod: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Slack">Slack</SelectItem>
                  <SelectItem value="Video calls">Video calls</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Competitor / Reference Sites</Label>
              <Textarea value={data.competitorSites} onChange={e => setData({ ...data, competitorSites: e.target.value })} placeholder="List any competitor or reference websites..." className="mt-1" rows={3} />
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea value={data.notes} onChange={e => setData({ ...data, notes: e.target.value })} placeholder="Any other notes or requests..." className="mt-1" rows={3} />
            </div>
            <StepNotesSection stepId="expectations" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <Rocket className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">Project Discovery — {leadName}</CardTitle>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Step {stepIndex + 1} of {totalSteps}
              {currentStep.portalLabel && <span className="ml-2 text-primary font-medium">({currentStep.portalLabel})</span>}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {renderStep()}

        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={goBack} disabled={stepIndex === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          {stepIndex < totalSteps - 1 ? (
            <Button onClick={goNext} disabled={!canGoNext()}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !data.businessName}>
              <Rocket className="h-4 w-4 mr-2" />
              {submitting ? 'Creating Build Flow...' : 'Start Build Flow'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
