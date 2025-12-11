import { useState, useCallback } from 'react';
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

interface CaptchaData {
  token: string;
  answer: number;
}

export function useSecureLeadSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);

  const handleCaptchaVerify = useCallback((verified: boolean, token?: string, answer?: number) => {
    if (verified && token && answer !== undefined) {
      setCaptchaData({ token, answer });
    } else {
      setCaptchaData(null);
    }
  }, []);

  const submitLead = useCallback(async (data: LeadSubmissionData): Promise<boolean> => {
    if (!captchaData) {
      toast.error('Please complete the security verification');
      return false;
    }

    setIsSubmitting(true);
    
    try {
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
    submitLead,
  };
}
