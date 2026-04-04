CREATE POLICY "Public can view deposit amount"
ON public.system_settings FOR SELECT TO public
USING (setting_key = 'deposit_amount');