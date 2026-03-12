import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Image, Palette, Type, ExternalLink, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';
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

// Colour role definitions
const COLOUR_ROLES = [
  { role: 'primary', label: 'Primary', max: 1 },
  { role: 'secondary', label: 'Secondary', max: 2 },
  { role: 'accent', label: 'Accent', max: 3 },
] as const;

type ColourRole = 'primary' | 'secondary' | 'accent';

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

  // Sync local state when props change
  useEffect(() => {
    setLocalColours(brandColours);
  }, [brandColours]);

  useEffect(() => {
    setLocalFonts(brandFonts);
  }, [brandFonts]);

  // Parse role from label (e.g. "Primary" -> "primary", "Secondary 1" -> "secondary")
  const getColourRole = (label: string): ColourRole | null => {
    const lower = label.toLowerCase();
    if (lower.startsWith('primary')) return 'primary';
    if (lower.startsWith('secondary')) return 'secondary';
    if (lower.startsWith('accent')) return 'accent';
    return null;
  };

  const getColourCountByRole = (role: ColourRole): number => {
    return localColours.filter(c => getColourRole(c.label) === role).length;
  };

  // Check if the minimum brand colours requirement is met (at least 1 primary)
  const hasPrimary = getColourCountByRole('primary') >= 1;

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

  const addColourByRole = async (role: ColourRole) => {
    const roleConfig = COLOUR_ROLES.find(r => r.role === role)!;
    const currentCount = getColourCountByRole(role);
    if (currentCount >= roleConfig.max) {
      toast({ title: `Maximum ${roleConfig.max} ${roleConfig.label} colour${roleConfig.max > 1 ? 's' : ''} allowed`, variant: 'destructive' });
      return;
    }
    const label = roleConfig.max > 1 ? `${roleConfig.label} ${currentCount + 1}` : roleConfig.label;
    const { error } = await supabase.from('brand_colours').insert({
      lead_id: leadId,
      build_flow_id: buildFlowId,
      label,
      hex_value: '#000000',
      order_index: localColours.length,
    });
    if (!error) {
      await onUpdate();
      await checkAndAutoCompleteBrandColoursStep();
    }
  };

  const updateColour = (id: string, field: string, value: string) => {
    setLocalColours(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const saveColour = async (colour: BrandColour) => {
    const local = localColours.find(c => c.id === colour.id);
    if (!local) return;
    await supabase.from('brand_colours').update({ label: local.label, hex_value: local.hex_value }).eq('id', colour.id);
    toast({ title: 'Colour saved' });
    await checkAndAutoCompleteBrandColoursStep();
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

  const updateFont = (id: string, field: string, value: string) => {
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

  // Auto-complete the brand_colours step in phase 2 when at least 1 primary colour exists
  const checkAndAutoCompleteBrandColoursStep = async () => {
    // Re-fetch latest colours to ensure accurate count
    const { data: latestColours } = await supabase
      .from('brand_colours')
      .select('label')
      .eq('build_flow_id', buildFlowId);

    const hasPrimaryNow = (latestColours || []).some(c =>
      c.label.toLowerCase().startsWith('primary')
    );

    if (!hasPrimaryNow) return;

    // Find the brand_colours step
    const { data: phases } = await supabase
      .from('build_phases')
      .select('id')
      .eq('build_flow_id', buildFlowId)
      .eq('phase_key', 'assets')
      .maybeSingle();

    if (!phases) return;

    const { data: step } = await supabase
      .from('build_steps')
      .select('id, is_completed')
      .eq('phase_id', phases.id)
      .eq('step_key', 'brand_colours')
      .maybeSingle();

    if (!step || step.is_completed) return;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Auto-complete the step
    await supabase.from('step_completions').insert({
      step_id: step.id,
      build_flow_id: buildFlowId,
      completed_by: user.id,
      description: 'Brand colours added via Assets panel (auto-completed)',
    });

    await supabase.from('build_steps').update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      completed_by: user.id,
    }).eq('id', step.id);

    toast({ title: 'Brand colours step auto-completed ✓' });
    await onUpdate();
  };

  // Group colours by role for display
  const primaryColours = localColours.filter(c => getColourRole(c.label) === 'primary');
  const secondaryColours = localColours.filter(c => getColourRole(c.label) === 'secondary');
  const accentColours = localColours.filter(c => getColourRole(c.label) === 'accent');
  const otherColours = localColours.filter(c => getColourRole(c.label) === null);

  const renderColourRow = (colour: BrandColour) => (
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
  );

  const renderRoleSection = (role: ColourRole, colours: BrandColour[]) => {
    const roleConfig = COLOUR_ROLES.find(r => r.role === role)!;
    const canAdd = colours.length < roleConfig.max;
    return (
      <div key={role} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{roleConfig.label}</span>
            <span className="text-xs text-muted-foreground">
              ({colours.length}/{roleConfig.max})
            </span>
            {role === 'primary' && colours.length >= 1 && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </div>
          {canEdit && canAdd && (
            <Button size="sm" variant="outline" onClick={() => addColourByRole(role)} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Add {roleConfig.label}
            </Button>
          )}
        </div>
        {colours.length === 0 ? (
          <p className="text-xs text-muted-foreground pl-1">
            {role === 'primary' ? 'Required — add at least 1 primary colour' : 'No colours added yet'}
          </p>
        ) : (
          colours.map(renderColourRow)
        )}
      </div>
    );
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

      {/* Brand Colours — Role-based */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5" /> Brand Colours
              {hasPrimary && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            1 Primary (required) · up to 2 Secondary · up to 3 Accent
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {renderRoleSection('primary', primaryColours)}
          {renderRoleSection('secondary', secondaryColours)}
          {renderRoleSection('accent', accentColours)}
          {otherColours.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Other</span>
              {otherColours.map(renderColourRow)}
            </div>
          )}
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
