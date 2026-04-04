CREATE POLICY "Public can view active portfolio testimonials"
ON public.testimonials FOR SELECT TO public
USING (is_active = true AND portfolio_position IS NOT NULL);