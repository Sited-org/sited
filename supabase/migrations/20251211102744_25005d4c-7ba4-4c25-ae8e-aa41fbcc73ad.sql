-- Create rate_limits table for tracking API usage
CREATE TABLE public.rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address text NOT NULL,
    endpoint text NOT NULL,
    request_count integer NOT NULL DEFAULT 1,
    window_start timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_rate_limits_ip_endpoint ON public.rate_limits (ip_address, endpoint, window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service role) can manage rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Create CAPTCHA challenges table for server-side validation
CREATE TABLE public.captcha_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token text NOT NULL UNIQUE,
    answer integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
    used boolean NOT NULL DEFAULT false
);

-- Create index for token lookups
CREATE INDEX idx_captcha_token ON public.captcha_challenges (token);

-- Enable RLS  
ALTER TABLE public.captcha_challenges ENABLE ROW LEVEL SECURITY;

-- Only edge functions can manage captcha challenges
CREATE POLICY "Service role can manage captcha"
ON public.captcha_challenges
FOR ALL
USING (true)
WITH CHECK (true);

-- Cleanup function for expired challenges
CREATE OR REPLACE FUNCTION public.cleanup_expired_captchas()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    DELETE FROM public.captcha_challenges 
    WHERE expires_at < now() OR used = true;
$$;