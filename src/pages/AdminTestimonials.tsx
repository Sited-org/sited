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
import { Plus, Pencil, Trash2, ExternalLink, Video, GripVertical } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const PROJECT_TYPES = ['Website Design', 'App Development', 'AI Integration'];

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

  // Only owner and admin can access
  if (userRole && !['owner', 'admin'].includes(userRole.role)) {
    return <Navigate to="/admin" replace />;
  }

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
      created_by: testimonial.created_by,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...form });
    } else {
      await createMutation.mutateAsync(form);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">Manage testimonials displayed on the Work page</p>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Metric 1 (e.g., "3x" / "Conversion Rate")</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Value"
                      value={form.metric_1_value || ''}
                      onChange={(e) => updateField('metric_1_value', e.target.value)}
                    />
                    <Input
                      placeholder="Label"
                      value={form.metric_1_label || ''}
                      onChange={(e) => updateField('metric_1_label', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Metric 2 (e.g., "50k+" / "Users")</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Value"
                      value={form.metric_2_value || ''}
                      onChange={(e) => updateField('metric_2_value', e.target.value)}
                    />
                    <Input
                      placeholder="Label"
                      value={form.metric_2_label || ''}
                      onChange={(e) => updateField('metric_2_label', e.target.value)}
                    />
                  </div>
                </div>
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

              <div className="space-y-2">
                <Label htmlFor="video_url">Video URL</Label>
                <Input
                  id="video_url"
                  type="url"
                  placeholder="https://..."
                  value={form.video_url || ''}
                  onChange={(e) => updateField('video_url', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_thumbnail">Video Thumbnail URL</Label>
                <Input
                  id="video_thumbnail"
                  type="url"
                  placeholder="https://..."
                  value={form.video_thumbnail || ''}
                  onChange={(e) => updateField('video_thumbnail', e.target.value)}
                />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={form.display_order}
                    onChange={(e) => updateField('display_order', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => updateField('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active (visible on Work page)</Label>
                </div>
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
                      <CardTitle className="text-lg flex items-center gap-2">
                        {testimonial.business_name}
                        {!testimonial.is_active && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Hidden</span>
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
                  {testimonial.metric_1_value && testimonial.metric_1_label && (
                    <div className="bg-muted px-3 py-1.5 rounded">
                      <span className="font-semibold">{testimonial.metric_1_value}</span>{' '}
                      <span className="text-muted-foreground">{testimonial.metric_1_label}</span>
                    </div>
                  )}
                  {testimonial.metric_2_value && testimonial.metric_2_label && (
                    <div className="bg-muted px-3 py-1.5 rounded">
                      <span className="font-semibold">{testimonial.metric_2_value}</span>{' '}
                      <span className="text-muted-foreground">{testimonial.metric_2_label}</span>
                    </div>
                  )}
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
