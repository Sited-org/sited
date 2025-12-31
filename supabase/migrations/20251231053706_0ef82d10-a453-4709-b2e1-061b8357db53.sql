-- Create products table for one-time charges
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view products" ON public.products
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Editors can insert products" ON public.products
  FOR INSERT WITH CHECK (public.can_edit_leads(auth.uid()));

CREATE POLICY "Editors can update products" ON public.products
  FOR UPDATE USING (public.can_edit_leads(auth.uid()));

CREATE POLICY "Editors can delete products" ON public.products
  FOR DELETE USING (public.can_edit_leads(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample products
INSERT INTO public.products (name, description, price, is_active) VALUES
  ('Website Design', 'Custom website design and development', 2500, true),
  ('Logo Design', 'Professional logo design package', 500, true),
  ('SEO Optimization', 'Search engine optimization service', 750, true),
  ('Hosting Setup', 'Domain and hosting configuration', 150, true),
  ('Content Writing', 'Professional copywriting services', 300, true);