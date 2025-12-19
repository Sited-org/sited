-- Add client password field to leads table for portal authentication
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS client_password_hash text,
ADD COLUMN IF NOT EXISTS client_first_login_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN public.leads.client_password_hash IS 'Hashed password for client portal access';
COMMENT ON COLUMN public.leads.client_first_login_at IS 'Timestamp of first client portal login';