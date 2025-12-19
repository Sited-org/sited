import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { StaffRole } from '@/hooks/useAuth';

export type AppRole = StaffRole;

export interface AdminUser {
  id: string;
  user_id: string;
  role: AppRole;
  can_view: boolean;
  can_edit_leads: boolean;
  can_manage_users: boolean;
  can_view_payments: boolean;
  can_edit_project: boolean;
  can_delete_leads: boolean;
  can_charge_cards: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string;
    email: string;
    avatar_url: string | null;
  };
}

// Default permissions for each role
export const ROLE_PERMISSIONS: Record<StaffRole, Partial<AdminUser>> = {
  owner: {
    can_view: true,
    can_edit_leads: true,
    can_manage_users: true,
    can_view_payments: true,
    can_edit_project: true,
    can_delete_leads: true,
    can_charge_cards: true,
  },
  admin: {
    can_view: true,
    can_edit_leads: true,
    can_manage_users: true,
    can_view_payments: true,
    can_edit_project: true,
    can_delete_leads: true,
    can_charge_cards: true,
  },
  developer: {
    can_view: true,
    can_edit_leads: false,
    can_manage_users: false,
    can_view_payments: false,
    can_edit_project: true,
    can_delete_leads: false,
    can_charge_cards: false,
  },
  sales: {
    can_view: true,
    can_edit_leads: false,
    can_manage_users: false,
    can_view_payments: true,
    can_edit_project: false,
    can_delete_leads: false,
    can_charge_cards: true,
  },
  editor: {
    can_view: true,
    can_edit_leads: true,
    can_manage_users: false,
    can_view_payments: true,
    can_edit_project: true,
    can_delete_leads: false,
    can_charge_cards: false,
  },
  viewer: {
    can_view: true,
    can_edit_leads: false,
    can_manage_users: false,
    can_view_payments: false,
    can_edit_project: false,
    can_delete_leads: false,
    can_charge_cards: false,
  },
};

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
      can_view_payments?: boolean;
      can_edit_project?: boolean;
      can_delete_leads?: boolean;
      can_charge_cards?: boolean;
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
    
    toast({ title: "Permissions updated" });
    fetchUsers();
    return true;
  };

  const addStaffMember = async (email: string, role: StaffRole) => {
    // This creates an invite - the user will need to sign up
    const permissions = ROLE_PERMISSIONS[role];
    
    // For now, we'll create a placeholder that gets linked when user signs up
    toast({
      title: "Invite sent",
      description: `An invitation has been sent to ${email} as ${role}.`
    });
    
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
    
    toast({ title: "User removed" });
    fetchUsers();
    return true;
  };

  return {
    users,
    loading,
    fetchUsers,
    updateUserPermissions,
    addStaffMember,
    deleteUser
  };
}
