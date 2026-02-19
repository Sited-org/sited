import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface HomepageContent {
  hero: {
    headline: string;
    subheadline: string;
    question: string;
    primary_cta_label: string;
    primary_cta_link: string;
    secondary_cta_label: string;
    secondary_cta_link: string;
    social_proof_label: string;
    mini_testimonials: { quote: string; name: string; role: string }[];
  };
  proof_bar: {
    title: string;
    items: string[];
  };
  more_of_everything: {
    title: string;
    items: { bold: string; supporting: string }[];
  };
  trusted_by: {
    heading: string;
    logos: { url: string }[];
    under_text: string;
  };
  who_we_help: {
    heading: string;
    intro: string;
    bullets: string[];
    closing: string;
  };
  why_stay: {
    heading: string;
    reasons: { title: string; description: string }[];
  };
  services: {
    heading: string;
    cards: { title: string; description: string; cta_label: string; cta_link: string }[];
  };
  results: {
    heading: string;
    cards: { quote: string; subtext: string }[];
    testimonial_strip_heading: string;
    testimonials: { quote: string; name: string; role: string }[];
  };
  process: {
    heading: string;
    steps: { title: string; description: string }[];
  };
  final_cta: {
    heading: string;
    body: string;
    button_label: string;
    button_link: string;
    reassurance: string;
  };
}

export function useHomepageContent() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'homepage_content')
      .maybeSingle();

    if (!error && data?.setting_value) {
      setContent(data.setting_value as unknown as HomepageContent);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return { content, loading, refetch: fetchContent };
}

export function useHomepageContentAdmin() {
  const { content, loading, refetch } = useHomepageContent();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const updateContent = async (newContent: HomepageContent) => {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('system_settings')
      .update({
        setting_value: newContent as unknown as Json,
        updated_by: userData.user?.id,
      })
      .eq('setting_key', 'homepage_content');

    if (error) {
      toast({ title: 'Error saving homepage content', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Homepage content saved' });
      await refetch();
    }
    setSaving(false);
  };

  return { content, loading, saving, updateContent, refetch };
}
