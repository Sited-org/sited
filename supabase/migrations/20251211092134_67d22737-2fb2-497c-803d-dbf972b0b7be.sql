-- First, update any existing leads to map to new statuses
UPDATE public.leads SET status = 'new' WHERE status IN ('new', 'cold', 'warm', 'hot');
UPDATE public.leads SET status = 'contacted' WHERE status = 'contacted';
UPDATE public.leads SET status = 'contacted' WHERE status = 'proposal_sent';
UPDATE public.leads SET status = 'lost' WHERE status = 'lost';

-- Drop the old enum and create new one
ALTER TABLE public.leads ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.leads ALTER COLUMN status TYPE text;

DROP TYPE IF EXISTS public.lead_status;

CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'booked_call', 'sold', 'lost');

ALTER TABLE public.leads ALTER COLUMN status TYPE public.lead_status USING status::public.lead_status;
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'new'::public.lead_status;