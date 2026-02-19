-- Migrate legacy lead statuses to their funnel equivalents
UPDATE public.leads SET status = 'warm_lead' WHERE status IN ('new', 'contacted');
UPDATE public.leads SET status = 'new_client' WHERE status = 'booked_call';
UPDATE public.leads SET status = 'ot_sold_dev' WHERE status = 'sold';
