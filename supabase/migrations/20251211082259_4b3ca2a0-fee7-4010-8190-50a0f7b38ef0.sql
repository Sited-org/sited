-- Add additional fields to admin_profiles
ALTER TABLE public.admin_profiles
ADD COLUMN phone text,
ADD COLUMN date_of_birth date;