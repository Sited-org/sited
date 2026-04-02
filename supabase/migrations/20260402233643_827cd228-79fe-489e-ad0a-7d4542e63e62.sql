ALTER TABLE public.client_requests
  ADD COLUMN IF NOT EXISTS requires_client_action boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS action_type text;