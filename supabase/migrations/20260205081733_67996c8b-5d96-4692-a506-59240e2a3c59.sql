-- Add workflow_data column to leads table for storing workflow configuration and progress
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS workflow_data jsonb DEFAULT NULL;

COMMENT ON COLUMN public.leads.workflow_data IS 'Stores workflow stages configuration and progress for the project';