import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Service {
  id: string;
  title: string;
  tagline: string;
  stat_value: string;
  stat_label: string;
  features: string[];
  cta_text: string;
  cta_link: string;
  icon_name: string;
  gradient_from: string;
  gradient_to: string;
  accent_color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type ServiceInsert = Omit<Service, 'id' | 'created_at' | 'updated_at'>;
export type ServiceUpdate = Partial<ServiceInsert>;

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data as Service[];
    },
  });
}

export function usePublicServices() {
  return useQuery({
    queryKey: ['public-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data as Service[];
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (service: ServiceInsert) => {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['public-services'] });
      toast({ title: 'Service created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating service', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & ServiceUpdate) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['public-services'] });
      toast({ title: 'Service updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating service', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['public-services'] });
      toast({ title: 'Service deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting service', description: error.message, variant: 'destructive' });
    },
  });
}
