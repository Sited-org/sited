import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMemberships, Membership, MembershipInsert } from '@/hooks/useMemberships';
import { useTestimonials, useCreateTestimonial, useUpdateTestimonial, useDeleteTestimonial, Testimonial, TestimonialInsert } from '@/hooks/useTestimonials';
import { Plus, Pencil, Trash2, ExternalLink, Video, CreditCard, Star, User, Settings, GripVertical, Mail, Globe, Package } from 'lucide-react';
import MailSettingsTab from '@/components/admin/settings/MailSettingsTab';
import ServicesSettingsTab from '@/components/admin/settings/ServicesSettingsTab';
import { ProductsSettingsTab } from '@/components/admin/settings/ProductsSettingsTab';

const PROJECT_TYPES = ['Website Design', 'App Development', 'AI Integration'];

const emptyTestimonialForm: TestimonialInsert = {
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
  created_by: null,
};

const emptyMembershipForm: MembershipInsert = {
  name: '',
  description: '',
  price: 0,
  billing_interval: 'monthly',
  is_active: true,
  created_by: null,
};

export default function AdminSettings() {
  const { user, adminProfile, userRole, refreshAdminProfile } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(adminProfile?.display_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Memberships
  const { memberships, loading: membershipsLoading, addMembership, updateMembership, deleteMembership } = useMemberships();
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [editingMembershipId, setEditingMembershipId] = useState<string | null>(null);
  const [membershipForm, setMembershipForm] = useState<MembershipInsert>(emptyMembershipForm);

  // Testimonials
  const { data: testimonials, isLoading: testimonialsLoading } = useTestimonials();
  const createTestimonialMutation = useCreateTestimonial();
  const updateTestimonialMutation = useUpdateTestimonial();
  const deleteTestimonialMutation = useDeleteTestimonial();
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [testimonialForm, setTestimonialForm] = useState<TestimonialInsert>(emptyTestimonialForm);

  const canManageTestimonials = userRole && ['owner', 'admin'].includes(userRole.role);

  useEffect(() => {
    if (adminProfile?.display_name) {
      setDisplayName(adminProfile.display_name);
    }
  }, [adminProfile]);

  // Profile handlers
  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('admin_profiles').update({ display_name: displayName }).eq('user_id', user.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Profile updated' }); refreshAdminProfile(); }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast({ title: 'Password too short', variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Password updated' }); setNewPassword(''); }
    setSaving(false);
  };

  // Membership handlers
  const handleOpenMembershipCreate = () => {
    setEditingMembershipId(null);
    setMembershipForm({ ...emptyMembershipForm, created_by: user?.id || null });
    setMembershipDialogOpen(true);
  };

  const handleOpenMembershipEdit = (membership: Membership) => {
    setEditingMembershipId(membership.id);
    setMembershipForm({
      name: membership.name,
      description: membership.description,
      price: membership.price,
      billing_interval: membership.billing_interval,
      is_active: membership.is_active,
      created_by: membership.created_by,
    });
    setMembershipDialogOpen(true);
  };

  const handleMembershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMembershipId) {
      await updateMembership(editingMembershipId, membershipForm);
    } else {
      await addMembership(membershipForm);
    }
    setMembershipDialogOpen(false);
    setEditingMembershipId(null);
    setMembershipForm(emptyMembershipForm);
  };

  const handleMembershipDelete = async (id: string) => {
    await deleteMembership(id);
  };

  // Testimonial handlers
  const handleOpenTestimonialCreate = () => {
    setEditingTestimonialId(null);
    setTestimonialForm({ ...emptyTestimonialForm, display_order: (testimonials?.length || 0) + 1, created_by: user?.id || null });
    setTestimonialDialogOpen(true);
  };

  const handleOpenTestimonialEdit = (testimonial: Testimonial) => {
    setEditingTestimonialId(testimonial.id);
    setTestimonialForm({
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
      created_by: testimonial.created_by,
    });
    setTestimonialDialogOpen(true);
  };

  // Count how many are currently shown on homepage (excluding current editing one)
  const homepageTestimonialCount = testimonials?.filter(t => t.show_on_homepage && t.id !== editingTestimonialId).length || 0;
  const canEnableHomepage = homepageTestimonialCount < 3;

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTestimonialId) {
      await updateTestimonialMutation.mutateAsync({ id: editingTestimonialId, ...testimonialForm });
    } else {
      await createTestimonialMutation.mutateAsync(testimonialForm);
    }
    setTestimonialDialogOpen(false);
    setEditingTestimonialId(null);
    setTestimonialForm(emptyTestimonialForm);
  };

  const handleTestimonialDelete = async (id: string) => {
    await deleteTestimonialMutation.mutateAsync(id);
  };

  const updateTestimonialField = (field: keyof TestimonialInsert, value: string | number | boolean | null) => {
    setTestimonialForm(prev => ({ ...prev, [field]: value }));
  };

  const getIntervalLabel = (interval: string) => {
    switch (interval) {
      case 'weekly': return '/week';
      case 'monthly': return '/month';
      case 'quarterly': return '/quarter';
      case 'yearly': return '/year';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings</p>
      </div>

      <Tabs defaultValue="memberships" className="w-full">
        <TabsList className="grid w-full grid-cols-7 max-w-4xl">
          <TabsTrigger value="memberships" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Memberships
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <Globe className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="gap-2" disabled={!canManageTestimonials}>
            <Star className="h-4 w-4" />
            Testimonials
          </TabsTrigger>
          <TabsTrigger value="mail" className="gap-2">
            <Mail className="h-4 w-4" />
            Mail
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Memberships Tab */}
        <TabsContent value="memberships" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Memberships</h2>
              <p className="text-sm text-muted-foreground">Create and manage recurring membership plans</p>
            </div>
            <Dialog open={membershipDialogOpen} onOpenChange={setMembershipDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenMembershipCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Membership
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingMembershipId ? 'Edit Membership' : 'Add New Membership'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMembershipSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="membership_name">Name *</Label>
                    <Input
                      id="membership_name"
                      value={membershipForm.name}
                      onChange={(e) => setMembershipForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Website Maintenance"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="membership_description">Description</Label>
                    <Textarea
                      id="membership_description"
                      value={membershipForm.description || ''}
                      onChange={(e) => setMembershipForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this membership includes..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="membership_price">Price ($) *</Label>
                      <Input
                        id="membership_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={membershipForm.price}
                        onChange={(e) => setMembershipForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="membership_interval">Billing Interval</Label>
                      <Select
                        value={membershipForm.billing_interval}
                        onValueChange={(v) => setMembershipForm(prev => ({ ...prev, billing_interval: v as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="membership_active"
                      checked={membershipForm.is_active}
                      onCheckedChange={(checked) => setMembershipForm(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="membership_active">Active</Label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setMembershipDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingMembershipId ? 'Update' : 'Create'} Membership
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {membershipsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-muted-foreground">Loading memberships...</div>
            </div>
          ) : memberships.length > 0 ? (
            <div className="grid gap-4">
              {memberships.map((membership) => (
                <Card key={membership.id} className={!membership.is_active ? 'opacity-60' : ''}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{membership.name}</h3>
                        {!membership.is_active && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Inactive</span>
                        )}
                      </div>
                      {membership.description && (
                        <p className="text-sm text-muted-foreground mt-1">{membership.description}</p>
                      )}
                      <p className="text-lg font-bold mt-2">
                        ${membership.price.toLocaleString()}{getIntervalLabel(membership.billing_interval)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenMembershipEdit(membership)}>
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
                            <AlertDialogTitle>Delete Membership</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{membership.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleMembershipDelete(membership.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No memberships yet</p>
                <Button onClick={handleOpenMembershipCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Membership
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <ProductsSettingsTab />
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-6">
          <ServicesSettingsTab />
        </TabsContent>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Testimonials</h2>
              <p className="text-sm text-muted-foreground">Manage testimonials displayed on the Work page</p>
            </div>
            <Dialog open={testimonialDialogOpen} onOpenChange={setTestimonialDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenTestimonialCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Testimonial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTestimonialId ? 'Edit Testimonial' : 'Add New Testimonial'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTestimonialSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project_type">Project Type *</Label>
                      <Select value={testimonialForm.project_type} onValueChange={(v) => updateTestimonialField('project_type', v)}>
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
                        value={testimonialForm.business_name}
                        onChange={(e) => updateTestimonialField('business_name', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="short_description">Short Description *</Label>
                    <Textarea
                      id="short_description"
                      value={testimonialForm.short_description}
                      onChange={(e) => updateTestimonialField('short_description', e.target.value)}
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
                          value={testimonialForm.metric_1_value || ''}
                          onChange={(e) => updateTestimonialField('metric_1_value', e.target.value)}
                        />
                        <Input
                          placeholder="Label"
                          value={testimonialForm.metric_1_label || ''}
                          onChange={(e) => updateTestimonialField('metric_1_label', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Metric 2 (e.g., "50k+" / "Users")</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Value"
                          value={testimonialForm.metric_2_value || ''}
                          onChange={(e) => updateTestimonialField('metric_2_value', e.target.value)}
                        />
                        <Input
                          placeholder="Label"
                          value={testimonialForm.metric_2_label || ''}
                          onChange={(e) => updateTestimonialField('metric_2_label', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_time">Delivery Time</Label>
                    <Input
                      id="delivery_time"
                      placeholder="e.g., 2 weeks"
                      value={testimonialForm.delivery_time || ''}
                      onChange={(e) => updateTestimonialField('delivery_time', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testimonial_text">Testimonial Text *</Label>
                    <Textarea
                      id="testimonial_text"
                      value={testimonialForm.testimonial_text}
                      onChange={(e) => updateTestimonialField('testimonial_text', e.target.value)}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="testimonial_author">Author Name *</Label>
                      <Input
                        id="testimonial_author"
                        value={testimonialForm.testimonial_author}
                        onChange={(e) => updateTestimonialField('testimonial_author', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="testimonial_role">Author Role *</Label>
                      <Input
                        id="testimonial_role"
                        placeholder="e.g., CEO, Founder"
                        value={testimonialForm.testimonial_role}
                        onChange={(e) => updateTestimonialField('testimonial_role', e.target.value)}
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
                      value={testimonialForm.video_url || ''}
                      onChange={(e) => updateTestimonialField('video_url', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video_thumbnail">Video Thumbnail URL</Label>
                    <Input
                      id="video_thumbnail"
                      type="url"
                      placeholder="https://..."
                      value={testimonialForm.video_thumbnail || ''}
                      onChange={(e) => updateTestimonialField('video_thumbnail', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      type="url"
                      placeholder="https://..."
                      value={testimonialForm.website_url || ''}
                      onChange={(e) => updateTestimonialField('website_url', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={testimonialForm.display_order}
                        onChange={(e) => updateTestimonialField('display_order', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <Switch
                        id="is_active"
                        checked={testimonialForm.is_active}
                        onCheckedChange={(checked) => updateTestimonialField('is_active', checked)}
                      />
                      <Label htmlFor="is_active">Active (visible on Work page)</Label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Switch
                      id="show_on_homepage"
                      checked={testimonialForm.show_on_homepage}
                      onCheckedChange={(checked) => updateTestimonialField('show_on_homepage', checked)}
                      disabled={!canEnableHomepage && !testimonialForm.show_on_homepage}
                    />
                    <div>
                      <Label htmlFor="show_on_homepage" className="cursor-pointer">Show on Homepage</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {homepageTestimonialCount}/3 slots used. {!canEnableHomepage && !testimonialForm.show_on_homepage && 'Disable another to enable this.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setTestimonialDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTestimonialMutation.isPending || updateTestimonialMutation.isPending}>
                      {editingTestimonialId ? 'Update' : 'Create'} Testimonial
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {testimonialsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-muted-foreground">Loading testimonials...</div>
            </div>
          ) : testimonials && testimonials.length > 0 ? (
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
                            {testimonial.show_on_homepage && (
                              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">Homepage</span>
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
                        <Button variant="ghost" size="icon" onClick={() => handleOpenTestimonialEdit(testimonial)}>
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
                                onClick={() => handleTestimonialDelete(testimonial.id)}
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
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No testimonials yet</p>
                <Button onClick={handleOpenTestimonialCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Testimonial
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Mail Tab */}
        <TabsContent value="mail" className="mt-6">
          <MailSettingsTab />
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6 max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
              </div>
              <Button onClick={handleUpdateProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6 mt-6 max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="••••••••" 
                />
              </div>
              <Button onClick={handleChangePassword} disabled={saving || !newPassword}>
                {saving ? 'Updating...' : 'Update Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
