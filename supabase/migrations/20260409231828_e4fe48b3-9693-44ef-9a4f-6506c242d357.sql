
-- Fix 1: Add SELECT policy on onboarding-files storage bucket for staff
CREATE POLICY "Staff can view onboarding files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'onboarding-files' AND is_staff(auth.uid()));

-- Fix 2: Add explicit restrictive INSERT policy on user_roles to prevent privilege escalation
-- RLS is default-deny, but adding a restrictive policy for defense-in-depth
CREATE POLICY "Only managers can insert user roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (can_manage_users(auth.uid()));
