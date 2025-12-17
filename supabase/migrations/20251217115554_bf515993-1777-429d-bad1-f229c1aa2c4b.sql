-- Add show_on_homepage column to testimonials
ALTER TABLE public.testimonials 
ADD COLUMN show_on_homepage boolean NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.testimonials.show_on_homepage IS 'Whether to display this testimonial on the homepage (max 3 allowed)';