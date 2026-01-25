-- =========================================
-- Security Hardening Migration
-- =========================================

-- 1. Fix request_attachments table RLS policies
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Attachments are viewable by admins" ON public.request_attachments;
DROP POLICY IF EXISTS "Attachments can be inserted" ON public.request_attachments;
DROP POLICY IF EXISTS "Attachments can be deleted by admins" ON public.request_attachments;

-- Create restrictive admin-only SELECT policy
CREATE POLICY "Admins can view request attachments"
ON public.request_attachments FOR SELECT
USING (is_admin(auth.uid()));

-- Service role only for inserts (edge function uses service role)
CREATE POLICY "Service role can insert attachments"
ON public.request_attachments FOR INSERT
WITH CHECK (false);

-- Admin delete policy
CREATE POLICY "Admins can delete attachments"
ON public.request_attachments FOR DELETE
USING (can_edit_leads(auth.uid()));

-- 2. Fix storage bucket policies for request-attachments
-- Drop existing permissive storage policies
DROP POLICY IF EXISTS "Request attachments can be uploaded" ON storage.objects;
DROP POLICY IF EXISTS "Request attachments can be viewed" ON storage.objects;
DROP POLICY IF EXISTS "Request attachments can be deleted by admins" ON storage.objects;

-- Create restrictive storage policies (service role for uploads via edge function)
-- No public INSERT - edge function uses service role
CREATE POLICY "Admins can view request attachments storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'request-attachments'
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can delete request attachments storage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'request-attachments'
  AND can_edit_leads(auth.uid())
);

-- 3. Fix leads table - restrict INSERT to service role only
-- The submit-lead edge function uses service role, so we can deny public inserts
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;

-- Service role only policy for inserts (edge function uses service role)
CREATE POLICY "Service role can insert leads"
ON public.leads FOR INSERT
WITH CHECK (false);

-- 4. Fix testimonials table - only show active testimonials marked for homepage
DROP POLICY IF EXISTS "Public can view active testimonials" ON public.testimonials;

CREATE POLICY "Public can view homepage testimonials"
ON public.testimonials FOR SELECT
USING (is_active = true AND show_on_homepage = true);

-- 5. Fix form_sessions - restrict to service role inserts only
-- Edge functions should handle session creation with proper validation
DROP POLICY IF EXISTS "Anyone can insert form sessions" ON public.form_sessions;
DROP POLICY IF EXISTS "Sessions can only update their own data" ON public.form_sessions;

-- Service role only for inserts (handled by edge functions)
CREATE POLICY "Service role can insert form sessions"
ON public.form_sessions FOR INSERT
WITH CHECK (false);

-- No public updates - sessions are managed by edge functions
CREATE POLICY "Service role can update form sessions"
ON public.form_sessions FOR UPDATE
USING (false);