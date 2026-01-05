import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

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

interface CaptchaData {
  token: string;
  answer: number;
}

export function useSecureLeadSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const partialLeadIdRef = useRef<string | null>(null);

  const handleCaptchaVerify = useCallback((verified: boolean, token?: string, answer?: number) => {
    if (verified && token && answer !== undefined) {
      setCaptchaData({ token, answer });
    } else {
      setCaptchaData(null);
    }
  }, []);

  // Save partial lead after contact info step
  const savePartialLead = useCallback(async (data: PartialLeadData): Promise<boolean> => {
    // Don't create duplicate partial leads
    if (partialLeadIdRef.current) {
      return true;
    }

    try {
      const { data: result, error } = await supabase
        .from('leads')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          project_type: data.project_type,
          form_data: { partial: true, contactInfoOnly: true },
          status: 'new',
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving partial lead:', error);
        return false;
      }

      partialLeadIdRef.current = result.id;
      return true;
    } catch (err) {
      console.error('Unexpected error saving partial lead:', err);
      return false;
    }
  }, []);

  // Update partial lead with new form data at each step
  const updatePartialLead = useCallback(async (data: PartialLeadUpdateData): Promise<boolean> => {
    // Only update if we have a partial lead
    if (!partialLeadIdRef.current) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          business_name: data.business_name || null,
          form_data: { ...data.form_data, partial: true } as Json,
        })
        .eq('id', partialLeadIdRef.current);

      if (error) {
        console.error('Error updating partial lead:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error updating partial lead:', err);
      return false;
    }
  }, []);

  const submitLead = useCallback(async (data: LeadSubmissionData): Promise<boolean> => {
    if (!captchaData) {
      toast.error('Please complete the security verification');
      return false;
    }

    setIsSubmitting(true);
    
    try {
      // If we have a partial lead, update it instead of creating new
      if (partialLeadIdRef.current) {
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            business_name: data.business_name || null,
            form_data: data.form_data as Json,
          })
          .eq('id', partialLeadIdRef.current);

        if (updateError) {
          console.error('Error updating partial lead:', updateError);
          // Fall through to regular submission
        } else {
          partialLeadIdRef.current = null;
          return true;
        }
      }

      const { data: response, error } = await supabase.functions.invoke('submit-lead', {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          business_name: data.business_name || null,
          project_type: data.project_type,
          form_data: data.form_data,
          captcha_token: captchaData.token,
          captcha_answer: captchaData.answer,
        },
      });

      if (error) {
        console.error('Submission error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('429')) {
          toast.error('Too many submissions. Please try again later.');
        } else if (error.message?.includes('CAPTCHA')) {
          toast.error('Security verification failed. Please try again.');
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

      partialLeadIdRef.current = null;
      return true;
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [captchaData]);

  return {
    isSubmitting,
    captchaVerified: !!captchaData,
    handleCaptchaVerify,
    savePartialLead,
    updatePartialLead,
    submitLead,
  };
}
