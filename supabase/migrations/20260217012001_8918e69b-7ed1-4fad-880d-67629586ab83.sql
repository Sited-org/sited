-- Add 'draft' to valid request statuses (no constraint change needed since status is just text)
-- Add a cooldown tracking column for analysis requests
ALTER TABLE public.client_requests ADD COLUMN IF NOT EXISTS last_analysis_action_at timestamptz DEFAULT NULL;
