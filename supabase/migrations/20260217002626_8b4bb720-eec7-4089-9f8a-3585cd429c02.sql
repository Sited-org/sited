
-- Add fields to leads for analysis feature
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS membership_tier text,
  ADD COLUMN IF NOT EXISTS last_analysis_date timestamptz;

-- Create analysis_reports table
CREATE TABLE public.analysis_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  analysis_type text NOT NULL,
  domain text NOT NULL,
  analysis_content text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage analysis reports"
  ON public.analysis_reports FOR ALL
  USING (public.is_admin(auth.uid()));

-- Extend client_requests for analysis-originated requests
ALTER TABLE public.client_requests
  ADD COLUMN IF NOT EXISTS request_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS analysis_type text;
