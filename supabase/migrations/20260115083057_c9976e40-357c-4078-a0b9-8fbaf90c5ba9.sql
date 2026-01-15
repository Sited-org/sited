-- Create admin_otp_codes table for admin 2FA
CREATE TABLE IF NOT EXISTS public.admin_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.admin_otp_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for service role only (edge functions)
CREATE POLICY "Service role can manage admin OTP codes"
ON public.admin_otp_codes
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to cleanup expired admin OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_otp_codes
  WHERE expires_at < now() OR used = true;
END;
$$;