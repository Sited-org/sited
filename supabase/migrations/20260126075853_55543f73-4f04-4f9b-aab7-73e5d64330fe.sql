-- Drop the existing status check constraint and create a new one that includes 'cancelled'
ALTER TABLE public.client_requests DROP CONSTRAINT IF EXISTS client_requests_status_check;

ALTER TABLE public.client_requests ADD CONSTRAINT client_requests_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'cancelled'));