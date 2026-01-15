import { useState, useEffect } from 'react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, ShieldAlert, Users, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function SecuritySettingsTab() {
  const { securitySettings, loading: settingsLoading, updateSecuritySettings } = useSystemSettings();
  const { users, loading: usersLoading, fetchUsers } = useAdminUsers();
  const { userRole, user } = useAuth();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<Record<string, boolean>>({});
  const [checkingMfa, setCheckingMfa] = useState(false);

  const canManageSettings = userRole && ['owner', 'admin'].includes(userRole.role);

  // Check MFA status for current user
  useEffect(() => {
    const checkCurrentUserMfa = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        const hasVerifiedTotp = data?.totp?.some(f => f.status === 'verified') ?? false;
        
        setMfaStatus(prev => ({
          ...prev,
          [user.id]: hasVerifiedTotp
        }));
      } catch (error) {
        console.error('Error checking MFA status:', error);
      }
    };

    checkCurrentUserMfa();
  }, [user]);

  const handleToggle2faRequirement = async (enabled: boolean) => {
    if (!canManageSettings) return;
    
    setUpdating(true);
    await updateSecuritySettings({ require_2fa_for_team: enabled });
    setUpdating(false);
  };

  // Count enrolled vs not enrolled
  const enrolledCount = users.filter(u => mfaStatus[u.user_id]).length;
  const totalUsers = users.length;

  if (settingsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Security Settings</h2>
        <p className="text-sm text-muted-foreground">Configure security policies for your team</p>
      </div>

      {/* 2FA Requirement Policy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Two-Factor Authentication Policy</CardTitle>
              <CardDescription>
                Require all team members to enable 2FA for enhanced security
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="require-2fa" className="font-medium">
                Require 2FA for all team members
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, team members without 2FA will be prompted to set it up on login
              </p>
            </div>
            <Switch
              id="require-2fa"
              checked={securitySettings.require_2fa_for_team}
              onCheckedChange={handleToggle2faRequirement}
              disabled={!canManageSettings || updating}
            />
          </div>

          {securitySettings.require_2fa_for_team && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20">
              <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                2FA is required. Team members without 2FA enabled will be asked to set it up when they next log in.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team 2FA Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Team 2FA Status</CardTitle>
                <CardDescription>
                  Overview of 2FA enrollment across your team
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchUsers()}
              disabled={checkingMfa}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${checkingMfa ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Enrolled</span>
                </div>
                <p className="text-2xl font-bold mt-1">{enrolledCount}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Not Enrolled</span>
                </div>
                <p className="text-2xl font-bold mt-1">{totalUsers - enrolledCount}</p>
              </div>
            </div>

            {/* User List */}
            <div className="divide-y divide-border rounded-lg border">
              {users.map((u) => {
                const isEnrolled = mfaStatus[u.user_id] || false;
                const isCurrentUser = u.user_id === user?.id;
                
                return (
                  <div key={u.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${isEnrolled ? 'bg-green-500/20' : 'bg-muted'}`}>
                        {isEnrolled ? (
                          <ShieldCheck className="h-4 w-4 text-green-500" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {u.profile?.display_name || u.profile?.email || 'Unknown'}
                          {isCurrentUser && <span className="text-muted-foreground ml-1">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.role}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={isEnrolled ? 'default' : 'secondary'}
                      className={isEnrolled ? 'bg-green-500/20 text-green-600 hover:bg-green-500/30' : ''}
                    >
                      {isEnrolled ? '2FA Enabled' : 'Not Enrolled'}
                    </Badge>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              Note: 2FA status is checked when users log in. The status shown may not reflect recent changes until users log in again.
            </p>
          </div>
        </CardContent>
      </Card>

      {!canManageSettings && (
        <div className="text-center text-muted-foreground text-sm py-4">
          Only owners and admins can modify security settings.
        </div>
      )}
    </div>
  );
}
