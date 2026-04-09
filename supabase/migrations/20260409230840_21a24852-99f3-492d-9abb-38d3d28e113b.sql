
-- =============================================
-- 1. FIX CAPTCHA POLICY — restrict to service_role
-- =============================================
DROP POLICY IF EXISTS "Service role can manage captcha" ON public.captcha_challenges;
CREATE POLICY "Service role can manage captcha"
  ON public.captcha_challenges FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =============================================
-- 2. CREATE is_staff() FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner', 'admin', 'editor', 'viewer')
  )
$$;

-- =============================================
-- 3. RESTRICT is_admin() to owner + admin only
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner', 'admin')
  )
$$;

-- =============================================
-- 4. UPDATE SELECT POLICIES: is_admin → is_staff
--    (for non-sensitive tables)
-- =============================================

-- customer_notes
DROP POLICY IF EXISTS "Admins can view customer notes" ON public.customer_notes;
CREATE POLICY "Staff can view customer notes" ON public.customer_notes FOR SELECT USING (is_staff(auth.uid()));

-- customer_notes UPDATE
DROP POLICY IF EXISTS "Admins can update customer notes" ON public.customer_notes;
CREATE POLICY "Staff can update customer notes" ON public.customer_notes FOR UPDATE USING (is_staff(auth.uid()));

-- form_fields (admins view all)
DROP POLICY IF EXISTS "Admins can view all form fields" ON public.form_fields;
CREATE POLICY "Staff can view all form fields" ON public.form_fields FOR SELECT USING (is_staff(auth.uid()));

-- email_logs
DROP POLICY IF EXISTS "Admins can view email logs" ON public.email_logs;
CREATE POLICY "Staff can view email logs" ON public.email_logs FOR SELECT USING (is_staff(auth.uid()));

-- form_sessions
DROP POLICY IF EXISTS "Admins can view form sessions" ON public.form_sessions;
CREATE POLICY "Staff can view form sessions" ON public.form_sessions FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- request_attachments
DROP POLICY IF EXISTS "Admins can view request attachments" ON public.request_attachments;
CREATE POLICY "Staff can view request attachments" ON public.request_attachments FOR SELECT USING (is_staff(auth.uid()));

-- lead_activities
DROP POLICY IF EXISTS "Admins can view lead activities" ON public.lead_activities;
CREATE POLICY "Staff can view lead activities" ON public.lead_activities FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- memberships
DROP POLICY IF EXISTS "Admins can view memberships" ON public.memberships;
CREATE POLICY "Staff can view memberships" ON public.memberships FOR SELECT USING (is_staff(auth.uid()));

-- testimonials
DROP POLICY IF EXISTS "Admins can view testimonials" ON public.testimonials;
CREATE POLICY "Staff can view testimonials" ON public.testimonials FOR SELECT USING (is_staff(auth.uid()));

-- project_updates
DROP POLICY IF EXISTS "Admins can view project updates" ON public.project_updates;
CREATE POLICY "Staff can view project updates" ON public.project_updates FOR SELECT USING (is_staff(auth.uid()));

-- system_settings (view only — insert/update stay restricted)
DROP POLICY IF EXISTS "Admins can view settings" ON public.system_settings;
CREATE POLICY "Staff can view settings" ON public.system_settings FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- bookings
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Staff can view all bookings" ON public.bookings FOR SELECT USING (is_staff(auth.uid()));

-- transactions
DROP POLICY IF EXISTS "Admins can view transactions" ON public.transactions;
CREATE POLICY "Staff can view transactions" ON public.transactions FOR SELECT USING (is_staff(auth.uid()));

-- website_analytics
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.website_analytics;
CREATE POLICY "Staff can view all analytics" ON public.website_analytics FOR SELECT USING (is_staff(auth.uid()));

-- lead_status_history
DROP POLICY IF EXISTS "Admins can view status history" ON public.lead_status_history;
CREATE POLICY "Staff can view status history" ON public.lead_status_history FOR SELECT USING (is_staff(auth.uid()));

-- leads
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
CREATE POLICY "Staff can view all leads" ON public.leads FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- analysis_reports
DROP POLICY IF EXISTS "Admins can manage analysis reports" ON public.analysis_reports;
CREATE POLICY "Staff can view analysis reports" ON public.analysis_reports FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage analysis reports" ON public.analysis_reports FOR ALL USING (is_admin(auth.uid()));

-- blog_posts
DROP POLICY IF EXISTS "Admins can view all blog posts" ON public.blog_posts;
CREATE POLICY "Staff can view all blog posts" ON public.blog_posts FOR SELECT USING (is_staff(auth.uid()));

-- project_sitemaps
DROP POLICY IF EXISTS "Admins can view all sitemaps" ON public.project_sitemaps;
CREATE POLICY "Staff can view all sitemaps" ON public.project_sitemaps FOR SELECT USING (is_staff(auth.uid()));

-- build_steps
DROP POLICY IF EXISTS "Admins can view all build steps" ON public.build_steps;
CREATE POLICY "Staff can view all build steps" ON public.build_steps FOR SELECT USING (is_staff(auth.uid()));

-- step_completions
DROP POLICY IF EXISTS "Admins can view all step completions" ON public.step_completions;
CREATE POLICY "Staff can view all step completions" ON public.step_completions FOR SELECT USING (is_staff(auth.uid()));

-- build_phases
DROP POLICY IF EXISTS "Admins can view all build phases" ON public.build_phases;
CREATE POLICY "Staff can view all build phases" ON public.build_phases FOR SELECT USING (is_staff(auth.uid()));

-- client_assets
DROP POLICY IF EXISTS "Admins can view all client assets" ON public.client_assets;
CREATE POLICY "Staff can view all client assets" ON public.client_assets FOR SELECT USING (is_staff(auth.uid()));

-- brand_colours
DROP POLICY IF EXISTS "Admins can view all brand colours" ON public.brand_colours;
CREATE POLICY "Staff can view all brand colours" ON public.brand_colours FOR SELECT USING (is_staff(auth.uid()));

-- brand_fonts
DROP POLICY IF EXISTS "Admins can view all brand fonts" ON public.brand_fonts;
CREATE POLICY "Staff can view all brand fonts" ON public.brand_fonts FOR SELECT USING (is_staff(auth.uid()));

-- discovery_answers
DROP POLICY IF EXISTS "Admins can view all discovery answers" ON public.discovery_answers;
CREATE POLICY "Staff can view all discovery answers" ON public.discovery_answers FOR SELECT USING (is_staff(auth.uid()));

-- build_flows
DROP POLICY IF EXISTS "Admins can view all build flows" ON public.build_flows;
CREATE POLICY "Staff can view all build flows" ON public.build_flows FOR SELECT USING (is_staff(auth.uid()));

-- products
DROP POLICY IF EXISTS "Admins can view products" ON public.products;
CREATE POLICY "Staff can view products" ON public.products FOR SELECT USING (is_staff(auth.uid()));

-- email_automations
DROP POLICY IF EXISTS "Admins can view email automations" ON public.email_automations;
CREATE POLICY "Staff can view email automations" ON public.email_automations FOR SELECT USING (is_staff(auth.uid()));

-- email_templates
DROP POLICY IF EXISTS "Admins can view email templates" ON public.email_templates;
CREATE POLICY "Staff can view email templates" ON public.email_templates FOR SELECT USING (is_staff(auth.uid()));

-- admin_profiles
DROP POLICY IF EXISTS "Admins can view admin profiles" ON public.admin_profiles;
CREATE POLICY "Staff can view admin profiles" ON public.admin_profiles FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- services
DROP POLICY IF EXISTS "Admins can view all services" ON public.services;
CREATE POLICY "Staff can view all services" ON public.services FOR SELECT USING (is_staff(auth.uid()));

-- client_requests
DROP POLICY IF EXISTS "Admins can view client requests" ON public.client_requests;
CREATE POLICY "Staff can view client requests" ON public.client_requests FOR SELECT USING (is_staff(auth.uid()));

-- sales_metrics
DROP POLICY IF EXISTS "Admins can view all sales metrics" ON public.sales_metrics;
CREATE POLICY "Staff can view all sales metrics" ON public.sales_metrics FOR SELECT USING (is_staff(auth.uid()));

-- project_milestones
DROP POLICY IF EXISTS "Admins can view project milestones" ON public.project_milestones;
CREATE POLICY "Staff can view project milestones" ON public.project_milestones FOR SELECT USING (is_staff(auth.uid()));

-- =============================================
-- 5. SENSITIVE TABLES: keep is_admin (owner+admin only)
--    credential_vault and user_roles already use is_admin
--    No changes needed — they're already restricted now
-- =============================================

-- =============================================
-- 6. FIX STORAGE UPLOAD POLICIES
-- =============================================
DROP POLICY IF EXISTS "Service role can upload onboarding files" ON storage.objects;
CREATE POLICY "Service role can upload onboarding files"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'onboarding-files');

DROP POLICY IF EXISTS "Service role can upload site screenshots" ON storage.objects;
CREATE POLICY "Service role can upload site screenshots"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'site-screenshots');
