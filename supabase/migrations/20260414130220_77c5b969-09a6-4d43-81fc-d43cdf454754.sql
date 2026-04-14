
CREATE TABLE public.sitemap_webs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_preset boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.sitemap_webs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all webs"
  ON public.sitemap_webs FOR SELECT TO authenticated
  USING (is_staff(auth.uid()));

CREATE POLICY "Editors can manage webs"
  ON public.sitemap_webs FOR ALL TO authenticated
  USING (can_edit_leads(auth.uid()))
  WITH CHECK (can_edit_leads(auth.uid()));
