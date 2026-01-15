-- Add analytics_status column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS analytics_status TEXT DEFAULT 'not_setup' CHECK (analytics_status IN ('not_setup', 'pending', 'active'));

-- Add additional columns to website_analytics for enhanced tracking
ALTER TABLE public.website_analytics 
ADD COLUMN IF NOT EXISTS scroll_depth INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS viewport_width INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS viewport_height INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS connection_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS color_depth INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pixel_ratio NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dom_content_loaded INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS first_byte_time INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS element_tag TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS element_text TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS element_href TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS element_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS element_class TEXT DEFAULT NULL;

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_website_analytics_lead_date ON public.website_analytics(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_analytics_session ON public.website_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_website_analytics_event_type ON public.website_analytics(event_type);