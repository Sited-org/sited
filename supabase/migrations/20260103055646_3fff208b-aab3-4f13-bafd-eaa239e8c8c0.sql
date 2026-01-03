-- Add Stripe product and price IDs to products table
ALTER TABLE public.products 
ADD COLUMN stripe_product_id text,
ADD COLUMN stripe_price_id text;