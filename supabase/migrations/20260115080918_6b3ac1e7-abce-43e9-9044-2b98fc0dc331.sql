-- Create table for client OTP codes (for email-based 2FA)
CREATE TABLE public.client_otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_otp_codes ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed as this is only accessed via service role in edge functions

-- Create index for faster lookups
CREATE INDEX idx_client_otp_codes_email ON public.client_otp_codes(email);
CREATE INDEX idx_client_otp_codes_expires ON public.client_otp_codes(expires_at);

-- Function to cleanup expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.client_otp_codes 
  WHERE expires_at < now() OR used = true;
$$;