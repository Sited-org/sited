import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import { useHomepageContentAdmin, HomepageContent } from '@/hooks/useHomepageContent';

export default function HomepageSettingsTab() {
  const { content, loading, saving, updateContent } = useHomepageContentAdmin();
  const [form, setForm] = useState<HomepageContent | null>(null);

  useEffect(() => {
    if (content) setForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  if (loading || !form) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const save = () => updateContent(form);

  // Helper to update nested fields
  const set = (path: string, value: any) => {
    setForm(prev => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = isNaN(Number(keys[i])) ? keys[i] : Number(keys[i]);
        obj = obj[k];
      }
      const lastKey = isNaN(Number(keys[keys.length - 1])) ? keys[keys.length - 1] : Number(keys[keys.length - 1]);
      obj[lastKey] = value;
      return copy;
    });
  };

  const addToArray = (path: string, item: any) => {
    setForm(prev => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = copy;
      for (const k of keys) {
        obj = obj[isNaN(Number(k)) ? k : Number(k)];
      }
      obj.push(item);
      return copy;
    });
  };

  const removeFromArray = (path: string, index: number) => {
    setForm(prev => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = copy;
      for (const k of keys) {
        obj = obj[isNaN(Number(k)) ? k : Number(k)];
      }
      obj.splice(index, 1);
      return copy;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Homepage Content</h2>
          <p className="text-sm text-muted-foreground">Edit all homepage sections</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {/* HERO */}
        <AccordionItem value="hero" className="border rounded-lg px-4">
          <AccordionTrigger className="font-semibold">1. Hero Section</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Field label="Headline" value={form.hero.headline} onChange={v => set('hero.headline', v)} />
            <Field label="Subheadline" value={form.hero.subheadline} onChange={v => set('hero.subheadline', v)} textarea />
            <Field label="Question" value={form.hero.question} onChange={v => set('hero.question', v)} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Primary CTA Label" value={form.hero.primary_cta_label} onChange={v => set('hero.primary_cta_label', v)} />
              <Field label="Primary CTA Link" value={form.hero.primary_cta_link} onChange={v => set('hero.primary_cta_link', v)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Secondary CTA Label" value={form.hero.secondary_cta_label} onChange={v => set('hero.secondary_cta_label', v)} />
              <Field label="Secondary CTA Link" value={form.hero.secondary_cta_link} onChange={v => set('hero.secondary_cta_link', v)} />
            </div>
            <Field label="Social Proof Label" value={form.hero.social_proof_label} onChange={v => set('hero.social_proof_label', v)} />
            <RepeaterSection
              title="Mini Testimonials"
              items={form.hero.mini_testimonials}
              onAdd={() => addToArray('hero.mini_testimonials', { quote: '', name: '', role: '' })}
              onRemove={i => removeFromArray('hero.mini_testimonials', i)}
              renderItem={(item, i) => (
                <div className="space-y-2">
                  <Field label="Quote" value={item.quote} onChange={v => set(`hero.mini_testimonials.${i}.quote`, v)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Name" value={item.name} onChange={v => set(`hero.mini_testimonials.${i}.name`, v)} />
                    <Field label="Role / Business" value={item.role} onChange={v => set(`hero.mini_testimonials.${i}.role`, v)} />
                  </div>
                </div>
              )}
            />
          </AccordionContent>
        </AccordionItem>

        {/* PROOF BAR */}
        <AccordionItem value="proof_bar" className="border rounded-lg px-4">
          <AccordionTrigger className="font-semibold">2. Proof Bar</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Field label="Title" value={form.proof_bar.title} onChange={v => set('proof_bar.title', v)} />
            <RepeaterSection
              title="Proof Items"
              items={form.proof_bar.items}
              onAdd={() => addToArray('proof_bar.items', '')}
              onRemove={i => removeFromArray('proof_bar.items', i)}
              renderItem={(item, i) => (
                <Field label={`Item ${i + 1}`} value={item} onChange={v => set(`proof_bar.items.${i}`, v)} />
              )}
            />
          </AccordionContent>
        </AccordionItem>

        {/* MORE OF EVERYTHING */}
        <AccordionItem value="more" className="border rounded-lg px-4">
          <AccordionTrigger className="font-semibold">3. More of Everything</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Field label="Section Title" value={form.more_of_everything.title} onChange={v => set('more_of_everything.title', v)} />
            <RepeaterSection
              title="Items"
              items={form.more_of_everything.items}
              onAdd={() => addToArray('more_of_everything.items', { bold: '', supporting: '' })}
              onRemove={i => removeFromArray('more_of_everything.items', i)}
              renderItem={(item, i) => (
                <div className="space-y-2">
                  <Field label="Bold Phrase" value={item.bold} onChange={v => set(`more_of_everything.items.${i}.bold`, v)} />
                  <Field label="Supporting Line" value={item.supporting} onChange={v => set(`more_of_everything.items.${i}.supporting`, v)} />
                </div>
              )}
            />
          </AccordionContent>
        </AccordionItem>

        {/* TRUSTED BY */}
        <AccordionItem value="trusted" className="border rounded-lg px-4">
          <AccordionTrigger className="font-semibold">4. Trusted By</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Field label="Heading" value={form.trusted_by.heading} onChange={v => set('trusted_by.heading', v)} textarea />
            <Field label="Under Text" value={form.trusted_by.under_text} onChange={v => set('trusted_by.under_text', v)} textarea />
            <RepeaterSection
              title="Logos (image URLs)"
              items={form.trusted_by.logos}
              onAdd={() => addToArray('trusted_by.logos', { url: '' })}
              onRemove={i => removeFromArray('trusted_by.logos', i)}
              renderItem={(item, i) => (
                <Field label={`Logo ${i + 1} URL`} value={item.url} onChange={v => set(`trusted_by.logos.${i}.url`, v)} />
              )}
            />
          </AccordionContent>
        </AccordionItem>

        {/* WHO WE HELP */}
        <AccordionItem value="who" className="border rounded-lg px-4">
          <AccordionTrigger className="font-semibold">5. Who We Help</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Field label="Heading" value={form.who_we_help.heading} onChange={v => set('who_we_help.heading', v)} />
            <Field label="Intro" value={form.who_we_help.intro} onChange={v => set('who_we_help.intro', v)} />
            {form.who_we_help.bullets.map((b, i) => (
              <Field key={i} label={`Bullet ${i + 1}`} value={b} onChange={v => set(`who_we_help.bullets.${i}`, v)} />
            ))}
            <Field label="Closing Line" value={form.who_we_help.closing} onChange={v => set('who_we_help.closing', v)} />
          </AccordionContent>
        </AccordionItem>

        {/* WHY STAY */}
        <AccordionItem value="why" className="border rounded-lg px-4">
          <AccordionTrigger className="font-semibold">6. Why People Stay</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Field label="Heading" value={form.why_stay.heading} onChange={v => set('why_stay.heading', v)} />
            <RepeaterSection
              title="Reasons"
              items={form.why_stay.reasons}
              onAdd={() => addToArray('why_stay.reasons', { title: '', description: '' })}
              onRemove={i => removeFromArray('why_stay.reasons', i)}
              renderItem={(item, i) => (
                <div className="space-y-2">
                  <Field label="Title" value={item.title} onChange={v => set(`why_stay.reasons.${i}.title`, v)} />
                  <Field label="Description" value={item.description} onChange={v => set(`why_stay.reasons.${i}.description`, v)} />
                </div>
              )}
            />
          </AccordionContent>
        </AccordionItem>

        {/* SERVICES */}
        <AccordionItem value="services" className="border rounded-lg px-4">
          <AccordionTrigger className="font-semibold">7. Services</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Field label="Heading" value={form.services.heading} onChange={v => set('services.heading', v)} />
            <RepeaterSection
              title="Service Cards"
              items={form.services.cards}
              onAdd={() => addToArray('services.cards', { title: '', description: '', cta_label: '', cta_link: '/contact' })}
              onRemove={i => removeFromArray('services.cards', i)}
              renderItem={(item, i) => (
                <div className="space-y-2">
                  <Field label="Title" value={item.title} onChange={v => set(`services.cards.${i}.title`, v)} />
                  <Field label="Description" value={item.description} onChange={v => set(`services.cards.${i}.description`, v)} textarea />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="CTA Label" value={item.cta_label} onChange={v => set(`services.cards.${i}.cta_label`, v)} />
                    <Field label="CTA Link" value={item.cta_link} onChange={v => set(`services.cards.${i}.cta_link`, v)} />
                  </div>
                </div>
              )}
            />
          </AccordionContent>
        </AccordionItem>

        {/* RESULTS */}
        <AccordionItem value="results" className="border rounded-lg px-4">
          <AccordionTrigger className="font-semibold">8. Results & Social Proof</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Field label="Heading" value={form.results.heading} onChange={v => set('results.heading', v)} />
            <RepeaterSection
              title="Result Cards"
              items={form.results.cards}
              onAdd={() => addToArray('results.cards', { quote: '', subtext: '' })}
              onRemove={i => removeFromArray('results.cards', i)}
              renderItem={(item, i) => (
                <div className="space-y-2">
                  <Field label="Quote" value={item.quote} onChange={v => set(`results.cards.${i}.quote`, v)} textarea />
                  <Field label="Subtext" value={item.subtext} onChange={v => set(`results.cards.${i}.subtext`, v)} textarea />
                </div>
              )}
            />
            <Field label="Testimonial Strip Heading" value={form.results.testimonial_strip_heading} onChange={v => set('results.testimonial_strip_heading', v)} />
            <RepeaterSection
              title="Strip Testimonials"
              items={form.results.testimonials}
              onAdd={() => addToArray('results.testimonials', { quote: '', name: '', role: '' })}
              onRemove={i => removeFromArray('results.testimonials', i)}
              renderItem={(item, i) => (
                <div className="space-y-2">
                  <Field label="Quote" value={item.quote} onChange={v => set(`results.testimonials.${i}.quote`, v)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Name" value={item.name} onChange={v => set(`results.testimonials.${i}.name`, v)} />
                    <Field label="Role" value={item.role} onChange={v => set(`results.testimonials.${i}.role`, v)} />
                  </div>
                </div>
              )}
            />
          </AccordionContent>
        </AccordionItem>

        {/* PROCESS */}
        <AccordionItem value="process" className="border rounded-lg px-4">
          <AccordionTrigger className="font-semibold">9. Process</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Field label="Heading" value={form.process.heading} onChange={v => set('process.heading', v)} />
            <RepeaterSection
              title="Steps"
              items={form.process.steps}
              onAdd={() => addToArray('process.steps', { title: '', description: '' })}
              onRemove={i => removeFromArray('process.steps', i)}
              renderItem={(item, i) => (
                <div className="space-y-2">
                  <Field label="Step Title" value={item.title} onChange={v => set(`process.steps.${i}.title`, v)} />
                  <Field label="Step Description" value={item.description} onChange={v => set(`process.steps.${i}.description`, v)} textarea />
                </div>
              )}
            />
          </AccordionContent>
        </AccordionItem>

        {/* FINAL CTA */}
        <AccordionItem value="cta" className="border rounded-lg px-4">
          <AccordionTrigger className="font-semibold">10. Final CTA</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Field label="Heading" value={form.final_cta.heading} onChange={v => set('final_cta.heading', v)} />
            <Field label="Body Text" value={form.final_cta.body} onChange={v => set('final_cta.body', v)} textarea />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Button Label" value={form.final_cta.button_label} onChange={v => set('final_cta.button_label', v)} />
              <Field label="Button Link" value={form.final_cta.button_link} onChange={v => set('final_cta.button_link', v)} />
            </div>
            <Field label="Reassurance Line" value={form.final_cta.reassurance} onChange={v => set('final_cta.reassurance', v)} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end pt-4">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}

// Reusable field component
function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className="text-sm" />
      ) : (
        <Input value={value} onChange={e => onChange(e.target.value)} className="text-sm" />
      )}
    </div>
  );
}

// Reusable repeater section
function RepeaterSection<T>({
  title,
  items,
  onAdd,
  onRemove,
  renderItem,
}: {
  title: string;
  items: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  renderItem: (item: T, i: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{title}</Label>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
      {items.map((item, i) => (
        <Card key={i} className="relative">
          <CardContent className="pt-4 pb-3 pr-10">
            {renderItem(item, i)}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-destructive hover:text-destructive"
              onClick={() => onRemove(i)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
