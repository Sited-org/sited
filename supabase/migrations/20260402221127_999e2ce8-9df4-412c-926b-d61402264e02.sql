CREATE POLICY "Public can view active package products"
ON public.products
FOR SELECT
TO public
USING (is_active = true AND product_type = 'package');