-- Add website_url and billing_address fields to leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- Create client_requests table for client task requests
CREATE TABLE public.client_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID
);

-- Enable RLS on client_requests
ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;

-- Admins can view all requests
CREATE POLICY "Admins can view client requests" 
ON public.client_requests 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Editors can manage requests
CREATE POLICY "Editors can insert client requests" 
ON public.client_requests 
FOR INSERT 
WITH CHECK (can_edit_leads(auth.uid()));

CREATE POLICY "Editors can update client requests" 
ON public.client_requests 
FOR UPDATE 
USING (can_edit_leads(auth.uid()));

CREATE POLICY "Editors can delete client requests" 
ON public.client_requests 
FOR DELETE 
USING (can_edit_leads(auth.uid()));

-- Create project_milestones table for tracking design & metrics progress
CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('design', 'metrics')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  display_order INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS on project_milestones
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- Admins can view all milestones
CREATE POLICY "Admins can view project milestones" 
ON public.project_milestones 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Editors can manage milestones
CREATE POLICY "Editors can insert project milestones" 
ON public.project_milestones 
FOR INSERT 
WITH CHECK (can_edit_leads(auth.uid()));

CREATE POLICY "Editors can update project milestones" 
ON public.project_milestones 
FOR UPDATE 
USING (can_edit_leads(auth.uid()));

CREATE POLICY "Editors can delete project milestones" 
ON public.project_milestones 
FOR DELETE 
USING (can_edit_leads(auth.uid()));

-- Add trigger for updated_at on client_requests
CREATE TRIGGER update_client_requests_updated_at
BEFORE UPDATE ON public.client_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for client_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_milestones;