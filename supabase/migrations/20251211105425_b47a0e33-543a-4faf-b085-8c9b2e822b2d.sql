-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_type TEXT NOT NULL,
  business_name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  metric_1_value TEXT,
  metric_1_label TEXT,
  metric_2_value TEXT,
  metric_2_label TEXT,
  delivery_time TEXT,
  testimonial_text TEXT NOT NULL,
  testimonial_author TEXT NOT NULL,
  testimonial_role TEXT NOT NULL,
  video_url TEXT,
  video_thumbnail TEXT,
  website_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Only owners and admins can view testimonials in admin
CREATE POLICY "Admins can view testimonials"
ON public.testimonials
FOR SELECT
USING (is_admin(auth.uid()));

-- Only owners and admins can insert testimonials
CREATE POLICY "Admins can insert testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Only owners and admins can update testimonials
CREATE POLICY "Admins can update testimonials"
ON public.testimonials
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Only owners and admins can delete testimonials
CREATE POLICY "Admins can delete testimonials"
ON public.testimonials
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Public can view active testimonials (for Work page)
CREATE POLICY "Public can view active testimonials"
ON public.testimonials
FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();