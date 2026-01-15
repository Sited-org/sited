-- Create system settings table for storing global configuration like 2FA requirements
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins to read settings
CREATE POLICY "Admins can view settings" 
ON public.system_settings 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow owners and admins to update settings
CREATE POLICY "Admins can update settings" 
ON public.system_settings 
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Allow owners and admins to insert settings
CREATE POLICY "Admins can insert settings" 
ON public.system_settings 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Add mfa_enrolled column to user_roles to track 2FA status per user
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS mfa_enrolled BOOLEAN NOT NULL DEFAULT false;

-- Insert default security settings
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES ('security', '{"require_2fa_for_team": false}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for timestamp updates
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_system_settings_timestamp();