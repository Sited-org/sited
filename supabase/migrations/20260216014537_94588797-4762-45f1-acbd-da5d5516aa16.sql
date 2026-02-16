
-- Create storage bucket for onboarding file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('onboarding-files', 'onboarding-files', false);

-- Admins can view/download onboarding files
CREATE POLICY "Admins can view onboarding files"
ON storage.objects FOR SELECT
USING (bucket_id = 'onboarding-files' AND public.is_admin(auth.uid()));

-- Service role can upload onboarding files (edge function)
CREATE POLICY "Service role can upload onboarding files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'onboarding-files');

-- Admins can delete onboarding files
CREATE POLICY "Admins can delete onboarding files"
ON storage.objects FOR DELETE
USING (bucket_id = 'onboarding-files' AND public.is_admin(auth.uid()));
