-- Create memberships table for storing reusable membership templates
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  billing_interval text NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

-- Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Admins can view memberships
CREATE POLICY "Admins can view memberships"
ON public.memberships
FOR SELECT
USING (is_admin(auth.uid()));

-- Editors can insert memberships
CREATE POLICY "Editors can insert memberships"
ON public.memberships
FOR INSERT
WITH CHECK (can_edit_leads(auth.uid()));

-- Editors can update memberships
CREATE POLICY "Editors can update memberships"
ON public.memberships
FOR UPDATE
USING (can_edit_leads(auth.uid()));

-- Editors can delete memberships
CREATE POLICY "Editors can delete memberships"
ON public.memberships
FOR DELETE
USING (can_edit_leads(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_memberships_updated_at
BEFORE UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();