-- Add columns to store Google Analytics OAuth tokens for clients
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS ga_access_token TEXT,
ADD COLUMN IF NOT EXISTS ga_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS ga_token_expires_at TIMESTAMP WITH TIME ZONE;