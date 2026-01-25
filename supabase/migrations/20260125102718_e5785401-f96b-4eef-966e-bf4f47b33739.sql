-- Fix admin_otp_codes: Remove public read access, keep service role only for INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Service role can manage admin OTP codes" ON public.admin_otp_codes;

-- Create restrictive policies that only allow service role access (no SELECT for regular users)
-- Since these tables are only accessed via edge functions with service role, we only need service role policies
CREATE POLICY "Only service role can access admin OTP codes"
ON public.admin_otp_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix rate_limits: Remove public read access, keep service role only
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Create restrictive policy for service role only
CREATE POLICY "Only service role can access rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix customer_notes: Replace permissive INSERT with service role only
DROP POLICY IF EXISTS "Anyone can insert customer notes" ON public.customer_notes;

-- Allow only service role to insert customer notes (via edge functions)
CREATE POLICY "Service role can insert customer notes"
ON public.customer_notes
FOR INSERT
TO service_role
WITH CHECK (true);