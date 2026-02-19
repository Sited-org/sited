
-- Add booking_type column to distinguish between discovery and onboarding calls
ALTER TABLE public.bookings ADD COLUMN booking_type text NOT NULL DEFAULT 'discovery';
-- Add duration column so each booking tracks its own duration
ALTER TABLE public.bookings ADD COLUMN duration_minutes integer NOT NULL DEFAULT 20;
