import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'checkbox_group';
export type FormType = 'website' | 'ai' | 'app';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  form_type: FormType;
  step_number: number;
  step_title: string;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  placeholder: string | null;
  is_required: boolean;
  options: FieldOption[];
  grid_cols: number;
  display_order: number;
  is_active: boolean;
  help_text: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface FormFieldInsert {
  form_type: FormType;
  step_number: number;
  step_title: string;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  placeholder?: string | null;
  is_required?: boolean;
  options?: FieldOption[];
  grid_cols?: number;
  display_order?: number;
  is_active?: boolean;
  help_text?: string | null;
  created_by?: string | null;
}

export interface FormFieldUpdate extends Partial<FormFieldInsert> {
  id: string;
}

function parseOptions(options: Json | null): FieldOption[] {
  if (!options || !Array.isArray(options)) return [];
  return options.map((opt) => {
    if (typeof opt === 'object' && opt !== null && 'value' in opt && 'label' in opt) {
      return { value: String(opt.value), label: String(opt.label) };
    }
    return { value: '', label: '' };
  }).filter(o => o.value);
}

export function useFormFields(formType?: FormType) {
  return useQuery({
    queryKey: ['form-fields', formType],
    queryFn: async () => {
      let query = supabase
        .from('form_fields')
        .select('*')
        .order('step_number', { ascending: true })
        .order('display_order', { ascending: true });

      if (formType) {
        query = query.eq('form_type', formType);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(field => ({
        ...field,
        form_type: field.form_type as FormType,
        field_type: field.field_type as FieldType,
        options: parseOptions(field.options as Json),
      })) as FormField[];
    },
  });
}

export function useActiveFormFields(formType: FormType) {
  return useQuery({
    queryKey: ['active-form-fields', formType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_type', formType)
        .eq('is_active', true)
        .order('step_number', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(field => ({
        ...field,
        form_type: field.form_type as FormType,
        field_type: field.field_type as FieldType,
        options: parseOptions(field.options as Json),
      })) as FormField[];
    },
  });
}

export function useCreateFormField() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (field: FormFieldInsert) => {
      const { data, error } = await supabase
        .from('form_fields')
        .insert({
          form_type: field.form_type,
          step_number: field.step_number,
          step_title: field.step_title,
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          placeholder: field.placeholder,
          is_required: field.is_required,
          options: (field.options || []) as unknown as Json,
          grid_cols: field.grid_cols,
          display_order: field.display_order,
          is_active: field.is_active,
          help_text: field.help_text,
          created_by: field.created_by,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-fields'] });
      queryClient.invalidateQueries({ queryKey: ['active-form-fields'] });
      toast({ title: 'Form field created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating field', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateFormField() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: FormFieldUpdate) => {
      const updateData: Record<string, unknown> = {};
      
      if (updates.form_type !== undefined) updateData.form_type = updates.form_type;
      if (updates.step_number !== undefined) updateData.step_number = updates.step_number;
      if (updates.step_title !== undefined) updateData.step_title = updates.step_title;
      if (updates.field_name !== undefined) updateData.field_name = updates.field_name;
      if (updates.field_label !== undefined) updateData.field_label = updates.field_label;
      if (updates.field_type !== undefined) updateData.field_type = updates.field_type;
      if (updates.placeholder !== undefined) updateData.placeholder = updates.placeholder;
      if (updates.is_required !== undefined) updateData.is_required = updates.is_required;
      if (updates.options !== undefined) updateData.options = updates.options as unknown as Json;
      if (updates.grid_cols !== undefined) updateData.grid_cols = updates.grid_cols;
      if (updates.display_order !== undefined) updateData.display_order = updates.display_order;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.help_text !== undefined) updateData.help_text = updates.help_text;

      const { data, error } = await supabase
        .from('form_fields')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-fields'] });
      queryClient.invalidateQueries({ queryKey: ['active-form-fields'] });
      toast({ title: 'Form field updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating field', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteFormField() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('form_fields')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-fields'] });
      queryClient.invalidateQueries({ queryKey: ['active-form-fields'] });
      toast({ title: 'Form field deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting field', description: error.message, variant: 'destructive' });
    },
  });
}
