import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  can_view: boolean;
  can_edit_leads: boolean;
  can_manage_users: boolean;
}

export interface AdminProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!error && data) {
      setUserRole(data as UserRole);
    } else {
      setUserRole(null);
    }
  }, []);

  const fetchAdminProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!error && data) {
      setAdminProfile(data as AdminProfile);
    } else {
      setAdminProfile(null);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer Supabase calls with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
            fetchAdminProfile(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setAdminProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
        fetchAdminProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRole, fetchAdminProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/admin`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setUserRole(null);
      setAdminProfile(null);
    }
    return { error };
  };

  return {
    user,
    session,
    userRole,
    adminProfile,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!session,
    isAdmin: !!userRole,
    canEditLeads: userRole?.can_edit_leads ?? false,
    canManageUsers: userRole?.can_manage_users ?? false,
    refreshUserRole: () => user && fetchUserRole(user.id),
    refreshAdminProfile: () => user && fetchAdminProfile(user.id),
  };
}
