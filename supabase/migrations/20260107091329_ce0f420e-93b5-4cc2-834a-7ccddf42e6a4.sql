-- Add additional analytics columns for comprehensive tracking
ALTER TABLE public.website_analytics 
ADD COLUMN IF NOT EXISTS time_on_page INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS page_load_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_bounce BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_exit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_entry BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS browser TEXT;

-- Create index for better query performance on new columns
CREATE INDEX IF NOT EXISTS idx_website_analytics_session_created 
ON public.website_analytics(session_id, created_at DESC);