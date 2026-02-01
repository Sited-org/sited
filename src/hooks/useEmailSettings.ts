import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailTemplate {
  id: string;
  template_type: string;
  subject: string;
  body_html: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface EmailAutomation {
  id: string;
  automation_type: string;
  is_enabled: boolean;
  schedule_cron: string | null;
  last_run_at: string | null;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  template_type: string;
  recipient_email: string;
  recipient_name: string | null;
  lead_id: string | null;
  subject: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('template_type');

    if (error) {
      toast({ title: 'Error loading templates', description: error.message, variant: 'destructive' });
    } else {
      setTemplates((data as EmailTemplate[]) || []);
    }
    setLoading(false);
  };

  const updateTemplate = async (id: string, updates: Partial<EmailTemplate>) => {
    const { error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating template', description: error.message, variant: 'destructive' });
      return false;
    }
    
    toast({ title: 'Template updated' });
    await fetchTemplates();
    return true;
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return { templates, loading, fetchTemplates, updateTemplate };
}

export function useEmailAutomations() {
  const [automations, setAutomations] = useState<EmailAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAutomations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_automations')
      .select('*')
      .order('automation_type');

    if (error) {
      toast({ title: 'Error loading automations', description: error.message, variant: 'destructive' });
    } else {
      setAutomations((data as EmailAutomation[]) || []);
    }
    setLoading(false);
  };

  const updateAutomation = async (id: string, updates: Partial<EmailAutomation>) => {
    const { error } = await supabase
      .from('email_automations')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating automation', description: error.message, variant: 'destructive' });
      return false;
    }
    
    toast({ title: 'Automation updated' });
    await fetchAutomations();
    return true;
  };

  const triggerAutomation = async (automationType: string, payload?: Record<string, any>) => {
    try {
      let functionName: string;
      let successMessage = 'Email(s) will be sent shortly.';
      
      switch (automationType) {
        case 'onboarding':
          functionName = 'send-onboarding-email';
          break;
        case 'payment_receipt':
          functionName = 'send-payment-email';
          break;
        case 'recurring_invoices':
          functionName = 'process-recurring-invoices';
          successMessage = 'Recurring invoices are being processed and sent.';
          break;
        default:
          functionName = 'send-monthly-report';
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload || {},
      });

      if (error) {
        toast({ title: 'Error triggering automation', description: error.message, variant: 'destructive' });
        return false;
      }

      // For recurring invoices, show detailed results
      if (automationType === 'recurring_invoices' && data) {
        const resultData = data as { successful?: number; failed?: number; processed?: number };
        if (resultData.processed === 0) {
          toast({ title: 'No invoices to send', description: 'All memberships are up to date.' });
        } else {
          toast({ 
            title: 'Recurring invoices processed', 
            description: `${resultData.successful || 0} invoice(s) sent${resultData.failed ? `, ${resultData.failed} failed` : ''}.` 
          });
        }
      } else {
        toast({ title: 'Automation triggered', description: successMessage });
      }
      
      return true;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  return { automations, loading, fetchAutomations, updateAutomation, triggerAutomation };
}

export function useEmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = async (limit = 50) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      toast({ title: 'Error loading logs', description: error.message, variant: 'destructive' });
    } else {
      setLogs((data as EmailLog[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return { logs, loading, fetchLogs };
}
