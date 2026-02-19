
-- Create a public storage bucket for site screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('site-screenshots', 'site-screenshots', true);

-- Allow public read access
CREATE POLICY "Site screenshots are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-screenshots');

-- Allow service role to upload
CREATE POLICY "Service role can upload site screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-screenshots');
