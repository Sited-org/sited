-- Create storage bucket for testimonial videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('testimonial-videos', 'testimonial-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view testimonial videos (public)
CREATE POLICY "Anyone can view testimonial videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'testimonial-videos');

-- Policy: Authenticated admins can upload testimonial videos
CREATE POLICY "Admins can upload testimonial videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'testimonial-videos' 
  AND auth.role() = 'authenticated'
  AND public.is_admin(auth.uid())
);

-- Policy: Admins can update testimonial videos
CREATE POLICY "Admins can update testimonial videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'testimonial-videos' 
  AND auth.role() = 'authenticated'
  AND public.is_admin(auth.uid())
);

-- Policy: Admins can delete testimonial videos
CREATE POLICY "Admins can delete testimonial videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'testimonial-videos' 
  AND auth.role() = 'authenticated'
  AND public.is_admin(auth.uid())
);