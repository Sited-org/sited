-- Add new role types to the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales';

-- Add new permission columns to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS can_view_payments boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS can_edit_project boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS can_delete_leads boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_charge_cards boolean NOT NULL DEFAULT false;

-- Update existing roles with appropriate defaults based on role
UPDATE public.user_roles SET 
  can_view_payments = true,
  can_edit_project = true,
  can_delete_leads = true,
  can_charge_cards = true
WHERE role IN ('owner', 'admin');

-- Create a function to check if user can view payment details
CREATE OR REPLACE FUNCTION public.can_view_payments(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND can_view_payments = true
    )
$$;

-- Create a function to check if user can delete leads
CREATE OR REPLACE FUNCTION public.can_delete_leads(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND can_delete_leads = true
    )
$$;

-- Create a function to check if user can charge cards
CREATE OR REPLACE FUNCTION public.can_charge_cards(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND can_charge_cards = true
    )
$$;

-- Create a sales_metrics table to track sales team performance
CREATE TABLE IF NOT EXISTS public.sales_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  metric_type text NOT NULL, -- 'meeting_booked', 'deal_closed', 'call_made', etc.
  amount numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.sales_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_metrics
CREATE POLICY "Admins can view all sales metrics"
ON public.sales_metrics
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Users can insert their own metrics"
ON public.sales_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own metrics"
ON public.sales_metrics
FOR SELECT
USING (auth.uid() = user_id);

-- Create customer_notes table for notes from customers
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false
);

ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view customer notes"
ON public.customer_notes
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update customer notes"
ON public.customer_notes
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can insert customer notes"
ON public.customer_notes
FOR INSERT
WITH CHECK (true);

-- Add assigned_sales_rep column to leads if not exists
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS assigned_sales_rep uuid;