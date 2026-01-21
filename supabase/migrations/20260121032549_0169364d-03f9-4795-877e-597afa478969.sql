-- Add storage policies for request-attachments bucket
-- These allow authenticated admin users to manage attachments

-- Allow authenticated users (admins) to upload to the bucket
CREATE POLICY "Admins can upload request attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'request-attachments' 
  AND can_edit_leads(auth.uid())
);

-- Allow authenticated users (admins) to view request attachments
CREATE POLICY "Admins can view request attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'request-attachments' 
  AND is_admin(auth.uid())
);

-- Allow authenticated users (admins) to delete request attachments
CREATE POLICY "Admins can delete request attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'request-attachments' 
  AND can_edit_leads(auth.uid())
);