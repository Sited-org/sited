-- Add Stripe-related columns to leads table for payment processing
ALTER TABLE public.leads 
ADD COLUMN stripe_customer_id text,
ADD COLUMN stripe_payment_method_id text;

-- Add index for faster lookups
CREATE INDEX idx_leads_stripe_customer_id ON public.leads(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;