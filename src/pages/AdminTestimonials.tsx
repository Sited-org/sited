import { useState } from 'react';
import { useTestimonials, useCreateTestimonial, useUpdateTestimonial, useDeleteTestimonial, Testimonial, TestimonialInsert } from '@/hooks/useTestimonials';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, ExternalLink, Video, GripVertical, Home, Star, Briefcase } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { extractVimeoId } from '@/lib/vimeo';
import { PlacementSection } from '@/components/admin/testimonials/PlacementSection';

const PROJECT_TYPES = ['Website Design'];

const emptyForm: TestimonialInsert = {
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
};

export default function AdminTestimonials() {
  const { userRole, user } = useAuth();
  const { data: testimonials, isLoading } = useTestimonials();
  const createMutation = useCreateTestimonial();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonial();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TestimonialInsert>(emptyForm);

  if (userRole && !['owner', 'admin'].includes(userRole.role)) {
    return <Navigate to="/admin" replace />;
  }

  // Compute taken positions for each page (excluding the currently edited testimonial)
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
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sync toggle flags from position fields
    const payload = {
      ...form,
      is_active: form.portfolio_position != null || form.is_active,
      show_on_homepage: form.homepage_position != null,
      show_featured: form.featured_position != null,
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    
    setIsDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const updateField = (field: keyof TestimonialInsert, value: string | number | boolean | null) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">Manage website mockup placements across pages</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-primary">
              <Briefcase className="h-3.5 w-3.5" />
              Portfolio: {portfolioCount}
            </span>
            <span className="inline-flex items-center gap-1.5 text-accent-foreground">
              <Home className="h-3.5 w-3.5" />
              Homepage: {homepageCount}/3
            </span>
            <span className="inline-flex items-center gap-1.5 text-sited-blue">
              <Star className="h-3.5 w-3.5" />
              Landing: {featuredCount}/4
            </span>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Testimonial' : 'Add New Testimonial'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_type">Project Type *</Label>
                  <Select value={form.project_type} onValueChange={(v) => updateField('project_type', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={form.business_name}
                    onChange={(e) => updateField('business_name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description *</Label>
                <Textarea
                  id="short_description"
                  value={form.short_description}
                  onChange={(e) => updateField('short_description', e.target.value)}
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_time">Delivery Time</Label>
                <Input
                  id="delivery_time"
                  placeholder="e.g., 2 weeks"
                  value={form.delivery_time || ''}
                  onChange={(e) => updateField('delivery_time', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testimonial_text">Testimonial Text *</Label>
                <Textarea
                  id="testimonial_text"
                  value={form.testimonial_text}
                  onChange={(e) => updateField('testimonial_text', e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testimonial_author">Author Name *</Label>
                  <Input
                    id="testimonial_author"
                    value={form.testimonial_author}
                    onChange={(e) => updateField('testimonial_author', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testimonial_role">Author Role *</Label>
                  <Input
                    id="testimonial_role"
                    placeholder="e.g., CEO, Founder"
                    value={form.testimonial_role}
                    onChange={(e) => updateField('testimonial_role', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Vimeo URL Input */}
              <div className="space-y-2">
                <Label htmlFor="video_url">Vimeo Video URL</Label>
                <Input
                  id="video_url"
                  type="url"
                  placeholder="https://vimeo.com/123456789"
                  value={form.video_url || ''}
                  onChange={(e) => handleVimeoUrlChange(e.target.value)}
                />
                {vimeoPreviewId && (
                  <div className="rounded-lg overflow-hidden border border-border aspect-video">
                    <iframe
                      src={`https://player.vimeo.com/video/${vimeoPreviewId}`}
                      className="w-full h-full"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    />
                  </div>
                )}
                {form.video_url && !vimeoPreviewId && (
                  <p className="text-xs text-destructive">
                    Please enter a valid Vimeo URL (e.g., https://vimeo.com/123456789)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Paste a Vimeo link. The thumbnail will be fetched automatically.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  type="url"
                  placeholder="https://..."
                  value={form.website_url || ''}
                  onChange={(e) => updateField('website_url', e.target.value)}
                />
              </div>

              {/* ─── Page Placement Sections ─── */}
              <div className="space-y-3 pt-2">
                <Label className="text-base font-semibold">Page Placements</Label>
                <p className="text-xs text-muted-foreground -mt-1">Assign this testimonial to specific pages and choose its display position.</p>

                <PlacementSection
                  title="Portfolio"
                  description="Work / Portfolio page showcase"
                  icon={<Briefcase className="h-4 w-4" />}
                  enabled={form.portfolio_position != null}
                  onToggle={(v) => {
                    if (!v) {
                      updateField('portfolio_position', null);
                    }
                  }}
                  position={form.portfolio_position}
                  onPositionChange={(pos) => updateField('portfolio_position', pos)}
                  maxPositions={10}
                  takenPositions={takenPortfolioPositions}
                  accentClass="text-primary"
                />

                <PlacementSection
                  title="Homepage"
                  description="Homepage website mockup section (max 3)"
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
                  description="Featured on /go landing page (max 4)"
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
              </div>

              <div className="flex justify-end gap-3 pt-4">
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

      {/* Testimonials Grid */}
      {testimonials && testimonials.length > 0 ? (
        <div className="grid gap-4">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className={!testimonial.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                        {testimonial.business_name}
                        {testimonial.portfolio_position != null && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Portfolio #{testimonial.portfolio_position}</span>
                        )}
                        {testimonial.homepage_position != null && (
                          <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">Homepage #{testimonial.homepage_position}</span>
                        )}
                        {testimonial.featured_position != null && (
                          <span className="text-xs bg-sited-blue/20 text-sited-blue px-2 py-0.5 rounded">Landing #{testimonial.featured_position}</span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{testimonial.project_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {testimonial.website_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={testimonial.website_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {testimonial.video_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={testimonial.video_url} target="_blank" rel="noopener noreferrer">
                          <Video className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(testimonial)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the testimonial from {testimonial.business_name}? This action cannot be undone.
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
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{testimonial.short_description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {testimonial.delivery_time && (
                    <div className="bg-muted px-3 py-1.5 rounded">
                      <span className="font-semibold">{testimonial.delivery_time}</span>{' '}
                      <span className="text-muted-foreground">Delivery</span>
                    </div>
                  )}
                </div>
                <blockquote className="mt-4 border-l-2 border-accent pl-4 italic text-sm text-muted-foreground">
                  "{testimonial.testimonial_text}"
                  <cite className="block mt-2 not-italic font-medium text-foreground">
                    — {testimonial.testimonial_author}, {testimonial.testimonial_role}
                  </cite>
                </blockquote>
              </CardContent>
            </Card>
          ))}
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
