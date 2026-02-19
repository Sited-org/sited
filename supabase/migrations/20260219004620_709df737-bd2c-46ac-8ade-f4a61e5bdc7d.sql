
-- Allow public (anonymous) read of the homepage_content setting
CREATE POLICY "Public can view homepage content"
ON public.system_settings
FOR SELECT
USING (setting_key = 'homepage_content');
