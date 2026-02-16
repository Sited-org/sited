
-- Add Google Calendar event ID to bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS google_calendar_event_id text,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

-- Insert default calendar settings
INSERT INTO public.system_settings (setting_key, setting_value) 
VALUES (
  'calendar_config',
  '{
    "meeting_duration_minutes": 20,
    "buffer_before_minutes": 5,
    "buffer_after_minutes": 10,
    "available_days": [1, 2, 3, 4, 5],
    "available_hours_start": "09:00",
    "available_hours_end": "17:00",
    "google_calendar_connected": false,
    "google_calendar_id": null,
    "timezone": "Australia/Sydney"
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;
