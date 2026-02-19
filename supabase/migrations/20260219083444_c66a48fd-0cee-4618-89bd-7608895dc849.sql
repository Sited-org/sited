
-- Add new enum values to lead_status
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'warm_lead';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'new_lead';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'new_client';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'mbr_sold_dev';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'current_mbr';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'ot_sold_dev';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'current_ot';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'no_show';

-- Create status history table to track all transitions
CREATE TABLE IF NOT EXISTS public.lead_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

-- Admins can view
CREATE POLICY "Admins can view status history"
ON public.lead_status_history
FOR SELECT
USING (is_admin(auth.uid()));

-- Editors can insert
CREATE POLICY "Editors can insert status history"
ON public.lead_status_history
FOR INSERT
WITH CHECK (can_edit_leads(auth.uid()));

-- Developers can view assigned lead history
CREATE POLICY "Developers can view assigned lead history"
ON public.lead_status_history
FOR SELECT
USING (is_developer(auth.uid()) AND lead_id IN (
  SELECT id FROM leads WHERE assigned_to = auth.uid()
));
