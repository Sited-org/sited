import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FormSession {
  id: string;
  session_id: string;
  form_type: string;
  current_step: number;
  total_steps: number;
  partial_data: Record<string, unknown>;
  started_at: string;
  last_activity_at: string;
  completed: boolean;
  ip_address: string | null;
  user_agent: string | null;
}

export function useFormSessions() {
  const [sessions, setSessions] = useState<FormSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('form_sessions')
      .select('*')
      .eq('completed', false)
      .order('last_activity_at', { ascending: false });
    
    if (!error && data) {
      setSessions(data as FormSession[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();

    // Set up realtime subscription
    const channel = supabase
      .channel('form-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'form_sessions'
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSessions]);

  // Filter to only show sessions active in the last 30 minutes
  const activeSessions = sessions.filter(session => {
    const lastActivity = new Date(session.last_activity_at);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return lastActivity > thirtyMinutesAgo;
  });

  return {
    sessions,
    activeSessions,
    loading,
    fetchSessions
  };
}
