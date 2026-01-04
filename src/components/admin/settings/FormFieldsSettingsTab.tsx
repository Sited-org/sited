import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, GripVertical, Globe, Sparkles, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { 
  useFormFields, 
  useCreateFormField, 
  useUpdateFormField, 
  useDeleteFormField,
  FormField,
  FormFieldInsert,
  FormType,
  FieldType,
  FieldOption
} from '@/hooks/useFormFields';

const FORM_TYPES: { value: FormType; label: string; icon: React.ReactNode }[] = [
  { value: 'website', label: 'Website', icon: <Globe className="h-4 w-4" /> },
  { value: 'ai', label: 'AI Integration', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'app', label: 'App', icon: <Smartphone className="h-4 w-4" /> },
];

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text Input' },
  { value: 'email', label: 'Email Input' },
  { value: 'tel', label: 'Phone Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Single Checkbox' },
  { value: 'checkbox_group', label: 'Checkbox Group' },
];

const emptyFieldForm: FormFieldInsert = {
  form_type: 'website',
  step_number: 1,
  step_title: '',
  field_name: '',
  field_label: '',
  field_type: 'text',
  placeholder: '',
  is_required: false,
  options: [],
  grid_cols: 1,
  display_order: 0,
  is_active: true,
  help_text: '',
  created_by: null,
};

export default function FormFieldsSettingsTab() {
  const { user } = useAuth();
  const [activeFormType, setActiveFormType] = useState<FormType>('website');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fieldForm, setFieldForm] = useState<FormFieldInsert>(emptyFieldForm);
  const [optionsText, setOptionsText] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));

  const { data: fields, isLoading } = useFormFields(activeFormType);
  const createMutation = useCreateFormField();
  const updateMutation = useUpdateFormField();
  const deleteMutation = useDeleteFormField();

  // Group fields by step
  const fieldsByStep = (fields || []).reduce((acc, field) => {
    const key = field.step_number;
    if (!acc[key]) {
      acc[key] = { title: field.step_title, fields: [] };
    }
    acc[key].fields.push(field);
    return acc;
  }, {} as Record<number, { title: string; fields: FormField[] }>);

  const steps = Object.entries(fieldsByStep)
    .map(([num, data]) => ({ number: parseInt(num), ...data }))
    .sort((a, b) => a.number - b.number);

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    const maxStep = steps.length > 0 ? Math.max(...steps.map(s => s.number)) : 1;
    const maxOrder = fields?.length || 0;
    setFieldForm({
      ...emptyFieldForm,
      form_type: activeFormType,
      step_number: 1,
      display_order: maxOrder,
      created_by: user?.id || null,
    });
    setOptionsText('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (field: FormField) => {
    setEditingId(field.id);
    setFieldForm({
      form_type: field.form_type,
      step_number: field.step_number,
      step_title: field.step_title,
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      placeholder: field.placeholder || '',
      is_required: field.is_required,
      options: field.options || [],
      grid_cols: field.grid_cols,
      display_order: field.display_order,
      is_active: field.is_active,
      help_text: field.help_text || '',
      created_by: field.created_by,
    });
    setOptionsText((field.options || []).map((o: FieldOption) => `${o.value}:${o.label}`).join('\n'));
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse options from text
    const options: FieldOption[] = optionsText
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [value, ...labelParts] = line.split(':');
        const label = labelParts.join(':') || value;
        return { value: value.trim(), label: label.trim() };
      });

    const fieldData = { ...fieldForm, options };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...fieldData });
    } else {
      await createMutation.mutateAsync(fieldData);
    }
    
    setDialogOpen(false);
    setEditingId(null);
    setFieldForm(emptyFieldForm);
    setOptionsText('');
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const needsOptions = ['select', 'radio', 'checkbox_group'].includes(fieldForm.field_type);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Form Fields</h2>
          <p className="text-sm text-muted-foreground">Manage onboarding form fields for all project types</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Field' : 'Add New Field'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Form Type *</Label>
                  <Select
                    value={fieldForm.form_type}
                    onValueChange={(v) => setFieldForm(prev => ({ ...prev, form_type: v as FormType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORM_TYPES.map(ft => (
                        <SelectItem key={ft.value} value={ft.value}>
                          <span className="flex items-center gap-2">
                            {ft.icon}
                            {ft.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Field Type *</Label>
                  <Select
                    value={fieldForm.field_type}
                    onValueChange={(v) => setFieldForm(prev => ({ ...prev, field_type: v as FieldType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map(ft => (
                        <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Step Number *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={fieldForm.step_number}
                    onChange={(e) => setFieldForm(prev => ({ ...prev, step_number: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Step Title *</Label>
                  <Input
                    value={fieldForm.step_title}
                    onChange={(e) => setFieldForm(prev => ({ ...prev, step_title: e.target.value }))}
                    placeholder="e.g., Contact Info"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field Name *</Label>
                  <Input
                    value={fieldForm.field_name}
                    onChange={(e) => setFieldForm(prev => ({ ...prev, field_name: e.target.value.replace(/\s+/g, '_').toLowerCase() }))}
                    placeholder="e.g., full_name"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Unique identifier (no spaces)</p>
                </div>
                <div className="space-y-2">
                  <Label>Field Label *</Label>
                  <Input
                    value={fieldForm.field_label}
                    onChange={(e) => setFieldForm(prev => ({ ...prev, field_label: e.target.value }))}
                    placeholder="e.g., Full Name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={fieldForm.placeholder || ''}
                  onChange={(e) => setFieldForm(prev => ({ ...prev, placeholder: e.target.value }))}
                  placeholder="e.g., Enter your full name"
                />
              </div>

              {needsOptions && (
                <div className="space-y-2">
                  <Label>Options *</Label>
                  <Textarea
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="value:Label (one per line)&#10;e.g., email:Email&#10;phone:Phone Call"
                    rows={4}
                    required={needsOptions}
                  />
                  <p className="text-xs text-muted-foreground">Format: value:Label (one per line)</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Help Text</Label>
                <Input
                  value={fieldForm.help_text || ''}
                  onChange={(e) => setFieldForm(prev => ({ ...prev, help_text: e.target.value }))}
                  placeholder="Additional guidance for users"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grid Columns</Label>
                  <Select
                    value={String(fieldForm.grid_cols)}
                    onValueChange={(v) => setFieldForm(prev => ({ ...prev, grid_cols: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Full Width</SelectItem>
                      <SelectItem value="2">Half Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    min="0"
                    value={fieldForm.display_order}
                    onChange={(e) => setFieldForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="is_required"
                    checked={fieldForm.is_required}
                    onCheckedChange={(checked) => setFieldForm(prev => ({ ...prev, is_required: checked }))}
                  />
                  <Label htmlFor="is_required">Required</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="is_active"
                    checked={fieldForm.is_active}
                    onCheckedChange={(checked) => setFieldForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full sm:w-auto">
                  {editingId ? 'Update' : 'Create'} Field
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Form Type Tabs */}
      <Tabs value={activeFormType} onValueChange={(v) => setActiveFormType(v as FormType)}>
        <TabsList className="w-full grid grid-cols-3">
          {FORM_TYPES.map(ft => (
            <TabsTrigger key={ft.value} value={ft.value} className="gap-2">
              {ft.icon}
              <span className="hidden sm:inline">{ft.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {FORM_TYPES.map(ft => (
          <TabsContent key={ft.value} value={ft.value} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-pulse text-muted-foreground">Loading fields...</div>
              </div>
            ) : steps.length > 0 ? (
              <div className="space-y-4">
                {steps.map((step) => (
                  <Card key={step.number}>
                    <button
                      onClick={() => toggleStep(step.number)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">Step {step.number}</Badge>
                        <span className="font-medium">{step.title}</span>
                        <span className="text-sm text-muted-foreground">({step.fields.length} fields)</span>
                      </div>
                      {expandedSteps.has(step.number) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    
                    {expandedSteps.has(step.number) && (
                      <CardContent className="pt-0 pb-4">
                        <div className="space-y-2">
                          {step.fields.map((field) => (
                            <div
                              key={field.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                !field.is_active ? 'opacity-50 bg-muted/30' : 'bg-background hover:bg-muted/30'
                              }`}
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 hidden sm:block" />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium truncate">{field.field_label}</span>
                                  {field.is_required && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5">Required</Badge>
                                  )}
                                  {!field.is_active && (
                                    <Badge variant="outline" className="text-[10px] px-1.5">Inactive</Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[10px] px-1.5">
                                    {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground font-mono">{field.field_name}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(field)} className="h-8 w-8">
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
                                      <AlertDialogTitle>Delete Field</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{field.field_label}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(field.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  {ft.icon}
                  <p className="text-muted-foreground mt-4 mb-4 text-center">No fields configured for {ft.label} forms</p>
                  <Button onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Field
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
