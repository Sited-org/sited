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
import { Plus, Pencil, Trash2, ExternalLink, Video, CreditCard, Star, User, GripVertical, Mail, Package, Shield, Key, Home, Eye } from 'lucide-react';


import { EmailOTPVerify } from '@/components/auth/EmailOTPVerify';
import MailSettingsTab from '@/components/admin/settings/MailSettingsTab';
import { ProductsSettingsTab } from '@/components/admin/settings/ProductsSettingsTab';
import SecuritySettingsTab from '@/components/admin/settings/SecuritySettingsTab';
import { extractVimeoId } from '@/lib/vimeo';
import { Badge } from '@/components/ui/badge';

const PROJECT_TYPES = ['Website Design'];

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
  show_featured: false,
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
  const [showPasswordOtp, setShowPasswordOtp] = useState(false);
  const [pendingPasswordChange, setPendingPasswordChange] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

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
    const { error } = await supabase.from('admin_profiles').update({ 
      display_name: displayName,
      email: user.email 
    }).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated' });
      refreshAdminProfile();
    }
    setSaving(false);
  };

  const handleInitiatePasswordChange = async () => {
    if (newPassword.length < 6) { 
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters', variant: 'destructive' }); 
      return; 
    }
    if (!currentPassword) {
      toast({ title: 'Current password required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Incorrect current password', variant: 'destructive' });
      return;
    }
    setPendingPasswordChange(newPassword);
    setShowPasswordOtp(true);
  };

  const handlePasswordChangeVerified = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pendingPasswordChange });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated successfully' });
      setNewPassword('');
      setCurrentPassword('');
    }
    setPendingPasswordChange('');
    setShowPasswordOtp(false);
    setSaving(false);
  };

  const handlePasswordOtpCancel = () => {
    setShowPasswordOtp(false);
    setPendingPasswordChange('');
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
      show_featured: testimonial.show_featured,
      created_by: testimonial.created_by,
    });
    setTestimonialDialogOpen(true);
  };

  const homepageTestimonialCount = testimonials?.filter(t => t.show_on_homepage && t.id !== editingTestimonialId).length || 0;
  const canEnableHomepage = homepageTestimonialCount < 3;
  const workPageCount = testimonials?.filter(t => t.is_active).length || 0;
  const homepageCount = testimonials?.filter(t => t.show_on_homepage).length || 0;

  const handleVimeoUrlChange = (url: string) => {
    updateTestimonialField('video_url', url);
    const vimeoId = extractVimeoId(url);
    if (vimeoId) {
      updateTestimonialField('video_thumbnail', `https://vumbnail.com/${vimeoId}.jpg`);
    } else {
      updateTestimonialField('video_thumbnail', '');
    }
  };

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

  const vimeoPreviewId = extractVimeoId(testimonialForm.video_url || '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings</p>
      </div>

      <Tabs defaultValue="memberships" className="w-full">
        <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="memberships" className="gap-2 flex-1 min-w-[100px]">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Memberships</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2 flex-1 min-w-[100px]">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="gap-2 flex-1 min-w-[100px]" disabled={!canManageTestimonials}>
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Testimonials</span>
          </TabsTrigger>
          <TabsTrigger value="mail" className="gap-2 flex-1 min-w-[100px]">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Mail</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 flex-1 min-w-[100px]">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 flex-1 min-w-[100px]">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
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
                    <Input id="membership_name" value={membershipForm.name} onChange={(e) => setMembershipForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Website Maintenance" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="membership_description">Description</Label>
                    <Textarea id="membership_description" value={membershipForm.description || ''} onChange={(e) => setMembershipForm(prev => ({ ...prev, description: e.target.value }))} rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="membership_price">Price ($) *</Label>
                      <Input id="membership_price" type="number" min="0" step="0.01" value={membershipForm.price} onChange={(e) => setMembershipForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="membership_interval">Billing Interval</Label>
                      <Select value={membershipForm.billing_interval} onValueChange={(v) => setMembershipForm(prev => ({ ...prev, billing_interval: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Switch id="membership_active" checked={membershipForm.is_active} onCheckedChange={(checked) => setMembershipForm(prev => ({ ...prev, is_active: checked }))} />
                    <Label htmlFor="membership_active">Active</Label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setMembershipDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">{editingMembershipId ? 'Update' : 'Create'} Membership</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {membershipsLoading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-pulse text-muted-foreground">Loading memberships...</div></div>
          ) : memberships.length > 0 ? (
            <div className="grid gap-4">
              {memberships.map((membership) => (
                <Card key={membership.id} className={!membership.is_active ? 'opacity-60' : ''}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{membership.name}</h3>
                        {!membership.is_active && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Inactive</span>}
                      </div>
                      {membership.description && <p className="text-sm text-muted-foreground mt-1">{membership.description}</p>}
                      <p className="text-lg font-bold mt-2">${membership.price.toLocaleString()}{getIntervalLabel(membership.billing_interval)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenMembershipEdit(membership)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete Membership</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{membership.name}"?</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleMembershipDelete(membership.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
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
                <Button onClick={handleOpenMembershipCreate}><Plus className="h-4 w-4 mr-2" />Add First Membership</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <ProductsSettingsTab />
        </TabsContent>

        {/* Testimonials Tab - Redesigned */}
        <TabsContent value="testimonials" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Testimonials</h2>
              <p className="text-sm text-muted-foreground">Manage testimonials across the website</p>
              <div className="flex gap-3 mt-2">
                <Badge variant="outline" className="gap-1.5">
                  <Eye className="h-3 w-3" />
                  Work Page: {workPageCount} active
                </Badge>
                <Badge variant="outline" className="gap-1.5 border-accent text-accent-foreground">
                  <Home className="h-3 w-3" />
                  Homepage: {homepageCount}/3 slots
                </Badge>
              </div>
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
                <form onSubmit={handleTestimonialSubmit} className="space-y-5 mt-4">
                  {/* Section 1: Business Info */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Business Name *</Label>
                        <Input value={testimonialForm.business_name} onChange={(e) => updateTestimonialField('business_name', e.target.value)} placeholder="e.g., Bloom Floristry" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Project Type</Label>
                        <Select value={testimonialForm.project_type} onValueChange={(v) => updateTestimonialField('project_type', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{PROJECT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2 mt-3">
                      <Label>Short Description *</Label>
                      <Textarea value={testimonialForm.short_description} onChange={(e) => updateTestimonialField('short_description', e.target.value)} rows={2} placeholder="Brief description of the project..." required />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="space-y-2">
                        <Label>Delivery Time</Label>
                        <Input value={testimonialForm.delivery_time || ''} onChange={(e) => updateTestimonialField('delivery_time', e.target.value)} placeholder="e.g., 2 weeks" />
                      </div>
                      <div className="space-y-2">
                        <Label>Website URL</Label>
                        <Input type="url" value={testimonialForm.website_url || ''} onChange={(e) => updateTestimonialField('website_url', e.target.value)} placeholder="https://..." />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Section 2: Testimonial */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Testimonial</p>
                    <div className="space-y-2 mt-2">
                      <Label>Testimonial Quote *</Label>
                      <Textarea value={testimonialForm.testimonial_text} onChange={(e) => updateTestimonialField('testimonial_text', e.target.value)} rows={3} placeholder="What the client said about their experience..." required />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="space-y-2">
                        <Label>Author Name *</Label>
                        <Input value={testimonialForm.testimonial_author} onChange={(e) => updateTestimonialField('testimonial_author', e.target.value)} placeholder="e.g., Sarah Mitchell" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Author Role *</Label>
                        <Input value={testimonialForm.testimonial_role} onChange={(e) => updateTestimonialField('testimonial_role', e.target.value)} placeholder="e.g., Founder" required />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Section 3: Video */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Video (Optional)</p>
                    <div className="space-y-2 mt-2">
                      <Label>Vimeo URL</Label>
                      <Input type="url" value={testimonialForm.video_url || ''} onChange={(e) => handleVimeoUrlChange(e.target.value)} placeholder="https://vimeo.com/123456789" />
                      {vimeoPreviewId && (
                        <div className="rounded-lg overflow-hidden border border-border aspect-video mt-2">
                          <iframe src={`https://player.vimeo.com/video/${vimeoPreviewId}`} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
                        </div>
                      )}
                      {testimonialForm.video_url && !vimeoPreviewId && (
                        <p className="text-xs text-destructive">Please enter a valid Vimeo URL</p>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Section 4: Visibility */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visibility</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {/* Work page toggle */}
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label className="cursor-pointer font-medium">Show on Portfolio Page</Label>
                            <p className="text-xs text-muted-foreground">Visible at /portfolio — replaces placeholder testimonials</p>
                          </div>
                        </div>
                        <Switch checked={testimonialForm.is_active} onCheckedChange={(checked) => updateTestimonialField('is_active', checked)} />
                      </div>

                      {/* Homepage toggle */}
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <Home className="h-4 w-4 text-accent-foreground" />
                          <div>
                            <Label className="cursor-pointer font-medium">Show on Homepage</Label>
                            <p className="text-xs text-muted-foreground">
                              Featured in the Results section ({homepageTestimonialCount}/3 slots used)
                              {!canEnableHomepage && !testimonialForm.show_on_homepage && ' — Disable another first'}
                            </p>
                          </div>
                        </div>
                        <Switch 
                          checked={testimonialForm.show_on_homepage} 
                          onCheckedChange={(checked) => updateTestimonialField('show_on_homepage', checked)} 
                          disabled={!canEnableHomepage && !testimonialForm.show_on_homepage}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Display Order</Label>
                      <Input type="number" value={testimonialForm.display_order} onChange={(e) => updateTestimonialField('display_order', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setTestimonialDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createTestimonialMutation.isPending || updateTestimonialMutation.isPending}>
                      {editingTestimonialId ? 'Update' : 'Create'} Testimonial
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {testimonialsLoading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-pulse text-muted-foreground">Loading testimonials...</div></div>
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
                            {!testimonial.is_active && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Hidden</span>}
                          </CardTitle>
                          <div className="flex gap-1.5 mt-1">
                            {testimonial.is_active && <Badge variant="secondary" className="text-[10px]">Work Page</Badge>}
                            {testimonial.show_on_homepage && <Badge className="text-[10px] bg-accent text-accent-foreground">Homepage</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {testimonial.website_url && (
                          <Button variant="ghost" size="icon" asChild><a href={testimonial.website_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                        )}
                        {testimonial.video_url && (
                          <Button variant="ghost" size="icon" asChild><a href={testimonial.video_url} target="_blank" rel="noopener noreferrer"><Video className="h-4 w-4" /></a></Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleOpenTestimonialEdit(testimonial)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Testimonial</AlertDialogTitle><AlertDialogDescription>Delete the testimonial from {testimonial.business_name}?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleTestimonialDelete(testimonial.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="border-l-2 border-accent pl-4 italic text-sm text-muted-foreground">
                      "{testimonial.testimonial_text}"
                      <cite className="block mt-1 not-italic font-medium text-foreground text-xs">
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
                <Button onClick={handleOpenTestimonialCreate}><Plus className="h-4 w-4 mr-2" />Add First Testimonial</Button>
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
          {showPasswordOtp ? (
            <EmailOTPVerify
              email={adminProfile?.email || user?.email || ''}
              userId={user?.id}
              userType="admin"
              onVerified={handlePasswordChangeVerified}
              onCancel={handlePasswordOtpCancel}
            />
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email || ''} disabled />
                  </div>
                  <Button onClick={handleUpdateProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <Button onClick={handleInitiatePasswordChange} disabled={saving || !newPassword || !currentPassword}>
                    {saving ? 'Updating...' : 'Change Password'}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <SecuritySettingsTab />
        </TabsContent>


      </Tabs>
    </div>
  );
}
