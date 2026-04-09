
CREATE TABLE public.project_sitemaps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  build_flow_id uuid REFERENCES public.build_flows(id) ON DELETE SET NULL,
  name text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.project_sitemaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all sitemaps"
  ON public.project_sitemaps FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Editors can insert sitemaps"
  ON public.project_sitemaps FOR INSERT
  WITH CHECK (can_edit_leads(auth.uid()));

CREATE POLICY "Editors can update sitemaps"
  ON public.project_sitemaps FOR UPDATE
  USING (can_edit_leads(auth.uid()));

CREATE POLICY "Editors can delete sitemaps"
  ON public.project_sitemaps FOR DELETE
  USING (can_edit_leads(auth.uid()));

CREATE TRIGGER update_project_sitemaps_updated_at
  BEFORE UPDATE ON public.project_sitemaps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
