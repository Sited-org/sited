import { useState } from 'react';
import { useTestimonials, useCreateTestimonial, useUpdateTestimonial, useDeleteTestimonial, Testimonial, TestimonialInsert } from '@/hooks/useTestimonials';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, ExternalLink, Video, GripVertical, Home, Star, Briefcase, Camera, Globe, FileText, Play, LayoutGrid } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { extractVimeoId } from '@/lib/vimeo';
import { PlacementSection } from '@/components/admin/testimonials/PlacementSection';
import { deriveScreenshotSlug, getScreenshotUrl } from '@/lib/screenshot-url';
import { supabase } from '@/integrations/supabase/client';

const PROJECT_TYPES = ['Website Design'];

const emptyForm: TestimonialInsert & { screenshot_slug?: string } = {
  project_type: 'Website Design',
  business_name: '',
  short_description: '',
  metric_1_value: '',
  metric_1_label: '',
  metric_2_value: '',
  metric_2_label: '',
  delivery_time: '',
  testimonial_text: '',
  testimonial_author: '',
  testimonial_role: '',
  video_url: '',
  video_thumbnail: '',
  website_url: '',
  display_order: 0,
  is_active: true,
  show_on_homepage: false,
  show_featured: false,
  homepage_position: null,
  featured_position: null,
  portfolio_position: null,
  created_by: null,
  screenshot_slug: '',
};

export default function AdminTestimonials() {
  const { userRole, user } = useAuth();
  const { data: testimonials, isLoading } = useTestimonials();
  const createMutation = useCreateTestimonial();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonial();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TestimonialInsert & { screenshot_slug?: string }>(emptyForm);
  const [activeTab, setActiveTab] = useState('information');
  const [isCapturing, setIsCapturing] = useState(false);

  if (userRole && !['owner', 'admin'].includes(userRole.role)) {
    return <Navigate to="/admin" replace />;
  }

  const otherTestimonials = testimonials?.filter(t => t.id !== editingId) || [];
  const takenPortfolioPositions = otherTestimonials.filter(t => t.portfolio_position != null).map(t => t.portfolio_position!);
  const takenHomepagePositions = otherTestimonials.filter(t => t.homepage_position != null).map(t => t.homepage_position!);
  const takenFeaturedPositions = otherTestimonials.filter(t => t.featured_position != null).map(t => t.featured_position!);

  const portfolioCount = testimonials?.filter(t => t.portfolio_position != null).length || 0;
  const homepageCount = testimonials?.filter(t => t.show_on_homepage).length || 0;
  const featuredCount = testimonials?.filter(t => t.show_featured).length || 0;

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, display_order: (testimonials?.length || 0) + 1, created_by: user?.id || null });
    setActiveTab('information');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setForm({
      project_type: testimonial.project_type,
      business_name: testimonial.business_name,
      short_description: testimonial.short_description,
      metric_1_value: testimonial.metric_1_value || '',
      metric_1_label: testimonial.metric_1_label || '',
      metric_2_value: testimonial.metric_2_value || '',
      metric_2_label: testimonial.metric_2_label || '',
      delivery_time: testimonial.delivery_time || '',
      testimonial_text: testimonial.testimonial_text,
      testimonial_author: testimonial.testimonial_author,
      testimonial_role: testimonial.testimonial_role,
      video_url: testimonial.video_url || '',
      video_thumbnail: testimonial.video_thumbnail || '',
      website_url: testimonial.website_url || '',
      display_order: testimonial.display_order,
      is_active: testimonial.is_active,
      show_on_homepage: testimonial.show_on_homepage,
      show_featured: testimonial.show_featured,
      homepage_position: testimonial.homepage_position,
      featured_position: testimonial.featured_position,
      portfolio_position: testimonial.portfolio_position,
      created_by: testimonial.created_by,
      screenshot_slug: (testimonial as any).screenshot_slug || '',
    });
    setActiveTab('information');
    setIsDialogOpen(true);
  };

  const handleVimeoUrlChange = (url: string) => {
    updateField('video_url', url);
    const vimeoId = extractVimeoId(url);
    if (vimeoId) {
      updateField('video_thumbnail', `https://vumbnail.com/${vimeoId}.jpg`);
    } else {
      updateField('video_thumbnail', '');
    }
  };

  const handleCaptureScreenshot = async () => {
    setIsCapturing(true);
    try {
      const { data, error } = await supabase.functions.invoke('capture-site-screenshots');
      if (error) throw error;
      const result = data as any;
      if (result.results?.length) {
        toast.success(`Captured ${result.results.length} screenshot(s)`);
      }
      if (result.errors?.length) {
        toast.error(`${result.errors.length} capture(s) failed`);
      }
    } catch (err: any) {
      toast.error('Screenshot capture failed: ' + err.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const autoSlug = deriveScreenshotSlug(form.website_url);

    const payload = {
      ...form,
      is_active: form.portfolio_position != null || form.is_active,
      show_on_homepage: form.homepage_position != null,
      show_featured: form.featured_position != null,
      screenshot_slug: autoSlug,
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    
    // Auto-capture screenshot if website URL is set
    if (autoSlug && form.website_url) {
      supabase.functions.invoke('capture-site-screenshots', {
        body: { slug: autoSlug },
      }).then(({ data, error }) => {
        if (error) {
          toast.error('Screenshot capture failed');
        } else if ((data as any)?.results?.length) {
          toast.success('Screenshot captured successfully');
        } else if ((data as any)?.errors?.length) {
          toast.error('Screenshot capture failed: ' + (data as any).errors[0]?.error);
        }
      });
      toast.info('Capturing website screenshot in background...');
    }

    setIsDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const updateField = (field: string, value: string | number | boolean | null) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading testimonials...</div>
      </div>
    );
  }

  const vimeoPreviewId = extractVimeoId(form.video_url || '');
  const screenshotSlug = deriveScreenshotSlug(form.website_url);
  const screenshotUrl = getScreenshotUrl(screenshotSlug, editingId ? testimonials?.find(t => t.id === editingId)?.updated_at : null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage client testimonials, video reviews & website showcases</p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
              <Briefcase className="h-3 w-3" />
              Portfolio: {portfolioCount}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-2.5 py-1 rounded-full text-xs font-medium">
              <Home className="h-3 w-3" />
              Homepage: {homepageCount}/3
            </span>
            <span className="inline-flex items-center gap-1.5 bg-sited-blue/10 text-sited-blue px-2.5 py-1 rounded-full text-xs font-medium">
              <Star className="h-3 w-3" />
              Landing: {featuredCount}/4
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCaptureScreenshot} disabled={isCapturing}>
            <Camera className="h-4 w-4 mr-2" />
            {isCapturing ? 'Capturing...' : 'Capture Screenshots'}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Testimonial
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background text-foreground border-border [&]:bg-white dark:[&]:bg-zinc-900">
              <DialogHeader>
                <DialogTitle className="text-lg">{editingId ? 'Edit Testimonial' : 'New Testimonial'}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="information" className="text-xs gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Info
                    </TabsTrigger>
                    <TabsTrigger value="website" className="text-xs gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      Website
                    </TabsTrigger>
                    <TabsTrigger value="text" className="text-xs gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger value="video" className="text-xs gap-1">
                      <Play className="h-3.5 w-3.5" />
                      Video
                    </TabsTrigger>
                    <TabsTrigger value="placement" className="text-xs gap-1">
                      <LayoutGrid className="h-3.5 w-3.5" />
                      Order
                    </TabsTrigger>
                  </TabsList>

                  {/* ── Information Tab ── */}
                  <TabsContent value="information" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Project Type *</Label>
                        <Select value={form.project_type} onValueChange={(v) => updateField('project_type', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PROJECT_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Business Name *</Label>
                        <Input
                          value={form.business_name}
                          onChange={(e) => updateField('business_name', e.target.value)}
                          placeholder="e.g., Hunter Insight"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Short Description *</Label>
                      <Textarea
                        value={form.short_description}
                        onChange={(e) => updateField('short_description', e.target.value)}
                        rows={2}
                        placeholder="Brief summary of the project"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Delivery Time</Label>
                      <Input
                        placeholder="e.g., 3 days"
                        value={form.delivery_time || ''}
                        onChange={(e) => updateField('delivery_time', e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  {/* ── Website Tab ── */}
                  <TabsContent value="website" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Website URL</Label>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        value={form.website_url || ''}
                        onChange={(e) => updateField('website_url', e.target.value)}
                      />
                      {form.website_url && (
                        <p className="text-xs text-muted-foreground">
                          Screenshot file: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{screenshotSlug || '...'}-full.png</code>
                        </p>
                      )}
                    </div>

                    {/* Screenshot Preview */}
                    {screenshotUrl ? (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Screenshot Preview</Label>
                        <div className="relative rounded-lg border border-border overflow-hidden bg-muted" style={{ height: 300 }}>
                          <div className="absolute inset-0 overflow-y-auto">
                            <img
                              src={screenshotUrl}
                              alt={`${form.business_name || 'Website'} screenshot`}
                              className="w-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  const msg = document.createElement('div');
                                  msg.className = 'flex items-center justify-center h-full text-sm text-muted-foreground';
                                  msg.textContent = 'Screenshot not captured yet. Click "Capture Screenshots" above.';
                                  parent.appendChild(msg);
                                }
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This scrolling preview shows what visitors will see on the homepage & portfolio pages.
                        </p>
                      </div>
                    ) : form.website_url ? (
                      <div className="rounded-lg border border-dashed border-border p-8 text-center">
                        <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No screenshot captured yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Save this testimonial, then click "Capture Screenshots" to generate the preview.</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border p-8 text-center">
                        <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Enter a website URL above to enable the scrolling website showcase</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* ── Text Tab ── */}
                  <TabsContent value="text" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Testimonial Text *</Label>
                      <Textarea
                        value={form.testimonial_text}
                        onChange={(e) => updateField('testimonial_text', e.target.value)}
                        rows={4}
                        placeholder="What the client said about your work..."
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Author Name *</Label>
                        <Input
                          value={form.testimonial_author}
                          onChange={(e) => updateField('testimonial_author', e.target.value)}
                          placeholder="John Smith"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Author Role *</Label>
                        <Input
                          value={form.testimonial_role}
                          onChange={(e) => updateField('testimonial_role', e.target.value)}
                          placeholder="CEO, Founder"
                          required
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    {form.testimonial_text && (
                      <div className="rounded-lg border border-border p-4 bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Preview</p>
                        <blockquote className="border-l-2 border-primary pl-3 italic text-sm">
                          "{form.testimonial_text}"
                          {form.testimonial_author && (
                            <cite className="block mt-2 not-italic font-medium text-xs">
                              — {form.testimonial_author}{form.testimonial_role ? `, ${form.testimonial_role}` : ''}
                            </cite>
                          )}
                        </blockquote>
                      </div>
                    )}
                  </TabsContent>

                  {/* ── Video Tab ── */}
                  <TabsContent value="video" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Vimeo Video URL</Label>
                      <Input
                        type="url"
                        placeholder="https://vimeo.com/123456789"
                        value={form.video_url || ''}
                        onChange={(e) => handleVimeoUrlChange(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Paste a Vimeo link. The thumbnail will be auto-fetched.
                      </p>
                    </div>
                    {vimeoPreviewId ? (
                      <div className="rounded-lg overflow-hidden border border-border aspect-video">
                        <iframe
                          src={`https://player.vimeo.com/video/${vimeoPreviewId}`}
                          className="w-full h-full"
                          allow="autoplay; fullscreen"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border p-8 text-center">
                        <Play className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No video added yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Add a Vimeo URL above to embed a video testimonial</p>
                      </div>
                    )}
                    {form.video_url && !vimeoPreviewId && (
                      <p className="text-xs text-destructive">
                        Please enter a valid Vimeo URL (e.g., https://vimeo.com/123456789)
                      </p>
                    )}
                  </TabsContent>

                  {/* ── Order / Placement Tab ── */}
                  <TabsContent value="placement" className="space-y-4 mt-4">
                    <p className="text-xs text-muted-foreground">Choose where this testimonial and its website screenshot will appear across your site.</p>
                    
                    <PlacementSection
                      title="Portfolio"
                      description="Scrolling screenshot & text review on /work"
                      icon={<Briefcase className="h-4 w-4" />}
                      enabled={form.portfolio_position != null}
                      onToggle={(v) => { if (!v) updateField('portfolio_position', null); }}
                      position={form.portfolio_position}
                      onPositionChange={(pos) => updateField('portfolio_position', pos)}
                      maxPositions={10}
                      takenPositions={takenPortfolioPositions}
                      accentClass="text-primary"
                    />

                    <PlacementSection
                      title="Homepage"
                      description="Scrolling website showcase (max 3)"
                      icon={<Home className="h-4 w-4" />}
                      enabled={form.homepage_position != null}
                      onToggle={(v) => {
                        if (!v) {
                          updateField('homepage_position', null);
                          updateField('show_on_homepage', false);
                        }
                      }}
                      position={form.homepage_position}
                      onPositionChange={(pos) => {
                        updateField('homepage_position', pos);
                        updateField('show_on_homepage', true);
                      }}
                      maxPositions={3}
                      takenPositions={takenHomepagePositions}
                      accentClass="text-accent-foreground"
                    />

                    <PlacementSection
                      title="Landing Page"
                      description="Scrolling screenshot & text review on /go (max 4)"
                      icon={<Star className="h-4 w-4" />}
                      enabled={form.featured_position != null}
                      onToggle={(v) => {
                        if (!v) {
                          updateField('featured_position', null);
                          updateField('show_featured', false);
                        }
                      }}
                      position={form.featured_position}
                      onPositionChange={(pos) => {
                        updateField('featured_position', pos);
                        updateField('show_featured', true);
                      }}
                      maxPositions={4}
                      takenPositions={takenFeaturedPositions}
                      accentClass="text-sited-blue"
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? 'Update' : 'Create'} Testimonial
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Testimonials List */}
      {testimonials && testimonials.length > 0 ? (
        <div className="space-y-3">
          {testimonials.map((testimonial, index) => {
            const slug = (testimonial as any).screenshot_slug || deriveScreenshotSlug(testimonial.website_url);
            const thumbUrl = slug ? getScreenshotUrl(slug, testimonial.updated_at) : null;

            return (
              <Card key={testimonial.id} className={`transition-opacity ${!testimonial.is_active ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Drag handle + order number */}
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <GripVertical className="h-4 w-4 cursor-grab" />
                      <span className="text-xs font-mono">{index + 1}</span>
                    </div>

                    {/* Screenshot thumbnail */}
                    <div className="w-16 h-12 rounded border border-border overflow-hidden bg-muted flex-shrink-0">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={testimonial.business_name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Globe className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{testimonial.business_name}</h3>
                        {testimonial.portfolio_position != null && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">Portfolio #{testimonial.portfolio_position}</span>
                        )}
                        {testimonial.homepage_position != null && (
                          <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-medium">Home #{testimonial.homepage_position}</span>
                        )}
                        {testimonial.featured_position != null && (
                          <span className="text-[10px] bg-sited-blue/10 text-sited-blue px-1.5 py-0.5 rounded-full font-medium">Landing #{testimonial.featured_position}</span>
                        )}
                        {testimonial.video_url && (
                          <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full font-medium">Video</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {testimonial.short_description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {testimonial.website_url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={testimonial.website_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(testimonial)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
                            <AlertDialogDescription>
                              Delete the testimonial from {testimonial.business_name}? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(testimonial.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No testimonials yet</p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Testimonial
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
