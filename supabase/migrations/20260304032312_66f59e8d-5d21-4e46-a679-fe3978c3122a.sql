
-- Build Flows table
CREATE TABLE public.build_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  project_type text NOT NULL CHECK (project_type IN ('brochure', 'ecommerce', 'webapp', 'booking')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  staging_url text,
  is_live boolean NOT NULL DEFAULT false,
  live_at timestamptz,
  client_view_enabled boolean NOT NULL DEFAULT false
);

-- Build Phases table
CREATE TABLE public.build_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_flow_id uuid NOT NULL REFERENCES public.build_flows(id) ON DELETE CASCADE,
  phase_number integer NOT NULL,
  phase_key text NOT NULL,
  title text NOT NULL,
  description text,
  is_locked boolean NOT NULL DEFAULT true,
  is_completed boolean NOT NULL DEFAULT false,
  is_strictly_linear boolean NOT NULL DEFAULT false,
  is_skipped boolean NOT NULL DEFAULT false,
  unlocks_after_phase_key text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Build Steps table
CREATE TABLE public.build_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES public.build_phases(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  title text NOT NULL,
  description text,
  guidance text,
  is_completed boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  is_required boolean NOT NULL DEFAULT true,
  completed_at timestamptz,
  completed_by uuid,
  order_index integer NOT NULL DEFAULT 0,
  step_key text NOT NULL,
  is_skipped boolean NOT NULL DEFAULT false
);

-- Step Completions table
CREATE TABLE public.step_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL REFERENCES public.build_steps(id) ON DELETE CASCADE,
  build_flow_id uuid NOT NULL REFERENCES public.build_flows(id) ON DELETE CASCADE,
  completed_by uuid NOT NULL,
  screenshot_url text,
  description text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  is_visible_to_client boolean NOT NULL DEFAULT true
);

-- Discovery Answers table
CREATE TABLE public.discovery_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_flow_id uuid NOT NULL REFERENCES public.build_flows(id) ON DELETE CASCADE,
  question_key text NOT NULL,
  answer_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Client Assets table
CREATE TABLE public.client_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  build_flow_id uuid NOT NULL REFERENCES public.build_flows(id) ON DELETE CASCADE,
  logo_512 text,
  logo_192 text,
  logo_32 text,
  logo_16 text,
  logo_apple_touch text,
  og_image text,
  google_drive_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Brand Colours table
CREATE TABLE public.brand_colours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  build_flow_id uuid NOT NULL REFERENCES public.build_flows(id) ON DELETE CASCADE,
  label text NOT NULL,
  hex_value text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Brand Fonts table
CREATE TABLE public.brand_fonts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  build_flow_id uuid NOT NULL REFERENCES public.build_flows(id) ON DELETE CASCADE,
  label text NOT NULL,
  font_name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Credential Vault table
CREATE TABLE public.credential_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_flow_id uuid NOT NULL REFERENCES public.build_flows(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  key_type text NOT NULL,
  key_value text NOT NULL,
  date_collected timestamptz NOT NULL DEFAULT now(),
  collected_by uuid NOT NULL,
  notes text,
  is_test_key boolean NOT NULL DEFAULT false,
  is_live_key boolean NOT NULL DEFAULT false
);

-- Storage bucket for build assets
INSERT INTO storage.buckets (id, name, public) VALUES ('build-assets', 'build-assets', false);

-- RLS on all tables
ALTER TABLE public.build_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_colours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_vault ENABLE ROW LEVEL SECURITY;

-- RLS Policies for build_flows
CREATE POLICY "Admins can view all build flows" ON public.build_flows FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Developers can view assigned build flows" ON public.build_flows FOR SELECT USING (is_developer(auth.uid()) AND lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()));
CREATE POLICY "Editors can insert build flows" ON public.build_flows FOR INSERT WITH CHECK (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can update build flows" ON public.build_flows FOR UPDATE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can delete build flows" ON public.build_flows FOR DELETE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Developers can update assigned build flows" ON public.build_flows FOR UPDATE USING (is_developer(auth.uid()) AND lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()));

-- RLS Policies for build_phases
CREATE POLICY "Admins can view all build phases" ON public.build_phases FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Developers can view assigned build phases" ON public.build_phases FOR SELECT USING (is_developer(auth.uid()) AND build_flow_id IN (SELECT id FROM public.build_flows WHERE lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid())));
CREATE POLICY "Editors can insert build phases" ON public.build_phases FOR INSERT WITH CHECK (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can update build phases" ON public.build_phases FOR UPDATE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can delete build phases" ON public.build_phases FOR DELETE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Developers can update assigned build phases" ON public.build_phases FOR UPDATE USING (is_developer(auth.uid()) AND build_flow_id IN (SELECT id FROM public.build_flows WHERE lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid())));

-- RLS Policies for build_steps
CREATE POLICY "Admins can view all build steps" ON public.build_steps FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Developers can view assigned build steps" ON public.build_steps FOR SELECT USING (is_developer(auth.uid()) AND phase_id IN (SELECT id FROM public.build_phases WHERE build_flow_id IN (SELECT id FROM public.build_flows WHERE lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()))));
CREATE POLICY "Editors can insert build steps" ON public.build_steps FOR INSERT WITH CHECK (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can update build steps" ON public.build_steps FOR UPDATE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can delete build steps" ON public.build_steps FOR DELETE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Developers can update assigned build steps" ON public.build_steps FOR UPDATE USING (is_developer(auth.uid()) AND phase_id IN (SELECT id FROM public.build_phases WHERE build_flow_id IN (SELECT id FROM public.build_flows WHERE lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()))));

-- RLS Policies for step_completions
CREATE POLICY "Admins can view all step completions" ON public.step_completions FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Developers can view assigned step completions" ON public.step_completions FOR SELECT USING (is_developer(auth.uid()) AND build_flow_id IN (SELECT id FROM public.build_flows WHERE lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid())));
CREATE POLICY "Editors can insert step completions" ON public.step_completions FOR INSERT WITH CHECK (can_edit_leads(auth.uid()));
CREATE POLICY "Developers can insert assigned step completions" ON public.step_completions FOR INSERT WITH CHECK (is_developer(auth.uid()) AND build_flow_id IN (SELECT id FROM public.build_flows WHERE lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid())));
CREATE POLICY "Editors can delete step completions" ON public.step_completions FOR DELETE USING (can_edit_leads(auth.uid()));

-- RLS Policies for discovery_answers
CREATE POLICY "Admins can view all discovery answers" ON public.discovery_answers FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Developers can view assigned discovery answers" ON public.discovery_answers FOR SELECT USING (is_developer(auth.uid()) AND build_flow_id IN (SELECT id FROM public.build_flows WHERE lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid())));
CREATE POLICY "Editors can insert discovery answers" ON public.discovery_answers FOR INSERT WITH CHECK (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can update discovery answers" ON public.discovery_answers FOR UPDATE USING (can_edit_leads(auth.uid()));

-- RLS Policies for client_assets
CREATE POLICY "Admins can view all client assets" ON public.client_assets FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Developers can view assigned client assets" ON public.client_assets FOR SELECT USING (is_developer(auth.uid()) AND lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()));
CREATE POLICY "Editors can insert client assets" ON public.client_assets FOR INSERT WITH CHECK (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can update client assets" ON public.client_assets FOR UPDATE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Developers can update assigned client assets" ON public.client_assets FOR UPDATE USING (is_developer(auth.uid()) AND lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()));

-- RLS Policies for brand_colours
CREATE POLICY "Admins can view all brand colours" ON public.brand_colours FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Developers can view assigned brand colours" ON public.brand_colours FOR SELECT USING (is_developer(auth.uid()) AND lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()));
CREATE POLICY "Editors can insert brand colours" ON public.brand_colours FOR INSERT WITH CHECK (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can update brand colours" ON public.brand_colours FOR UPDATE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can delete brand colours" ON public.brand_colours FOR DELETE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Developers can manage assigned brand colours" ON public.brand_colours FOR ALL USING (is_developer(auth.uid()) AND lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()));

-- RLS Policies for brand_fonts
CREATE POLICY "Admins can view all brand fonts" ON public.brand_fonts FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Developers can view assigned brand fonts" ON public.brand_fonts FOR SELECT USING (is_developer(auth.uid()) AND lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()));
CREATE POLICY "Editors can insert brand fonts" ON public.brand_fonts FOR INSERT WITH CHECK (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can update brand fonts" ON public.brand_fonts FOR UPDATE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can delete brand fonts" ON public.brand_fonts FOR DELETE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Developers can manage assigned brand fonts" ON public.brand_fonts FOR ALL USING (is_developer(auth.uid()) AND lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()));

-- RLS Policies for credential_vault (NO client access - admin/developer only)
CREATE POLICY "Admins can view all credentials" ON public.credential_vault FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Developers can view assigned credentials" ON public.credential_vault FOR SELECT USING (is_developer(auth.uid()) AND lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()));
CREATE POLICY "Editors can insert credentials" ON public.credential_vault FOR INSERT WITH CHECK (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can update credentials" ON public.credential_vault FOR UPDATE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can delete credentials" ON public.credential_vault FOR DELETE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Developers can manage assigned credentials" ON public.credential_vault FOR ALL USING (is_developer(auth.uid()) AND lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()));

-- Storage policies for build-assets bucket
CREATE POLICY "Admins can upload build assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'build-assets' AND is_admin(auth.uid()));
CREATE POLICY "Developers can upload build assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'build-assets' AND is_developer(auth.uid()));
CREATE POLICY "Authenticated can view build assets" ON storage.objects FOR SELECT USING (bucket_id = 'build-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can delete build assets" ON storage.objects FOR DELETE USING (bucket_id = 'build-assets' AND is_admin(auth.uid()));
