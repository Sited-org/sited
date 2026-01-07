-- Add tracking_id to leads for unique client identification
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS tracking_id TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex');

-- Create website_analytics table
CREATE TABLE public.website_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tracking_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  session_id TEXT,
  event_type TEXT NOT NULL DEFAULT 'page_view',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast queries
CREATE INDEX idx_website_analytics_lead_id ON public.website_analytics(lead_id);
CREATE INDEX idx_website_analytics_tracking_id ON public.website_analytics(tracking_id);
CREATE INDEX idx_website_analytics_created_at ON public.website_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE public.website_analytics ENABLE ROW LEVEL SECURITY;

-- Allow insert from edge functions (service role)
CREATE POLICY "Service role can insert analytics"
ON public.website_analytics
FOR INSERT
WITH CHECK (true);

-- Allow admins to read all analytics
CREATE POLICY "Admins can view all analytics"
ON public.website_analytics
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Enable realtime for analytics
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_analytics;