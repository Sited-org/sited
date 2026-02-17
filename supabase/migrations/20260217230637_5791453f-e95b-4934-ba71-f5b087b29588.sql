
-- Step 1: Create is_developer() helper function
CREATE OR REPLACE FUNCTION public.is_developer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'developer'
  )
$$;

-- Step 2: Scoped SELECT policy - developers only see assigned leads
CREATE POLICY "Developers can view assigned leads"
ON public.leads
FOR SELECT
USING (is_developer(auth.uid()) AND assigned_to = auth.uid());

-- Step 3: Scoped UPDATE policy - developers can update assigned leads (trigger restricts columns)
CREATE POLICY "Developers can update workflow on assigned leads"
ON public.leads
FOR UPDATE
USING (is_developer(auth.uid()) AND assigned_to = auth.uid());

-- Step 4: Trigger to restrict developer updates to workflow_data only
CREATE OR REPLACE FUNCTION public.restrict_developer_lead_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only restrict developers
  IF NOT is_developer(auth.uid()) THEN
    RETURN NEW;
  END IF;
  
  -- Allow only workflow_data changes - reject all other column modifications
  IF OLD.name IS DISTINCT FROM NEW.name
    OR OLD.email IS DISTINCT FROM NEW.email
    OR OLD.phone IS DISTINCT FROM NEW.phone
    OR OLD.business_name IS DISTINCT FROM NEW.business_name
    OR OLD.status IS DISTINCT FROM NEW.status
    OR OLD.notes IS DISTINCT FROM NEW.notes
    OR OLD.deal_amount IS DISTINCT FROM NEW.deal_amount
    OR OLD.billing_address IS DISTINCT FROM NEW.billing_address
    OR OLD.website_url IS DISTINCT FROM NEW.website_url
    OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to
    OR OLD.assigned_sales_rep IS DISTINCT FROM NEW.assigned_sales_rep
    OR OLD.form_data IS DISTINCT FROM NEW.form_data
    OR OLD.project_type IS DISTINCT FROM NEW.project_type
    OR OLD.lead_number IS DISTINCT FROM NEW.lead_number
    OR OLD.client_access_code IS DISTINCT FROM NEW.client_access_code
    OR OLD.stripe_customer_id IS DISTINCT FROM NEW.stripe_customer_id
    OR OLD.stripe_payment_method_id IS DISTINCT FROM NEW.stripe_payment_method_id
    OR OLD.generated_prompt IS DISTINCT FROM NEW.generated_prompt
    OR OLD.generated_prompt_research IS DISTINCT FROM NEW.generated_prompt_research
    OR OLD.tracking_id IS DISTINCT FROM NEW.tracking_id
    OR OLD.ga_property_id IS DISTINCT FROM NEW.ga_property_id
    OR OLD.ga_access_token IS DISTINCT FROM NEW.ga_access_token
    OR OLD.ga_refresh_token IS DISTINCT FROM NEW.ga_refresh_token
    OR OLD.ga_status IS DISTINCT FROM NEW.ga_status
    OR OLD.membership_tier IS DISTINCT FROM NEW.membership_tier
    OR OLD.industry IS DISTINCT FROM NEW.industry
    OR OLD.location IS DISTINCT FROM NEW.location
    OR OLD.deal_closed_at IS DISTINCT FROM NEW.deal_closed_at
    OR OLD.last_contacted_at IS DISTINCT FROM NEW.last_contacted_at
    OR OLD.client_password_hash IS DISTINCT FROM NEW.client_password_hash
    OR OLD.client_first_login_at IS DISTINCT FROM NEW.client_first_login_at
    OR OLD.analytics_status IS DISTINCT FROM NEW.analytics_status
  THEN
    RAISE EXCEPTION 'Permission denied: Developers can only update workflow data';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_developer_lead_updates
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_developer_lead_updates();

-- Step 5: Scoped SELECT policies for related tables
CREATE POLICY "Developers can view assigned lead notes"
ON public.customer_notes
FOR SELECT
USING (
  is_developer(auth.uid()) AND
  lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid())
);

CREATE POLICY "Developers can view assigned milestones"
ON public.project_milestones
FOR SELECT
USING (
  is_developer(auth.uid()) AND
  lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid())
);

CREATE POLICY "Developers can view assigned requests"
ON public.client_requests
FOR SELECT
USING (
  is_developer(auth.uid()) AND
  lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid())
);

CREATE POLICY "Developers can view assigned updates"
ON public.project_updates
FOR SELECT
USING (
  is_developer(auth.uid()) AND
  lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid())
);

-- Step 6: Allow developers to read their own profile and role
CREATE POLICY "Developers can view own profile"
ON public.admin_profiles
FOR SELECT
USING (is_developer(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Developers can view own role"
ON public.user_roles
FOR SELECT
USING (is_developer(auth.uid()) AND user_id = auth.uid());
