-- Add body column to client_requests for detailed content (like tracking scripts)
ALTER TABLE public.client_requests ADD COLUMN IF NOT EXISTS body TEXT;

-- Create storage bucket for request attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('request-attachments', 'request-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create table to track request attachments
CREATE TABLE IF NOT EXISTS public.request_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.client_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  uploaded_by TEXT NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for request_attachments
CREATE POLICY "Attachments are viewable by admins"
ON public.request_attachments
FOR SELECT
USING (true);

CREATE POLICY "Attachments can be inserted"
ON public.request_attachments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Attachments can be deleted by admins"
ON public.request_attachments
FOR DELETE
USING (true);

-- Storage policies for request-attachments bucket
CREATE POLICY "Request attachments can be uploaded"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'request-attachments');

CREATE POLICY "Request attachments can be viewed"
ON storage.objects
FOR SELECT
USING (bucket_id = 'request-attachments');

CREATE POLICY "Request attachments can be deleted by admins"
ON storage.objects
FOR DELETE
USING (bucket_id = 'request-attachments');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_request_attachments_request_id ON public.request_attachments(request_id);