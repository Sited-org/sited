import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Testimonial {
  id: string;
  project_type: string;
  business_name: string;
  short_description: string;
  metric_1_value: string | null;
  metric_1_label: string | null;
  metric_2_value: string | null;
  metric_2_label: string | null;
  delivery_time: string | null;
  testimonial_text: string;
  testimonial_author: string;
  testimonial_role: string;
  video_url: string | null;
  video_thumbnail: string | null;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
  show_on_homepage: boolean;
  show_featured: boolean;
  homepage_position: number | null;
  featured_position: number | null;
  portfolio_position: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type TestimonialInsert = Omit<Testimonial, 'id' | 'created_at' | 'updated_at'>;
export type TestimonialUpdate = Partial<TestimonialInsert>;

export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Testimonial[];
    },
  });
}

export function usePublicTestimonials() {
  return useQuery({
    queryKey: ['public-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Testimonial[];
    },
  });
}

export function useHomepageTestimonials() {
  return useQuery({
    queryKey: ['homepage-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .eq('show_on_homepage', true)
        .not('homepage_position', 'is', null)
        .order('homepage_position', { ascending: true })
        .limit(3);

      if (error) throw error;
      return data as Testimonial[];
    },
  });
}

export function useFeaturedTestimonials() {
  return useQuery({
    queryKey: ['featured-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .eq('show_featured', true)
        .not('featured_position', 'is', null)
        .order('featured_position', { ascending: true })
        .limit(4);

      if (error) throw error;
      return data as Testimonial[];
    },
  });
}

export function usePortfolioTestimonials() {
  return useQuery({
    queryKey: ['portfolio-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .not('portfolio_position', 'is', null)
        .order('portfolio_position', { ascending: true });

      if (error) throw error;
      return data as Testimonial[];
    },
  });
}

const invalidateAll = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['testimonials'] });
  queryClient.invalidateQueries({ queryKey: ['public-testimonials'] });
  queryClient.invalidateQueries({ queryKey: ['homepage-testimonials'] });
  queryClient.invalidateQueries({ queryKey: ['featured-testimonials'] });
  queryClient.invalidateQueries({ queryKey: ['portfolio-testimonials'] });
};

export function useCreateTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testimonial: TestimonialInsert) => {
      const { data, error } = await supabase
        .from('testimonials')
        .insert(testimonial)
        .select()
        .single();

      if (error) throw error;
      return data as Testimonial;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Testimonial created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create testimonial: ' + error.message);
    },
  });
}

export function useUpdateTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TestimonialUpdate) => {
      const { data, error } = await supabase
        .from('testimonials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Testimonial;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Testimonial updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update testimonial: ' + error.message);
    },
  });
}

export function useDeleteTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Testimonial deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete testimonial: ' + error.message);
    },
  });
}
