-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- Create enum for lead statuses
CREATE TYPE public.lead_status AS ENUM ('new', 'cold', 'warm', 'hot', 'contacted', 'proposal_sent', 'paid', 'lost');

-- Create user_roles table for admin permissions
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'viewer',
    can_view BOOLEAN NOT NULL DEFAULT true,
    can_edit_leads BOOLEAN NOT NULL DEFAULT false,
    can_manage_users BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add status column to leads table
ALTER TABLE public.leads ADD COLUMN status lead_status NOT NULL DEFAULT 'new';
ALTER TABLE public.leads ADD COLUMN notes TEXT;
ALTER TABLE public.leads ADD COLUMN last_contacted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.leads ADD COLUMN assigned_to UUID REFERENCES auth.users(id);

-- Create admin_profiles table for admin user info
CREATE TABLE public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_profiles
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create lead_activities table for tracking interactions
CREATE TABLE public.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on lead_activities
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Create form_sessions table for real-time tracking
CREATE TABLE public.form_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    form_type TEXT NOT NULL,
    current_step INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL,
    partial_data JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed BOOLEAN NOT NULL DEFAULT false,
    ip_address TEXT,
    user_agent TEXT
);

-- Enable RLS on form_sessions
ALTER TABLE public.form_sessions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Security definer function to check if user is any admin type
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
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

-- Security definer function to check if user can edit leads
CREATE OR REPLACE FUNCTION public.can_edit_leads(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND can_edit_leads = true
    )
$$;

-- Security definer function to check if user can manage users
CREATE OR REPLACE FUNCTION public.can_manage_users(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND can_manage_users = true
    )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can view user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Owners can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.can_manage_users(auth.uid()))
WITH CHECK (public.can_manage_users(auth.uid()));

-- RLS Policies for admin_profiles
CREATE POLICY "Admins can view admin profiles"
ON public.admin_profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.admin_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners can manage admin profiles"
ON public.admin_profiles
FOR ALL
TO authenticated
USING (public.can_manage_users(auth.uid()))
WITH CHECK (public.can_manage_users(auth.uid()));

-- RLS Policies for leads (admin access)
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Editors can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.can_edit_leads(auth.uid()));

CREATE POLICY "Editors can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (public.can_edit_leads(auth.uid()));

-- RLS Policies for lead_activities
CREATE POLICY "Admins can view lead activities"
ON public.lead_activities
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Editors can insert lead activities"
ON public.lead_activities
FOR INSERT
TO authenticated
WITH CHECK (public.can_edit_leads(auth.uid()));

-- RLS Policies for form_sessions
CREATE POLICY "Admins can view form sessions"
ON public.form_sessions
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can insert form sessions"
ON public.form_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update form sessions"
ON public.form_sessions
FOR UPDATE
USING (true);

-- Enable realtime for form_sessions and leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.form_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_profiles_updated_at
BEFORE UPDATE ON public.admin_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();