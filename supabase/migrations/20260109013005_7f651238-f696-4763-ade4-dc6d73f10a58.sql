-- Add columns to store generated AI prompts on leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS generated_prompt TEXT,
ADD COLUMN IF NOT EXISTS generated_prompt_research TEXT,
ADD COLUMN IF NOT EXISTS prompt_generated_at TIMESTAMP WITH TIME ZONE;