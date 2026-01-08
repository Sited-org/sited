import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type StaffRole = 'owner' | 'admin' | 'developer' | 'sales' | 'editor' | 'viewer';

export interface UserRole {
  id: string;
  user_id: string;
  role: StaffRole;
  can_view: boolean;
  can_edit_leads: boolean;
  can_manage_users: boolean;
  can_view_payments: boolean;
  can_edit_project: boolean;
  can_delete_leads: boolean;
  can_charge_cards: boolean;
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
  const [roleLoading, setRoleLoading] = useState(true);
  const initialized = useRef(false);

  const fetchUserRole = useCallback(async (userId: string) => {
    setRoleLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('id, user_id, role, can_view, can_edit_leads, can_manage_users, can_view_payments, can_edit_project, can_delete_leads, can_charge_cards')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!error && data) {
      setUserRole(data as UserRole);
    } else {
      setUserRole(null);
    }
    setRoleLoading(false);
  }, []);

  const fetchAdminProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('id, user_id, display_name, email, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!error && data) {
      setAdminProfile(data as AdminProfile);
    } else {
      setAdminProfile(null);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          setTimeout(() => {
            fetchUserRole(newSession.user.id);
            fetchAdminProfile(newSession.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setAdminProfile(null);
          setRoleLoading(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchUserRole(existingSession.user.id);
        fetchAdminProfile(existingSession.user.id);
      } else {
        setRoleLoading(false);
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

  const isFullyLoaded = !loading && !roleLoading;
  const role = userRole?.role;

  return {
    user,
    session,
    userRole,
    adminProfile,
    loading: !isFullyLoaded,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!session,
    isAdmin: !!userRole,
    // Role checks
    isOwner: role === 'owner',
    isAdminRole: role === 'admin',
    isDeveloper: role === 'developer',
    isSales: role === 'sales',
    // Permission checks
    canEditLeads: userRole?.can_edit_leads ?? false,
    canManageUsers: userRole?.can_manage_users ?? false,
    canViewPayments: userRole?.can_view_payments ?? false,
    canEditProject: userRole?.can_edit_project ?? false,
    canDeleteLeads: userRole?.can_delete_leads ?? false,
    canChargeCards: userRole?.can_charge_cards ?? false,
    refreshUserRole: () => user && fetchUserRole(user.id),
    refreshAdminProfile: () => user && fetchAdminProfile(user.id),
  };
}
