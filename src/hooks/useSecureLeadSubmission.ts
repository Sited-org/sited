import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LeadSubmissionData {
  name: string;
  email: string;
  phone?: string | null;
  business_name?: string | null;
  project_type: string;
  form_data: Record<string, unknown>;
}

interface PartialLeadData {
  name: string;
  email: string;
  phone?: string | null;
  project_type: string;
}

interface PartialLeadUpdateData {
  name?: string;
  email?: string;
  phone?: string | null;
  business_name?: string | null;
  form_data: Record<string, unknown>;
}

export function useSecureLeadSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const partialLeadIdRef = useRef<string | null>(null);

  // Save partial lead after contact info step via edge function
  const savePartialLead = useCallback(async (data: PartialLeadData): Promise<boolean> => {
    // Don't create duplicate partial leads in this session
    if (partialLeadIdRef.current) {
      return true;
    }

    try {
      const { data: response, error } = await supabase.functions.invoke('save-partial-lead', {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          project_type: data.project_type,
          form_data: { contactInfoOnly: true },
        },
      });

      if (error) {
        console.error('Error saving partial lead:', error);
        return false;
      }

      if (response?.error) {
        console.error('Edge function error:', response.error);
        return false;
      }

      if (response?.lead_id) {
        partialLeadIdRef.current = response.lead_id;
        console.log('Partial lead saved:', response.lead_id, response.existing ? '(existing)' : '(new)');
      }

      return true;
    } catch (err) {
      console.error('Unexpected error saving partial lead:', err);
      return false;
    }
  }, []);

  // Update partial lead with new form data at each step via edge function
  const updatePartialLead = useCallback(async (data: PartialLeadUpdateData): Promise<boolean> => {
    // Only update if we have a partial lead
    if (!partialLeadIdRef.current) {
      return false;
    }

    try {
      const { data: response, error } = await supabase.functions.invoke('save-partial-lead', {
        body: {
          lead_id: partialLeadIdRef.current,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          business_name: data.business_name || null,
          project_type: 'website', // Default, will be overwritten if needed
          form_data: data.form_data,
        },
      });

      if (error) {
        console.error('Error updating partial lead:', error);
        return false;
      }

      if (response?.error) {
        console.error('Edge function error:', response.error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error updating partial lead:', err);
      return false;
    }
  }, []);

  const submitLead = useCallback(async (data: LeadSubmissionData): Promise<boolean> => {
    setIsSubmitting(true);
    
    try {
      // If we have a partial lead, finalize it via edge function
      if (partialLeadIdRef.current) {
        const { data: response, error } = await supabase.functions.invoke('save-partial-lead', {
          body: {
            lead_id: partialLeadIdRef.current,
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            business_name: data.business_name || null,
            project_type: data.project_type,
            form_data: { ...data.form_data, partial: false }, // Mark as complete
          },
        });

        if (error) {
          console.error('Error finalizing lead:', error);
          toast.error('Failed to submit form. Please try again.');
          return false;
        }

        if (response?.error) {
          toast.error(response.error);
          return false;
        }
        
        console.log('Finalized existing partial lead:', partialLeadIdRef.current);
        
        // Send notification for the finalized lead
        try {
          await supabase.functions.invoke('send-lead-notification', {
            body: {
              name: data.name,
              email: data.email,
              phone: data.phone || null,
              business_name: data.business_name || null,
              project_type: data.project_type,
              form_data: data.form_data,
            },
          });
        } catch (notifyErr) {
          console.error('Error sending notification:', notifyErr);
          // Don't fail the submission if notification fails
        }

        partialLeadIdRef.current = null;
        return true;
      }

      // Only call submit-lead edge function if no partial lead exists (fallback path)
      const { data: response, error } = await supabase.functions.invoke('submit-lead', {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          business_name: data.business_name || null,
          project_type: data.project_type,
          form_data: data.form_data,
        },
      });

      if (error) {
        console.error('Submission error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('429')) {
          toast.error('Too many submissions. Please try again later.');
        } else {
          toast.error('Failed to submit form. Please try again.');
        }
        return false;
      }

      // Check for error in response body
      if (response?.error) {
        toast.error(response.error);
        return false;
      }

      console.log('Created new lead via edge function');
      partialLeadIdRef.current = null;
      return true;
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    savePartialLead,
    updatePartialLead,
    submitLead,
    getLeadId: () => partialLeadIdRef.current,
  };
}
