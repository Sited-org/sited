-- Drop the old payments table and create a new transactions table for comprehensive ledger
DROP TABLE IF EXISTS public.payments;

-- Create transactions table for comprehensive debit/credit tracking
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  credit NUMERIC DEFAULT 0,
  debit NUMERIC DEFAULT 0,
  notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create project_updates table for timestamped project progress
CREATE TABLE public.project_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

-- Transactions RLS policies
CREATE POLICY "Admins can view transactions" ON public.transactions FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Editors can insert transactions" ON public.transactions FOR INSERT WITH CHECK (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can update transactions" ON public.transactions FOR UPDATE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can delete transactions" ON public.transactions FOR DELETE USING (can_edit_leads(auth.uid()));

-- Project updates RLS policies
CREATE POLICY "Admins can view project updates" ON public.project_updates FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Editors can insert project updates" ON public.project_updates FOR INSERT WITH CHECK (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can update project updates" ON public.project_updates FOR UPDATE USING (can_edit_leads(auth.uid()));
CREATE POLICY "Editors can delete project updates" ON public.project_updates FOR DELETE USING (can_edit_leads(auth.uid()));

-- Indexes
CREATE INDEX idx_transactions_lead_id ON public.transactions(lead_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX idx_project_updates_lead_id ON public.project_updates(lead_id);
CREATE INDEX idx_project_updates_date ON public.project_updates(created_at DESC);