-- Add Zoom meeting fields to bookings
ALTER TABLE public.bookings
ADD COLUMN zoom_meeting_id text,
ADD COLUMN zoom_meeting_url text,
ADD COLUMN zoom_join_url text;