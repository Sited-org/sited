import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OfferContent {
  headline: string;
  subheadline: string;
  description: string;
  original_price: string;
  sale_price: string;
  discount_text: string;
  cta_text: string;
  cta_link: string;
  features: string[];
  urgency_text: string;
  image_url: string;
  badge_text: string;
  guarantee_text: string;
}

const DEFAULT_OFFER: OfferContent = {
  headline: "YOUR WEBSITE IS WAITING",
  subheadline: "Limited Time Offer",
  description: "Get a fully custom, high-converting website built by our expert team — at a price that won't last.",
  original_price: "$2,500",
  sale_price: "$997",
  discount_text: "SAVE 60% — THIS WEEK ONLY",
  cta_text: "Claim This Offer",
  cta_link: "/contact",
  features: ["Custom Design", "Mobile Responsive", "SEO Optimised", "Fast Loading", "Google Analytics", "Contact Forms"],
  urgency_text: "This offer expires soon. Don't miss out.",
  image_url: "",
  badge_text: "BEST VALUE",
  guarantee_text: "100% satisfaction guaranteed or your money back.",
};

export function useOfferContent() {
  const [content, setContent] = useState<OfferContent>(DEFAULT_OFFER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'offer_page_content')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.setting_value) {
          setContent(data.setting_value as unknown as OfferContent);
        }
        setLoading(false);
      });
  }, []);

  return { content, loading };
}

export function useOfferContentAdmin() {
  const [content, setContent] = useState<OfferContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'offer_page_content')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.setting_value) {
          setContent(data.setting_value as unknown as OfferContent);
        } else {
          setContent(DEFAULT_OFFER);
        }
        setLoading(false);
      });
  }, []);

  const updateContent = useCallback(async (newContent: OfferContent) => {
    setSaving(true);
    const { error } = await supabase
      .from('system_settings')
      .update({ setting_value: newContent as any })
      .eq('setting_key', 'offer_page_content');

    if (error) {
      toast.error('Failed to save offer settings');
    } else {
      setContent(newContent);
      toast.success('Offer page updated');
    }
    setSaving(false);
  }, []);

  return { content, loading, saving, updateContent };
}
