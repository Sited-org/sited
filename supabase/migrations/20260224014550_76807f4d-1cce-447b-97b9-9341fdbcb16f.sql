
CREATE POLICY "Public can view featured testimonials"
ON public.testimonials
FOR SELECT
USING ((is_active = true) AND (show_featured = true));
