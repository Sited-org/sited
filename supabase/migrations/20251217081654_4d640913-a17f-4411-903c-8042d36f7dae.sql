-- Add recurring payment columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN is_recurring boolean NOT NULL DEFAULT false,
ADD COLUMN recurring_interval text CHECK (recurring_interval IN ('weekly', 'monthly', 'quarterly', 'yearly')),
ADD COLUMN recurring_end_date timestamp with time zone,
ADD COLUMN parent_transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE,
ADD COLUMN status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'scheduled'));