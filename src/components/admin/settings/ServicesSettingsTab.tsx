import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServices, useCreateService, useUpdateService, useDeleteService, Service, ServiceInsert } from '@/hooks/useServices';
import { Plus, Pencil, Trash2, Globe, Smartphone, Zap, ArrowRight, Sparkles, Code, Database, Shield, Palette, Camera, MessageSquare, BarChart } from 'lucide-react';

const ICON_OPTIONS = [
  { value: 'Globe', label: 'Globe', icon: Globe },
  { value: 'Smartphone', label: 'Smartphone', icon: Smartphone },
  { value: 'Zap', label: 'Zap', icon: Zap },
  { value: 'Sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'Code', label: 'Code', icon: Code },
  { value: 'Database', label: 'Database', icon: Database },
  { value: 'Shield', label: 'Shield', icon: Shield },
  { value: 'Palette', label: 'Palette', icon: Palette },
  { value: 'Camera', label: 'Camera', icon: Camera },
  { value: 'MessageSquare', label: 'Message', icon: MessageSquare },
  { value: 'BarChart', label: 'Chart', icon: BarChart },
];

const GRADIENT_PRESETS = [
  { label: 'Blue → Cyan', from: 'blue-500/20', to: 'cyan-500/20', accent: 'text-blue-400' },
  { label: 'Purple → Pink', from: 'purple-500/20', to: 'pink-500/20', accent: 'text-purple-400' },
  { label: 'Amber → Orange', from: 'amber-500/20', to: 'orange-500/20', accent: 'text-amber-400' },
  { label: 'Green → Emerald', from: 'green-500/20', to: 'emerald-500/20', accent: 'text-green-400' },
  { label: 'Rose → Red', from: 'rose-500/20', to: 'red-500/20', accent: 'text-rose-400' },
  { label: 'Indigo → Violet', from: 'indigo-500/20', to: 'violet-500/20', accent: 'text-indigo-400' },
];

const emptyServiceForm: ServiceInsert = {
  title: '',
  tagline: '',
  stat_value: '',
  stat_label: '',
  features: [],
  cta_text: '',
  cta_link: '',
  icon_name: 'Globe',
  gradient_from: 'blue-500/20',
  gradient_to: 'cyan-500/20',
  accent_color: 'text-blue-400',
  display_order: 0,
  is_active: true,
  created_by: null,
};

export default function ServicesSettingsTab() {
  const { user, userRole } = useAuth();
  const { data: services, isLoading } = useServices();
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceInsert>(emptyServiceForm);
  const [featuresInput, setFeaturesInput] = useState('');

  const canManageServices = userRole && ['owner', 'admin'].includes(userRole.role);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ ...emptyServiceForm, display_order: (services?.length || 0) + 1, created_by: user?.id || null });
    setFeaturesInput('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      title: service.title,
      tagline: service.tagline,
      stat_value: service.stat_value,
      stat_label: service.stat_label,
      features: service.features,
      cta_text: service.cta_text,
      cta_link: service.cta_link,
      icon_name: service.icon_name,
      gradient_from: service.gradient_from,
      gradient_to: service.gradient_to,
      accent_color: service.accent_color,
      display_order: service.display_order,
      is_active: service.is_active,
      created_by: service.created_by,
    });
    setFeaturesInput(service.features.join(', '));
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const features = featuresInput.split(',').map(f => f.trim()).filter(Boolean);
    const serviceData = { ...form, features };
    
    if (editingId) {
      await updateServiceMutation.mutateAsync({ id: editingId, ...serviceData });
    } else {
      await createServiceMutation.mutateAsync(serviceData);
    }
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyServiceForm);
    setFeaturesInput('');
  };

  const handleDelete = async (id: string) => {
    await deleteServiceMutation.mutateAsync(id);
  };

  const applyGradientPreset = (preset: typeof GRADIENT_PRESETS[0]) => {
    setForm(prev => ({
      ...prev,
      gradient_from: preset.from,
      gradient_to: preset.to,
      accent_color: preset.accent,
    }));
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName);
    return iconOption?.icon || Globe;
  };

  if (!canManageServices) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to manage services.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Services</h2>
          <p className="text-sm text-muted-foreground">Manage the services displayed on the Services page</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Websites"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline *</Label>
                  <Input
                    id="tagline"
                    value={form.tagline}
                    onChange={(e) => setForm(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="e.g., Built to convert."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stat_value">Stat Value *</Label>
                  <Input
                    id="stat_value"
                    value={form.stat_value}
                    onChange={(e) => setForm(prev => ({ ...prev, stat_value: e.target.value }))}
                    placeholder="e.g., 3x"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stat_label">Stat Label *</Label>
                  <Input
                    id="stat_label"
                    value={form.stat_label}
                    onChange={(e) => setForm(prev => ({ ...prev, stat_label: e.target.value }))}
                    placeholder="e.g., More Conversions"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (comma-separated) *</Label>
                <Input
                  id="features"
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  placeholder="Custom Design, Lightning Fast, SEO Ready"
                  required
                />
                <p className="text-xs text-muted-foreground">Separate each feature with a comma</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cta_text">CTA Button Text *</Label>
                  <Input
                    id="cta_text"
                    value={form.cta_text}
                    onChange={(e) => setForm(prev => ({ ...prev, cta_text: e.target.value }))}
                    placeholder="e.g., Build My Website"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta_link">CTA Link *</Label>
                  <Input
                    id="cta_link"
                    value={form.cta_link}
                    onChange={(e) => setForm(prev => ({ ...prev, cta_link: e.target.value }))}
                    placeholder="e.g., /onboarding/website"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={form.icon_name}
                  onValueChange={(v) => setForm(prev => ({ ...prev, icon_name: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(opt => {
                      const IconComp = opt.icon;
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <IconComp className="h-4 w-4" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyGradientPreset(preset)}
                      className={`p-3 rounded-lg border text-left text-sm transition-colors ${
                        form.gradient_from === preset.from && form.gradient_to === preset.to
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-full h-2 rounded bg-gradient-to-r from-${preset.from.replace('/20', '')} to-${preset.to.replace('/20', '')} mb-2 opacity-60`} />
                      <span className="text-xs">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active (visible on site)</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createServiceMutation.isPending || updateServiceMutation.isPending}>
                  {editingId ? 'Update' : 'Create'} Service
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-muted-foreground">Loading services...</div>
        </div>
      ) : services && services.length > 0 ? (
        <div className="grid gap-4">
          {services.map((service) => {
            const IconComp = getIconComponent(service.icon_name);
            return (
              <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${service.gradient_from} to-${service.gradient_to} flex items-center justify-center`}>
                        <IconComp className={`h-6 w-6 ${service.accent_color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {service.title}
                          {!service.is_active && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Hidden</span>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{service.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(service)}>
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
                            <AlertDialogTitle>Delete Service</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{service.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(service.id)}
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
                  <div className="flex items-center gap-6 mb-4">
                    <div>
                      <span className="text-2xl font-bold">{service.stat_value}</span>
                      <span className="text-sm text-muted-foreground ml-2">{service.stat_label}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {service.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded-full bg-muted border border-border"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="h-4 w-4" />
                    <span>{service.cta_text}</span>
                    <span className="text-xs">→ {service.cta_link}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No services yet</p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Service
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
