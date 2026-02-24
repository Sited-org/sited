
-- Add per-page position columns (nullable integer, null = not assigned to that page)
ALTER TABLE public.testimonials 
  ADD COLUMN IF NOT EXISTS homepage_position integer,
  ADD COLUMN IF NOT EXISTS featured_position integer,
  ADD COLUMN IF NOT EXISTS portfolio_position integer;

-- Migrate existing data with sequential positions to avoid duplicates
UPDATE public.testimonials t
  SET homepage_position = sub.rn
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY display_order, created_at) as rn
    FROM public.testimonials WHERE show_on_homepage = true
  ) sub
  WHERE t.id = sub.id;

UPDATE public.testimonials t
  SET featured_position = sub.rn
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY display_order, created_at) as rn
    FROM public.testimonials WHERE show_featured = true
  ) sub
  WHERE t.id = sub.id;

UPDATE public.testimonials t
  SET portfolio_position = sub.rn
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY display_order, created_at) as rn
    FROM public.testimonials WHERE is_active = true
  ) sub
  WHERE t.id = sub.id;

-- Add unique partial indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_homepage_position 
  ON public.testimonials (homepage_position) WHERE homepage_position IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_featured_position 
  ON public.testimonials (featured_position) WHERE featured_position IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_portfolio_position 
  ON public.testimonials (portfolio_position) WHERE portfolio_position IS NOT NULL;
