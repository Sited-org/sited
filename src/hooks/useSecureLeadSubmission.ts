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
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const partialLeadIdRef = useRef<string | null>(null);

  // Legacy math captcha handler
  const handleCaptchaVerify = useCallback((verified: boolean, token?: string, answer?: number) => {
    if (verified && token && answer !== undefined) {
      setCaptchaData({ token, answer });
    } else {
      setCaptchaData(null);
    }
  }, []);

  // Google reCAPTCHA handler
  const handleRecaptchaVerify = useCallback((token: string | null) => {
    setRecaptchaToken(token);
  }, []);

  // Save partial lead after contact info step
  const savePartialLead = useCallback(async (data: PartialLeadData): Promise<boolean> => {
    // Don't create duplicate partial leads in this session
    if (partialLeadIdRef.current) {
      return true;
    }

    try {
      // First, check if a recent partial lead exists for this email/project_type
      // to prevent duplicates from page refreshes or re-submissions
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', data.email)
        .eq('project_type', data.project_type)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Within last 24 hours
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingLead) {
        // Use existing lead instead of creating a new one
        partialLeadIdRef.current = existingLead.id;
        console.log('Found existing partial lead:', existingLead.id);
        return true;
      }

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
      console.log('Created new partial lead:', result.id);
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
    // Check for either captcha type
    if (!captchaData && !recaptchaToken) {
      toast.error('Please complete the security verification');
      return false;
    }

    setIsSubmitting(true);
    
    try {
      // If we have a partial lead, update it instead of creating new - DO NOT call edge function
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
          toast.error('Failed to submit form. Please try again.');
          return false;
        }
        
        console.log('Updated existing partial lead:', partialLeadIdRef.current);
        partialLeadIdRef.current = null;
        return true;
      }

      // Only call edge function if no partial lead exists (fallback path)
      const { data: response, error } = await supabase.functions.invoke('submit-lead', {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          business_name: data.business_name || null,
          project_type: data.project_type,
          form_data: data.form_data,
          // Include either reCAPTCHA or legacy captcha
          recaptcha_token: recaptchaToken || null,
          captcha_token: captchaData?.token || null,
          captcha_answer: captchaData?.answer ?? null,
        },
      });

      if (error) {
        console.error('Submission error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('429')) {
          toast.error('Too many submissions. Please try again later.');
        } else if (error.message?.includes('CAPTCHA') || error.message?.includes('verification')) {
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
  }, [captchaData, recaptchaToken]);

  return {
    isSubmitting,
    captchaVerified: !!captchaData || !!recaptchaToken,
    handleCaptchaVerify,
    handleRecaptchaVerify,
    savePartialLead,
    updatePartialLead,
    submitLead,
  };
}
