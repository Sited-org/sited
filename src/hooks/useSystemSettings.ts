import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface SecuritySettings {
  require_2fa_for_team: boolean;
}

const defaultSecuritySettings: SecuritySettings = {
  require_2fa_for_team: false,
};

export function useSystemSettings() {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSecuritySettings);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .eq('setting_key', 'security')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching settings:', error);
    } else if (data?.setting_value) {
      // Safely parse the JSON value
      const value = data.setting_value as unknown as SecuritySettings;
      setSecuritySettings({
        require_2fa_for_team: value.require_2fa_for_team ?? false,
      });
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSecuritySettings = async (settings: Partial<SecuritySettings>) => {
    const newSettings = { ...securitySettings, ...settings };
    
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('system_settings')
      .update({ 
        setting_value: newSettings as unknown as Json,
        updated_by: userData.user?.id
      })
      .eq('setting_key', 'security');
    
    if (error) {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    setSecuritySettings(newSettings);
    toast({ title: "Security settings updated" });
    return true;
  };

  return {
    securitySettings,
    loading,
    updateSecuritySettings,
    refreshSettings: fetchSettings,
  };
}
