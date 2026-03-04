import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Upload, Image, Palette, Type, ExternalLink, Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ClientAssets, BrandColour, BrandFont } from '@/hooks/useBuildFlow';

interface ClientAssetsPanelProps {
  clientAssets: ClientAssets | null;
  brandColours: BrandColour[];
  brandFonts: BrandFont[];
  buildFlowId: string;
  leadId: string;
  canEdit: boolean;
  onUpdate: () => Promise<void>;
}

const LOGO_SLOTS = [
  { key: 'logo_512', label: 'Logo 512×512', desc: 'App Icon', dims: '512×512' },
  { key: 'logo_192', label: 'Logo 192×192', desc: 'PWA Icon', dims: '192×192' },
  { key: 'logo_32', label: 'Logo 32×32', desc: 'Favicon', dims: '32×32' },
  { key: 'logo_16', label: 'Logo 16×16', desc: 'Small Favicon', dims: '16×16' },
  { key: 'logo_apple_touch', label: 'Apple Touch Icon', desc: 'iOS Home Screen', dims: '180×180' },
  { key: 'og_image', label: 'OG Image', desc: 'Social Share', dims: '1200×630' },
] as const;

export function ClientAssetsPanel({
  clientAssets,
  brandColours,
  brandFonts,
  buildFlowId,
  leadId,
  canEdit,
  onUpdate,
}: ClientAssetsPanelProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);
  const [driveLink, setDriveLink] = useState(clientAssets?.google_drive_link || '');
  const [localColours, setLocalColours] = useState(brandColours);
  const [localFonts, setLocalFonts] = useState(brandFonts);

  const handleLogoUpload = async (key: string, file: File) => {
    if (!clientAssets) return;
    setUploading(key);
    const path = `logos/${leadId}/${key}-${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('build-assets').upload(path, file);
    if (uploadErr) {
      toast({ title: 'Upload failed', description: uploadErr.message, variant: 'destructive' });
      setUploading(null);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('build-assets').getPublicUrl(path);
    await supabase.from('client_assets').update({ [key]: publicUrl }).eq('id', clientAssets.id);
    toast({ title: 'Logo uploaded' });
    setUploading(null);
    await onUpdate();
  };

  const saveDriveLink = async () => {
    if (!clientAssets) return;
    await supabase.from('client_assets').update({ google_drive_link: driveLink }).eq('id', clientAssets.id);
    toast({ title: 'Drive link saved' });
    await onUpdate();
  };

  const addColour = async () => {
    const { error } = await supabase.from('brand_colours').insert({
      lead_id: leadId,
      build_flow_id: buildFlowId,
      label: 'New Colour',
      hex_value: '#000000',
      order_index: localColours.length,
    });
    if (!error) await onUpdate();
  };

  const updateColour = async (id: string, field: string, value: string) => {
    setLocalColours(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const saveColour = async (colour: BrandColour) => {
    const local = localColours.find(c => c.id === colour.id);
    if (!local) return;
    await supabase.from('brand_colours').update({ label: local.label, hex_value: local.hex_value }).eq('id', colour.id);
    toast({ title: 'Colour saved' });
  };

  const deleteColour = async (id: string) => {
    await supabase.from('brand_colours').delete().eq('id', id);
    await onUpdate();
  };

  const addFont = async () => {
    const { error } = await supabase.from('brand_fonts').insert({
      lead_id: leadId,
      build_flow_id: buildFlowId,
      label: 'New Font',
      font_name: '',
      order_index: localFonts.length,
    });
    if (!error) await onUpdate();
  };

  const updateFont = async (id: string, field: string, value: string) => {
    setLocalFonts(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const saveFont = async (font: BrandFont) => {
    const local = localFonts.find(f => f.id === font.id);
    if (!local) return;
    await supabase.from('brand_fonts').update({ label: local.label, font_name: local.font_name }).eq('id', font.id);
    toast({ title: 'Font saved' });
  };

  const deleteFont = async (id: string) => {
    await supabase.from('brand_fonts').delete().eq('id', id);
    await onUpdate();
  };

  return (
    <div className="space-y-6">
      {/* Logo Uploads */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Image className="h-5 w-5" /> Logo & Image Assets</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LOGO_SLOTS.map(slot => {
              const url = clientAssets?.[slot.key as keyof ClientAssets] as string | null;
              return (
                <div key={slot.key} className="border border-border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium">{slot.label}</p>
                      <p className="text-xs text-muted-foreground">{slot.desc} • {slot.dims}</p>
                    </div>
                  </div>
                  {url ? (
                    <div className="relative">
                      <img src={url} alt={slot.label} className="w-full h-24 object-contain bg-muted rounded-lg" />
                      {canEdit && (
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg cursor-pointer">
                          <span className="text-white text-xs">Replace</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleLogoUpload(slot.key, e.target.files[0])} />
                        </label>
                      )}
                    </div>
                  ) : canEdit ? (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      {uploading === slot.key ? (
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground mt-1">Upload</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleLogoUpload(slot.key, e.target.files[0])} />
                    </label>
                  ) : (
                    <div className="h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Not uploaded</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Brand Colours */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Palette className="h-5 w-5" /> Brand Colours</CardTitle>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={addColour}>
                <Plus className="h-4 w-4 mr-1" /> Add Colour
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {localColours.length === 0 && <p className="text-sm text-muted-foreground">No colours added yet.</p>}
          {localColours.map(colour => (
            <div key={colour.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-border shrink-0" style={{ backgroundColor: colour.hex_value }} />
              {canEdit ? (
                <>
                  <Input value={colour.label} onChange={e => updateColour(colour.id, 'label', e.target.value)} className="w-32" placeholder="Label" />
                  <Input value={colour.hex_value} onChange={e => updateColour(colour.id, 'hex_value', e.target.value)} className="w-28 font-mono" placeholder="#000000" />
                  <Button size="icon" variant="ghost" onClick={() => saveColour(colour)}><Save className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteColour(colour.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium">{colour.label}</span>
                  <span className="text-sm font-mono text-muted-foreground">{colour.hex_value}</span>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Brand Fonts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Type className="h-5 w-5" /> Brand Fonts</CardTitle>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={addFont}>
                <Plus className="h-4 w-4 mr-1" /> Add Font
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {localFonts.length === 0 && <p className="text-sm text-muted-foreground">No fonts added yet.</p>}
          {localFonts.map(font => (
            <div key={font.id} className="flex items-center gap-3">
              {canEdit ? (
                <>
                  <Input value={font.label} onChange={e => updateFont(font.id, 'label', e.target.value)} className="w-32" placeholder="Label" />
                  <Input value={font.font_name} onChange={e => updateFont(font.id, 'font_name', e.target.value)} className="flex-1" placeholder="Font name (e.g. DM Sans)" />
                  <Button size="icon" variant="ghost" onClick={() => saveFont(font)}><Save className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteFont(font.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium">{font.label}:</span>
                  <span className="text-sm text-muted-foreground">{font.font_name}</span>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Google Drive Link */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ExternalLink className="h-5 w-5" /> Google Drive Media Folder</CardTitle></CardHeader>
        <CardContent>
          {canEdit ? (
            <div className="flex gap-2">
              <Input
                value={driveLink}
                onChange={e => setDriveLink(e.target.value)}
                placeholder="Paste Google Drive folder link"
                className="flex-1"
              />
              <Button onClick={saveDriveLink}><Save className="h-4 w-4 mr-1" /> Save</Button>
            </div>
          ) : driveLink ? (
            <Button variant="outline" asChild>
              <a href={driveLink} target="_blank" rel="noopener noreferrer">
                Open Client Media Folder <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">No link saved yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
