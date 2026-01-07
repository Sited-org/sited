-- Add client access code column to leads table
ALTER TABLE public.leads
ADD COLUMN client_access_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_leads_client_access_code ON public.leads(client_access_code);

-- Create function to generate unique access code
CREATE OR REPLACE FUNCTION generate_client_access_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.leads WHERE client_access_code = code) INTO exists_check;
    
    -- Exit loop if unique
    IF NOT exists_check THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public;