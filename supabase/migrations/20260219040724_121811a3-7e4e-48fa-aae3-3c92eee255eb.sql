-- Allow public to read offer page content
CREATE POLICY "Public can view offer content"
ON public.system_settings
FOR SELECT
USING (setting_key = 'offer_page_content');

-- Insert default offer page content
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES ('offer_page_content', '{
  "headline": "YOUR WEBSITE IS WAITING",
  "subheadline": "Limited Time Offer",
  "description": "Get a fully custom, high-converting website built by our expert team — at a price that won''t last.",
  "original_price": "$2,500",
  "sale_price": "$997",
  "discount_text": "SAVE 60% — THIS WEEK ONLY",
  "cta_text": "Claim This Offer",
  "cta_link": "/contact",
  "features": ["Custom Design", "Mobile Responsive", "SEO Optimised", "Fast Loading", "Google Analytics", "Contact Forms"],
  "urgency_text": "This offer expires soon. Don''t miss out.",
  "image_url": "",
  "badge_text": "BEST VALUE",
  "guarantee_text": "100% satisfaction guaranteed or your money back."
}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;