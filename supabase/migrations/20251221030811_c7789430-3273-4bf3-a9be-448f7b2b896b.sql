-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  stat_value TEXT NOT NULL,
  stat_label TEXT NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  cta_text TEXT NOT NULL,
  cta_link TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Globe',
  gradient_from TEXT NOT NULL DEFAULT 'blue-500/20',
  gradient_to TEXT NOT NULL DEFAULT 'cyan-500/20',
  accent_color TEXT NOT NULL DEFAULT 'text-blue-400',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Public can view active services
CREATE POLICY "Public can view active services"
ON public.services
FOR SELECT
USING (is_active = true);

-- Admins can view all services
CREATE POLICY "Admins can view all services"
ON public.services
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert services
CREATE POLICY "Admins can insert services"
ON public.services
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role IN ('owner', 'admin')
));

-- Admins can update services
CREATE POLICY "Admins can update services"
ON public.services
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role IN ('owner', 'admin')
));

-- Admins can delete services
CREATE POLICY "Admins can delete services"
ON public.services
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role IN ('owner', 'admin')
));

-- Create trigger for updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert mock services based on existing customer-facing page
INSERT INTO public.services (title, tagline, stat_value, stat_label, features, cta_text, cta_link, icon_name, gradient_from, gradient_to, accent_color, display_order) VALUES
('Websites', 'Built to convert.', '3x', 'More Conversions', ARRAY['Custom Design', 'Lightning Fast', 'SEO Ready', 'Monthly Updates'], 'Build My Website', '/onboarding/website', 'Globe', 'blue-500/20', 'cyan-500/20', 'text-blue-400', 1),
('Apps', 'People actually use.', '4.8★', 'Avg. Rating', ARRAY['iOS & Android', 'Your Idea', 'Make Money', 'User Friendly'], 'Build My App', '/onboarding/app', 'Smartphone', 'purple-500/20', 'pink-500/20', 'text-purple-400', 2),
('AI Automation', 'That works for you.', '60%', 'Time Saved', ARRAY['Smart Automation', 'Remove Human Error', '24/7 Active', 'Custom to Your Business'], 'Add AI Power', '/onboarding/ai', 'Zap', 'amber-500/20', 'orange-500/20', 'text-amber-400', 3);