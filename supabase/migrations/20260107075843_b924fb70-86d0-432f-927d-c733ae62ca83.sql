-- Add estimated_completion field to client_requests
ALTER TABLE public.client_requests 
ADD COLUMN estimated_completion timestamp with time zone;