import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, CheckCircle2, Loader2, X, Plus, Search, Palette, Type, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const IMAGE_SLOTS = [
  { key: 'logo_512', label: 'Logo', desc: 'Main brand logo', dims: 'PNG recommended' },
  { key: 'logo_32', label: 'Favicon', desc: 'Browser tab icon', dims: '32×32' },
  { key: 'og_image', label: 'Sharing Image', desc: 'Social media preview', dims: '1200×630' },
] as const;

const COLOUR_ROLES = [
  { key: 'primary', label: 'Primary Colour', placeholder: '#3B82F6', required: true },
  { key: 'secondary', label: 'Secondary Colour', placeholder: '#6366F1', required: false },
  { key: 'accent', label: 'Accent Colour', placeholder: '#F59E0B', required: false },
] as const;

interface ClientAssetUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  sessionToken: string;
  onUploaded?: () => void;
}

interface FontResult {
  family: string;
  category: string;
}

export function ClientAssetUploadDialog({ open, onOpenChange, leadId, sessionToken, onUploaded }: ClientAssetUploadDialogProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<Record<string, string>>({});
  const [colours, setColours] = useState<Record<string, string>>({ primary: '', secondary: '', accent: '' });
  const [fonts, setFonts] = useState<string[]>(['']);
  const [fontSearch, setFontSearch] = useState<Record<number, string>>({});
  const [fontResults, setFontResults] = useState<Record<number, FontResult[]>>({});
  const [allGoogleFonts, setAllGoogleFonts] = useState<FontResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [brandSubmitted, setBrandSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Load Google Fonts list once
  useEffect(() => {
    if (!open || allGoogleFonts.length > 0) return;
    fetch('https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyBwIX97bVWr3-6AIUvGkcNnmFgirefZ-20&sort=popularity')
      .then(r => r.json())
      .then(data => {
        if (data.items) {
          setAllGoogleFonts(data.items.slice(0, 500).map((f: any) => ({ family: f.family, category: f.category })));
        }
      })
      .catch(() => {
        setAllGoogleFonts([
          { family: 'Inter', category: 'sans-serif' },
          { family: 'Roboto', category: 'sans-serif' },
          { family: 'Open Sans', category: 'sans-serif' },
          { family: 'Lato', category: 'sans-serif' },
          { family: 'Montserrat', category: 'sans-serif' },
          { family: 'Poppins', category: 'sans-serif' },
          { family: 'DM Sans', category: 'sans-serif' },
          { family: 'Playfair Display', category: 'serif' },
          { family: 'Merriweather', category: 'serif' },
          { family: 'Raleway', category: 'sans-serif' },
        ]);
      });
  }, [open, allGoogleFonts.length]);

  const handleFontSearch = useCallback((index: number, query: string) => {
    setFontSearch(prev => ({ ...prev, [index]: query }));
    if (query.length < 1) {
      setFontResults(prev => ({ ...prev, [index]: [] }));
      return;
    }
    const filtered = allGoogleFonts.filter(f => 
      f.family.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
    setFontResults(prev => ({ ...prev, [index]: filtered }));
  }, [allGoogleFonts]);

  const selectFont = (index: number, family: string) => {
    setFonts(prev => prev.map((f, i) => i === index ? family : f));
    setFontSearch(prev => ({ ...prev, [index]: '' }));
    setFontResults(prev => ({ ...prev, [index]: [] }));
  };

  const addFontSlot = () => {
    if (fonts.length < 3) setFonts(prev => [...prev, '']);
  };

  const removeFontSlot = (index: number) => {
    setFonts(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (slotKey: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large (max 10MB)');
      return;
    }

    setUploading(slotKey);
    try {
      const formData = new FormData();
      formData.append('session_token', sessionToken);
      formData.append('lead_id', leadId);
      formData.append('slot_key', slotKey);
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('upload-client-asset', { body: formData });
      
      if (error) throw new Error(error.message || 'Upload failed');
      if (data?.error) throw new Error(data.error);

      setUploaded(prev => ({ ...prev, [slotKey]: data.publicUrl }));
      toast.success(`${IMAGE_SLOTS.find(s => s.key === slotKey)?.label || 'Asset'} uploaded`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmitBrandData = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('upload-client-asset', {
        body: JSON.stringify({
          session_token: sessionToken,
          lead_id: leadId,
          action: 'save_brand_data',
          colours: Object.entries(colours)
            .filter(([_, v]) => v.trim())
            .map(([role, hex]) => ({ role, hex: hex.trim() })),
          fonts: fonts.filter(f => f.trim()),
        }),
      });

      if (error) throw new Error(error.message || 'Failed to save');
      if (data?.error) throw new Error(data.error);

      setBrandSubmitted(true);
      toast.success('Brand data saved! Please confirm all assets below.');
      onUploaded?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit brand data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAssets = async () => {
    setConfirming(true);
    try {
      const { data, error } = await supabase.functions.invoke('upload-client-asset', {
        body: JSON.stringify({
          session_token: sessionToken,
          lead_id: leadId,
          action: 'confirm_assets',
        }),
      });

      if (error) throw new Error(error.message || 'Confirmation failed');
      if (data?.error) throw new Error(data.error);

      setConfirmed(true);
      toast.success('All assets confirmed!');
      onUploaded?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm assets');
    } finally {
      setConfirming(false);
    }
  };

  const isValidHex = (hex: string) => /^#([0-9A-Fa-f]{3}){1,2}$/.test(hex);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Brand Asset Collection</DialogTitle>
          <DialogDescription>
            Upload your brand assets. These will be used to build your website.
          </DialogDescription>
        </DialogHeader>

        {confirmed ? (
          <div className="py-8 text-center">
            <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="font-medium">All Assets Confirmed!</p>
            <p className="text-sm text-muted-foreground mt-1">Your team will now use these to build your website.</p>
            <Button className="mt-4" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-6 mt-2">
            {/* Images Section */}
            <div>
              <p className="text-sm font-semibold flex items-center gap-2 mb-3">
                <ImageIcon className="h-4 w-4" /> Images
              </p>
              <div className="space-y-3">
                {IMAGE_SLOTS.map(slot => {
                  const isUploaded = !!uploaded[slot.key];
                  const isUploading = uploading === slot.key;
                  return (
                    <div key={slot.key} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{slot.label}</p>
                          <p className="text-xs text-muted-foreground">{slot.desc} • {slot.dims}</p>
                        </div>
                        {isUploaded && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </div>
                      {isUploaded ? (
                        <div className="relative">
                          <img src={uploaded[slot.key]} alt={slot.label} className="w-full h-16 object-contain bg-muted rounded" />
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded cursor-pointer">
                            <span className="text-white text-xs font-medium">Replace</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(slot.key, e.target.files[0])} />
                          </label>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-16 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Upload className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground mt-1">Click to upload</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={e => e.target.files?.[0] && handleUpload(slot.key, e.target.files[0])} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Colours Section */}
            <div>
              <p className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Palette className="h-4 w-4" /> Brand Colours
              </p>
              <div className="space-y-3">
                {COLOUR_ROLES.map(role => (
                  <div key={role.key} className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-md border border-border shrink-0" 
                      style={{ backgroundColor: isValidHex(colours[role.key]) ? colours[role.key] : '#e5e7eb' }} 
                    />
                    <div className="flex-1">
                      <Label className="text-xs">{role.label}{role.required && ' *'}</Label>
                      <Input 
                        value={colours[role.key]} 
                        onChange={e => setColours(prev => ({ ...prev, [role.key]: e.target.value }))}
                        placeholder={role.placeholder}
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                    {isValidHex(colours[role.key]) && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-5" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fonts Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Type className="h-4 w-4" /> Brand Fonts
                </p>
                {fonts.length < 3 && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addFontSlot}>
                    <Plus className="h-3 w-3 mr-1" /> Add Font
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">Select up to 3 Google Fonts for your website</p>
              <div className="space-y-3">
                {fonts.map((font, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        {font ? (
                          <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                            <span className="text-sm flex-1">{font}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setFonts(prev => prev.map((f, i) => i === index ? '' : f))}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={fontSearch[index] || ''}
                              onChange={e => handleFontSearch(index, e.target.value)}
                              placeholder="Search Google Fonts..."
                              className="h-8 text-sm pl-8"
                            />
                          </div>
                        )}
                        {/* Dropdown */}
                        {(fontResults[index] || []).length > 0 && !font && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {fontResults[index].map(f => (
                              <button
                                key={f.family}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                                onClick={() => selectFont(index, f.family)}
                              >
                                <span className="font-medium">{f.family}</span>
                                <span className="text-xs text-muted-foreground ml-2">{f.category}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {fonts.length > 1 && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => removeFontSlot(index)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit / Confirm */}
            <div className="space-y-3 pt-2">
              {!brandSubmitted ? (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleSubmitBrandData}
                    disabled={submitting}
                  >
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Brand Data'}
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/30 text-center space-y-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="text-sm font-medium">Brand data saved successfully</p>
                  <p className="text-xs text-muted-foreground">
                    Review your uploads above. When you're happy, confirm all assets are final.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setBrandSubmitted(false)}>
                      Edit
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleConfirmAssets}
                      disabled={confirming}
                    >
                      {confirming ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Confirming...</> : (
                        <><ShieldCheck className="h-4 w-4 mr-2" />Confirm All Assets</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
