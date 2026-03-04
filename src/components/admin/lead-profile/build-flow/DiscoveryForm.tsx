import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Rocket, Calendar } from 'lucide-react';

interface DiscoveryFormProps {
  leadName: string;
  leadBusinessName: string;
  onSubmit: (data: DiscoveryData) => Promise<void>;
}

export interface DiscoveryData {
  businessName: string;
  projectType: 'brochure' | 'ecommerce' | 'webapp' | 'booking';
  primaryGoal: string;
  targetAudience: string;
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
}

const PROJECT_TYPES = [
  { value: 'brochure', label: 'Brochure / Info Site' },
  { value: 'ecommerce', label: 'E-Commerce Store' },
  { value: 'webapp', label: 'Web App / SaaS / Portal' },
  { value: 'booking', label: 'Booking / Service Site' },
];

const CORE_PAGES = ['Homepage', 'About Page', 'Services / Products Page', 'Contact Page', 'Privacy Policy & Terms'];
const MARKETING_PAGES = ['Landing Page (campaign)', 'Pricing Page', 'FAQ Page', 'Testimonials / Reviews Page', 'Case Studies / Portfolio'];
const CONTENT_PAGES = ['Blog / News', 'Resources / Downloads', 'Careers Page', 'Events Page'];
const ECOMMERCE_PAGES = ['Shop / Product Listing', 'Product Detail Page', 'Cart Page', 'Checkout Page', 'Order Confirmation Page'];
const USER_PAGES = ['Login / Sign Up', 'User Profile Page', 'User Dashboard', 'Admin Panel', 'Client Portal'];

const AUTH_FEATURES = ['User Sign Up & Login', 'Google OAuth', 'Role-based access', 'Password reset flow'];
const DB_FEATURES = ['Contact form to database', 'User data storage', 'Content management', 'File / image uploads'];

const PAYMENT_INTEGRATIONS = ['Stripe — One-Time Payments', 'Stripe — Subscriptions / Memberships'];
const BOOKING_INTEGRATIONS = ['Calendly', 'Cal.com', 'Acuity Scheduling', 'Other booking tool'];
const EMAIL_INTEGRATIONS = ['Email Marketing (Mailchimp / Klaviyo / ConvertKit)', 'Transactional Email (Resend / SendGrid)'];
const ANALYTICS_INTEGRATIONS = ['Google Analytics 4', 'Plausible Analytics'];
const CRM_INTEGRATIONS = ['HubSpot', 'Pipedrive', 'Zapier (general automation)'];
const OTHER_INTEGRATIONS = ['Live Chat (Intercom / Crisp / Tawk.to)', 'AI Chatbot', 'Google Maps embed', 'Instagram / Social Feed', 'Google Reviews embed', 'Custom / Third Party API'];

const TOTAL_STEPS = 5;

export function DiscoveryForm({ leadName, leadBusinessName, onSubmit }: DiscoveryFormProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<DiscoveryData>({
    businessName: leadBusinessName || '',
    projectType: 'brochure',
    primaryGoal: '',
    targetAudience: '',
    desiredLaunchDate: '',
    selectedPages: [...CORE_PAGES],
    selectedFeatures: [],
    selectedIntegrations: [],
    budgetRange: '',
    revisionRounds: 2,
    communicationMethod: 'Email',
    notes: '',
    existingWebsite: '',
    competitorSites: '',
  });

  const toggleItem = (list: string[], item: string) => {
    return list.includes(item) ? list.filter(i => i !== item) : [...list, item];
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(data);
    setSubmitting(false);
  };

  const progress = (step / TOTAL_STEPS) * 100;

  const CheckboxGroup = ({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (item: string) => void }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map(item => (
        <label key={item} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
          <Checkbox
            checked={selected.includes(item)}
            onCheckedChange={() => onToggle(item)}
          />
          <span className="text-sm">{item}</span>
        </label>
      ))}
    </div>
  );

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <Rocket className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">Project Discovery — {leadName}</CardTitle>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* STEP 1 — Project Basics */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Project Basics</h3>
            <div>
              <Label>Client / Business Name</Label>
              <Input value={data.businessName} onChange={e => setData({ ...data, businessName: e.target.value })} placeholder="Business name (used for staging URL)" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Staging URL: {data.businessName ? `${data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.sited.co` : '—'}</p>
            </div>
            <div>
              <Label>Project Type</Label>
              <Select value={data.projectType} onValueChange={(v: any) => setData({ ...data, projectType: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map(pt => (
                    <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Primary Goal of the Website</Label>
              <Textarea value={data.primaryGoal} onChange={e => setData({ ...data, primaryGoal: e.target.value })} placeholder="What is the main purpose of this website?" className="mt-1" rows={3} />
            </div>
            <div>
              <Label>Target Audience</Label>
              <Input value={data.targetAudience} onChange={e => setData({ ...data, targetAudience: e.target.value })} placeholder="Who is this website for?" className="mt-1" />
            </div>
            <div>
              <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Desired Launch Date</Label>
              <Input type="date" value={data.desiredLaunchDate} onChange={e => setData({ ...data, desiredLaunchDate: e.target.value })} className="mt-1" />
            </div>
          </div>
        )}

        {/* STEP 2 — Pages Required */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Pages Required</h3>
            <div>
              <Label className="text-muted-foreground mb-2 block">Core Pages</Label>
              <CheckboxGroup items={CORE_PAGES} selected={data.selectedPages} onToggle={item => setData({ ...data, selectedPages: toggleItem(data.selectedPages, item) })} />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Marketing Pages</Label>
              <CheckboxGroup items={MARKETING_PAGES} selected={data.selectedPages} onToggle={item => setData({ ...data, selectedPages: toggleItem(data.selectedPages, item) })} />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Content Pages</Label>
              <CheckboxGroup items={CONTENT_PAGES} selected={data.selectedPages} onToggle={item => setData({ ...data, selectedPages: toggleItem(data.selectedPages, item) })} />
            </div>
            {data.projectType === 'ecommerce' && (
              <div>
                <Label className="text-muted-foreground mb-2 block">E-Commerce Pages</Label>
                <CheckboxGroup items={ECOMMERCE_PAGES} selected={data.selectedPages} onToggle={item => setData({ ...data, selectedPages: toggleItem(data.selectedPages, item) })} />
              </div>
            )}
            {(data.projectType === 'webapp' || data.projectType === 'booking') && (
              <div>
                <Label className="text-muted-foreground mb-2 block">User Account Pages</Label>
                <CheckboxGroup items={USER_PAGES} selected={data.selectedPages} onToggle={item => setData({ ...data, selectedPages: toggleItem(data.selectedPages, item) })} />
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — Features */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Features & Functionality</h3>
            <div>
              <Label className="text-muted-foreground mb-2 block">Authentication</Label>
              <CheckboxGroup items={AUTH_FEATURES} selected={data.selectedFeatures} onToggle={item => setData({ ...data, selectedFeatures: toggleItem(data.selectedFeatures, item) })} />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Database & Back End</Label>
              <CheckboxGroup items={DB_FEATURES} selected={data.selectedFeatures} onToggle={item => setData({ ...data, selectedFeatures: toggleItem(data.selectedFeatures, item) })} />
            </div>
          </div>
        )}

        {/* STEP 4 — Integrations */}
        {step === 4 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Integrations</h3>
            <div>
              <Label className="text-muted-foreground mb-2 block">Payments</Label>
              <CheckboxGroup items={PAYMENT_INTEGRATIONS} selected={data.selectedIntegrations} onToggle={item => setData({ ...data, selectedIntegrations: toggleItem(data.selectedIntegrations, item) })} />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Booking</Label>
              <CheckboxGroup items={BOOKING_INTEGRATIONS} selected={data.selectedIntegrations} onToggle={item => setData({ ...data, selectedIntegrations: toggleItem(data.selectedIntegrations, item) })} />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Email</Label>
              <CheckboxGroup items={EMAIL_INTEGRATIONS} selected={data.selectedIntegrations} onToggle={item => setData({ ...data, selectedIntegrations: toggleItem(data.selectedIntegrations, item) })} />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Analytics</Label>
              <CheckboxGroup items={ANALYTICS_INTEGRATIONS} selected={data.selectedIntegrations} onToggle={item => setData({ ...data, selectedIntegrations: toggleItem(data.selectedIntegrations, item) })} />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">CRM</Label>
              <CheckboxGroup items={CRM_INTEGRATIONS} selected={data.selectedIntegrations} onToggle={item => setData({ ...data, selectedIntegrations: toggleItem(data.selectedIntegrations, item) })} />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Other</Label>
              <CheckboxGroup items={OTHER_INTEGRATIONS} selected={data.selectedIntegrations} onToggle={item => setData({ ...data, selectedIntegrations: toggleItem(data.selectedIntegrations, item) })} />
            </div>
          </div>
        )}

        {/* STEP 5 — Client Expectations */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Client Expectations</h3>
            <div>
              <Label>Budget Range</Label>
              <Select value={data.budgetRange} onValueChange={v => setData({ ...data, budgetRange: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select budget range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_1k">Under £1k</SelectItem>
                  <SelectItem value="1k_3k">£1k – £3k</SelectItem>
                  <SelectItem value="3k_5k">£3k – £5k</SelectItem>
                  <SelectItem value="5k_10k">£5k – £10k</SelectItem>
                  <SelectItem value="10k_plus">£10k+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Revision Rounds Agreed</Label>
              <Input type="number" min={1} max={10} value={data.revisionRounds} onChange={e => setData({ ...data, revisionRounds: parseInt(e.target.value) || 2 })} className="mt-1" />
            </div>
            <div>
              <Label>Preferred Communication Method</Label>
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
              <Label>Existing Website URL (if any)</Label>
              <Input value={data.existingWebsite} onChange={e => setData({ ...data, existingWebsite: e.target.value })} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label>Competitor / Reference Sites</Label>
              <Textarea value={data.competitorSites} onChange={e => setData({ ...data, competitorSites: e.target.value })} placeholder="List any competitor or reference websites..." className="mt-1" rows={3} />
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea value={data.notes} onChange={e => setData({ ...data, notes: e.target.value })} placeholder="Any other notes or requests..." className="mt-1" rows={3} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          {step < TOTAL_STEPS ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !data.businessName || !data.projectType}>
              <Rocket className="h-4 w-4 mr-2" />
              {submitting ? 'Creating Build Flow...' : 'Start Build Flow'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
