import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Save, FileText } from 'lucide-react';
import { useHomepageContentAdmin, HomepageContent } from '@/hooks/useHomepageContent';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface PageHeadings {
  [pageKey: string]: {
    label: string;
    headings: { selector: string; label: string; value: string }[];
  };
}

const DEFAULT_PAGE_HEADINGS: PageHeadings = {
  home: {
    label: 'Homepage',
    headings: [
      { selector: 'hero.h1', label: 'Hero H1', value: '' },
      { selector: 'proof_bar.title', label: 'Proof Bar Title', value: '' },
      { selector: 'more.h2', label: '"More of Everything" H2', value: '' },
      { selector: 'why_stay.h2', label: '"Why People Stay" H2', value: '' },
      { selector: 'services.h2', label: 'Services H2', value: '' },
      { selector: 'results.h2', label: 'Results H2', value: '' },
      { selector: 'process.h2', label: 'Process H2', value: '' },
      { selector: 'final_cta.h2', label: 'Final CTA H2', value: '' },
    ],
  },
  work: {
    label: 'Work Page',
    headings: [
      { selector: 'work.hero_h1', label: 'Hero H1', value: "Don't take our word for it." },
      { selector: 'work.hero_subtitle', label: 'Hero Subtitle', value: 'Scroll down to see live websites, video testimonials, and the businesses we\'ve helped grow.' },
      { selector: 'work.mid_cta_h3', label: 'Mid-Page CTA', value: 'Like what you see?' },
      { selector: 'work.why_h2', label: '"Why Sited" H2', value: "We don't just build it and disappear." },
    ],
  },
  features: {
    label: 'Features Page',
    headings: [
      { selector: 'features.hero_h1', label: 'Hero H1', value: 'What makes a difference.' },
      { selector: 'features.transition_h2', label: 'Transition H2', value: 'Need somewhere to manage your leads? We build that too.' },
      { selector: 'features.final_h2', label: 'Final CTA H2', value: "Not sure what you need? That's what the consultation is for." },
    ],
  },
  contact: {
    label: 'Contact Page',
    headings: [
      { selector: 'contact.hero_h1', label: 'Hero H1', value: 'Ready to grow?' },
      { selector: 'contact.hero_subtitle', label: 'Hero Subtitle', value: "Whether you need a website, a quote, or just some advice — we're here. No jargon, no pressure." },
    ],
  },
};

export default function PagesSettingsTab() {
  const { content, loading: homepageLoading, saving: homepageSaving, updateContent } = useHomepageContentAdmin();
  const { toast } = useToast();
  const [pageHeadings, setPageHeadings] = useState<PageHeadings>(DEFAULT_PAGE_HEADINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [homepageForm, setHomepageForm] = useState<HomepageContent | null>(null);

  // Load page headings from system_settings
  const fetchPageHeadings = useCallback(async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'page_headings')
      .maybeSingle();

    if (!error && data?.setting_value) {
      setPageHeadings(data.setting_value as unknown as PageHeadings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPageHeadings();
  }, [fetchPageHeadings]);

  useEffect(() => {
    if (content) setHomepageForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  const updateHeading = (pageKey: string, index: number, value: string) => {
    setPageHeadings(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (copy[pageKey]?.headings?.[index]) {
        copy[pageKey].headings[index].value = value;
      }
      return copy;
    });
  };

  const saveAll = async () => {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();

    // Save page headings
    const { error: headingsError } = await supabase
      .from('system_settings')
      .upsert({
        setting_key: 'page_headings',
        setting_value: pageHeadings as unknown as Json,
        updated_by: userData.user?.id,
      }, { onConflict: 'setting_key' });

    if (headingsError) {
      toast({ title: 'Error saving page headings', description: headingsError.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    // Save homepage content if changed
    if (homepageForm) {
      await updateContent(homepageForm);
    }

    toast({ title: 'Pages content saved' });
    setSaving(false);
  };

  if (loading || homepageLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pages</h2>
          <p className="text-sm text-muted-foreground">Edit headings & text across all website pages</p>
        </div>
        <Button onClick={saveAll} disabled={saving || homepageSaving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {/* Homepage - uses the existing homepage_content system */}
        {homepageForm && (
          <AccordionItem value="home" className="border rounded-lg px-4">
            <AccordionTrigger className="font-semibold">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-sited-blue" />
                Homepage
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground mb-2">Edit main headings and text on the homepage</p>
              
              <div className="space-y-3">
                <HeadingField 
                  tag="H2" 
                  label="Websites Section" 
                  value={homepageForm.more_of_everything?.title || ''} 
                  onChange={v => {
                    setHomepageForm(prev => prev ? { ...prev, more_of_everything: { ...prev.more_of_everything, title: v } } : prev);
                  }} 
                />
                <HeadingField 
                  tag="H2" 
                  label="Why People Stay" 
                  value={homepageForm.why_stay?.heading || ''} 
                  onChange={v => {
                    setHomepageForm(prev => prev ? { ...prev, why_stay: { ...prev.why_stay, heading: v } } : prev);
                  }} 
                />
                <HeadingField 
                  tag="H2" 
                  label="Services Section" 
                  value={homepageForm.services?.heading || ''} 
                  onChange={v => {
                    setHomepageForm(prev => prev ? { ...prev, services: { ...prev.services, heading: v } } : prev);
                  }} 
                />
                <HeadingField 
                  tag="H2" 
                  label="Results Section" 
                  value={homepageForm.results?.heading || ''} 
                  onChange={v => {
                    setHomepageForm(prev => prev ? { ...prev, results: { ...prev.results, heading: v } } : prev);
                  }} 
                />
                <HeadingField 
                  tag="H2" 
                  label="Process Section" 
                  value={homepageForm.process?.heading || ''} 
                  onChange={v => {
                    setHomepageForm(prev => prev ? { ...prev, process: { ...prev.process, heading: v } } : prev);
                  }} 
                />
                <HeadingField 
                  tag="H2" 
                  label="Final CTA" 
                  value={homepageForm.final_cta?.heading || ''} 
                  onChange={v => {
                    setHomepageForm(prev => prev ? { ...prev, final_cta: { ...prev.final_cta, heading: v } } : prev);
                  }} 
                />
                <HeadingField 
                  tag="H3" 
                  label="Social Proof Label" 
                  value={homepageForm.hero?.social_proof_label || ''} 
                  onChange={v => {
                    setHomepageForm(prev => prev ? { ...prev, hero: { ...prev.hero, social_proof_label: v } } : prev);
                  }} 
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Other pages */}
        {Object.entries(pageHeadings)
          .filter(([key]) => key !== 'home')
          .map(([pageKey, page]) => (
            <AccordionItem key={pageKey} value={pageKey} className="border rounded-lg px-4">
              <AccordionTrigger className="font-semibold">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sited-blue" />
                  {page.label}
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {page.headings.map((heading, i) => (
                  <HeadingField
                    key={heading.selector}
                    tag={heading.label.includes('H1') ? 'H1' : heading.label.includes('H3') ? 'H3' : 'H2'}
                    label={heading.label}
                    value={heading.value}
                    onChange={v => updateHeading(pageKey, i, v)}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>

      <div className="flex justify-end pt-4">
        <Button onClick={saveAll} disabled={saving || homepageSaving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}

function HeadingField({ tag, label, value, onChange }: { tag: string; label: string; value: string; onChange: (v: string) => void }) {
  const tagColors: Record<string, string> = {
    H1: 'bg-sited-blue/15 text-sited-blue',
    H2: 'bg-accent/30 text-accent-foreground',
    H3: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="flex items-start gap-3">
      <span className={`shrink-0 mt-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${tagColors[tag] || tagColors.H2}`}>
        {tag}
      </span>
      <div className="flex-1 space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input value={value} onChange={e => onChange(e.target.value)} className="text-sm" />
      </div>
    </div>
  );
}
