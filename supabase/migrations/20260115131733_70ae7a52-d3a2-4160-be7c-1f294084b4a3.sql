-- Add payment_method column to track how payment was received
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'stripe';

-- Add comment for clarity
COMMENT ON COLUMN public.transactions.payment_method IS 'Method of payment: stripe, cash, bank_transfer, other';