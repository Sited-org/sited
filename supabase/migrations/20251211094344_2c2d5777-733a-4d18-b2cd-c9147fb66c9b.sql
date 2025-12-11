-- Add lead_number column with auto-incrementing sequence
CREATE SEQUENCE IF NOT EXISTS lead_number_seq START 1;

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_number INTEGER DEFAULT nextval('lead_number_seq');

-- Set lead_number for existing leads based on created_at order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.leads
  WHERE lead_number IS NULL
)
UPDATE public.leads
SET lead_number = numbered.rn
FROM numbered
WHERE leads.id = numbered.id;

-- Add sales/deal amount to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deal_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deal_closed_at TIMESTAMP WITH TIME ZONE;

-- Create payments table for payment history
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments RLS policies
CREATE POLICY "Admins can view payments" ON public.payments FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Editors can insert payments" ON public.payments FOR INSERT WITH CHECK (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can update payments" ON public.payments FOR UPDATE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can delete payments" ON public.payments FOR DELETE USING (can_edit_leads(auth.uid()));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_lead_id ON public.payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_lead_number ON public.leads(lead_number);