-- Add Google Analytics fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS ga_property_id TEXT,
ADD COLUMN IF NOT EXISTS ga_status TEXT DEFAULT 'not_connected' CHECK (ga_status IN ('not_connected', 'pending', 'connected'));

-- Add comment for clarity
COMMENT ON COLUMN public.leads.ga_property_id IS 'Google Analytics Property ID for client website tracking';
COMMENT ON COLUMN public.leads.ga_status IS 'Status of Google Analytics connection: not_connected, pending, connected';