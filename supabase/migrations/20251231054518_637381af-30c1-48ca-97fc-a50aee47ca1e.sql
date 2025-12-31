-- Add invoice_status column to transactions for tracking invoice/payment status
-- Values: 'not_sent' (default for debits), 'sent' (invoice sent), 'processing' (payment in progress), 'paid' (payment completed)
ALTER TABLE public.transactions 
ADD COLUMN invoice_status TEXT DEFAULT 'not_sent';

-- Add stripe_invoice_id to track the Stripe invoice
ALTER TABLE public.transactions 
ADD COLUMN stripe_invoice_id TEXT;

-- Update existing credit transactions to 'paid' status (they are payments)
UPDATE public.transactions 
SET invoice_status = 'paid' 
WHERE credit > 0;

-- Update existing debit transactions to 'not_sent'
UPDATE public.transactions 
SET invoice_status = 'not_sent' 
WHERE debit > 0 AND invoice_status IS NULL;