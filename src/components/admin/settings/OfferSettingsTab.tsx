import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import { useOfferContentAdmin, OfferContent } from '@/hooks/useOfferContent';

export default function OfferSettingsTab() {
  const { content, loading, saving, updateContent } = useOfferContentAdmin();
  const [form, setForm] = useState<OfferContent | null>(null);

  useEffect(() => {
    if (content) setForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  if (loading || !form) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const save = () => updateContent(form);

  const updateField = (field: keyof OfferContent, value: string) => {
    setForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const addFeature = () => {
    setForm(prev => prev ? { ...prev, features: [...prev.features, ""] } : prev);
  };

  const updateFeature = (index: number, value: string) => {
    setForm(prev => {
      if (!prev) return prev;
      const features = [...prev.features];
      features[index] = value;
      return { ...prev, features };
    });
  };

  const removeFeature = (index: number) => {
    setForm(prev => {
      if (!prev) return prev;
      return { ...prev, features: prev.features.filter((_, i) => i !== index) };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Offer Page</h2>
          <p className="text-sm text-muted-foreground">Configure the high-urgency /offer page</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Headline</Label>
            <Input value={form.headline} onChange={e => updateField('headline', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Subheadline</Label>
            <Input value={form.subheadline} onChange={e => updateField('subheadline', e.target.value)} />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={3} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Original Price</Label>
            <Input value={form.original_price} onChange={e => updateField('original_price', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sale Price</Label>
            <Input value={form.sale_price} onChange={e => updateField('sale_price', e.target.value)} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs text-muted-foreground">Discount Text</Label>
            <Input value={form.discount_text} onChange={e => updateField('discount_text', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Badge Text</Label>
            <Input value={form.badge_text} onChange={e => updateField('badge_text', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Image URL</Label>
            <Input value={form.image_url} onChange={e => updateField('image_url', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">CTA Button Text</Label>
            <Input value={form.cta_text} onChange={e => updateField('cta_text', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">CTA Link</Label>
            <Input value={form.cta_link} onChange={e => updateField('cta_link', e.target.value)} placeholder="/contact" />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Urgency Text</Label>
          <Input value={form.urgency_text} onChange={e => updateField('urgency_text', e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Guarantee Text</Label>
          <Input value={form.guarantee_text} onChange={e => updateField('guarantee_text', e.target.value)} />
        </div>

        {/* Features */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Included Features</Label>
            <Button type="button" variant="outline" size="sm" onClick={addFeature}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          {form.features.map((feature, i) => (
            <Card key={i} className="relative">
              <CardContent className="pt-3 pb-3 pr-10">
                <Input value={feature} onChange={e => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-destructive hover:text-destructive"
                  onClick={() => removeFeature(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
