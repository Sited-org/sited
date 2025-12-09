import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface AdminUser {
  id: string;
  user_id: string;
  role: AppRole;
  can_view: boolean;
  can_edit_leads: boolean;
  can_manage_users: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (rolesError) {
      toast({
        title: "Error fetching users",
        description: rolesError.message,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('admin_profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    const usersWithProfiles = (roles || []).map(role => {
      const profile = profiles?.find(p => p.user_id === role.user_id);
      return {
        ...role,
        profile: profile ? {
          display_name: profile.display_name,
          email: profile.email,
          avatar_url: profile.avatar_url
        } : undefined
      } as AdminUser;
    });

    setUsers(usersWithProfiles);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserPermissions = async (
    userId: string, 
    permissions: { 
      role?: AppRole;
      can_view?: boolean;
      can_edit_leads?: boolean;
      can_manage_users?: boolean;
    }
  ) => {
    const { error } = await supabase
      .from('user_roles')
      .update(permissions)
      .eq('user_id', userId);
    
    if (error) {
      toast({
        title: "Error updating permissions",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    toast({
      title: "Permissions updated"
    });
    fetchUsers();
    return true;
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      toast({
        title: "Error removing user",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    toast({
      title: "User removed"
    });
    fetchUsers();
    return true;
  };

  return {
    users,
    loading,
    fetchUsers,
    updateUserPermissions,
    deleteUser
  };
}
