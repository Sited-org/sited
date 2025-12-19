-- Create email_templates table for storing customizable email templates
CREATE TABLE public.email_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_type TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create email_automations table for automation settings
CREATE TABLE public.email_automations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_type TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    schedule_cron TEXT,
    last_run_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_logs table for tracking sent emails
CREATE TABLE public.email_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_templates
CREATE POLICY "Admins can view email templates" 
ON public.email_templates 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (can_edit_leads(auth.uid()))
WITH CHECK (can_edit_leads(auth.uid()));

-- RLS policies for email_automations
CREATE POLICY "Admins can view email automations" 
ON public.email_automations 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage email automations" 
ON public.email_automations 
FOR ALL 
USING (can_edit_leads(auth.uid()))
WITH CHECK (can_edit_leads(auth.uid()));

-- RLS policies for email_logs
CREATE POLICY "Admins can view email logs" 
ON public.email_logs 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert email logs" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_automations_updated_at
BEFORE UPDATE ON public.email_automations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.email_templates (template_type, subject, body_html) VALUES
('onboarding', 'Welcome to {{business_name}} - Let''s Get Started!', '<h1>Welcome, {{name}}!</h1><p>Thank you for reaching out to us. We''re excited to learn more about your project.</p><p>Our team will be in touch shortly to discuss your {{project_type}} needs.</p><p>In the meantime, feel free to reply to this email with any questions.</p><p>Best regards,<br>The Team</p>'),
('payment_receipt', 'Payment Received - Thank You!', '<h1>Payment Confirmation</h1><p>Hi {{name}},</p><p>We''ve received your payment of <strong>{{amount}}</strong>.</p><p><strong>Invoice Details:</strong></p><ul><li>Invoice ID: {{invoice_id}}</li><li>Date: {{date}}</li><li>Description: {{description}}</li></ul><p>Thank you for your business!</p><p>Best regards,<br>The Team</p>'),
('monthly_report', 'Your Monthly Business Report - {{month}}', '<h1>Monthly Business Report</h1><p>Hi {{name}},</p><p>Here''s your personalized monthly overview:</p><h2>Business Metrics</h2>{{metrics_summary}}<h2>AI Recommendations</h2>{{ai_recommendations}}<p>Let us know if you''d like to discuss any of these insights.</p><p>Best regards,<br>The Team</p>');

-- Insert default automations
INSERT INTO public.email_automations (automation_type, is_enabled, schedule_cron, settings) VALUES
('onboarding', true, NULL, '{"delay_minutes": 0}'::jsonb),
('payment_receipt', true, NULL, '{"include_invoice": true}'::jsonb),
('monthly_report', true, '0 9 1 * *', '{"include_ai_recommendations": true}'::jsonb);