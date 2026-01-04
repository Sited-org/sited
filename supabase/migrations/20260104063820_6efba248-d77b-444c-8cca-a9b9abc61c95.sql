-- Create form_fields table for dynamic form configuration
CREATE TABLE public.form_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type TEXT NOT NULL CHECK (form_type IN ('website', 'ai', 'app')),
  step_number INTEGER NOT NULL,
  step_title TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'tel', 'textarea', 'select', 'radio', 'checkbox', 'checkbox_group')),
  placeholder TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  options JSONB DEFAULT '[]'::jsonb, -- For select, radio, checkbox_group: [{value: string, label: string}]
  grid_cols INTEGER DEFAULT 1, -- 1 or 2 for responsive grid
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  help_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(form_type, field_name)
);

-- Enable RLS
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;

-- Public can view active form fields (needed for forms to render)
CREATE POLICY "Public can view active form fields" 
ON public.form_fields 
FOR SELECT 
USING (is_active = true);

-- Admins can view all form fields
CREATE POLICY "Admins can view all form fields" 
ON public.form_fields 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Admins can insert form fields
CREATE POLICY "Admins can insert form fields" 
ON public.form_fields 
FOR INSERT 
WITH CHECK (can_edit_leads(auth.uid()));

-- Admins can update form fields
CREATE POLICY "Admins can update form fields" 
ON public.form_fields 
FOR UPDATE 
USING (can_edit_leads(auth.uid()));

-- Admins can delete form fields
CREATE POLICY "Admins can delete form fields" 
ON public.form_fields 
FOR DELETE 
USING (can_edit_leads(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_form_fields_updated_at
BEFORE UPDATE ON public.form_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();