-- Set screenshot_slug for WETR
UPDATE public.testimonials 
SET screenshot_slug = 'wetrpressurecleaning' 
WHERE website_url ILIKE '%wetrpressurecleaning%' AND screenshot_slug IS NULL;

-- Generic: derive slug for any future testimonials missing it
-- (This is a one-time backfill; going forward the app auto-sets it on save)