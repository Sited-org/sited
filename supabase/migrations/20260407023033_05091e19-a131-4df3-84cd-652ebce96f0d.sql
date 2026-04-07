
ALTER TABLE public.testimonials ADD COLUMN screenshot_slug text;

-- Pre-populate known slugs
UPDATE public.testimonials SET screenshot_slug = 'hunterinsight' WHERE website_url ILIKE '%hunterinsight%';
UPDATE public.testimonials SET screenshot_slug = 'inglebrown' WHERE website_url ILIKE '%inglebrown%';
UPDATE public.testimonials SET screenshot_slug = 'wisdomeducation' WHERE website_url ILIKE '%wisdomeducation%';
