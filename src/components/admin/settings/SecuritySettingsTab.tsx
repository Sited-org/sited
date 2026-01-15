import { useState } from 'react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, Users, Loader2, RefreshCw, Mail } from 'lucide-react';

export default function SecuritySettingsTab() {
  const { loading: settingsLoading } = useSystemSettings();
  const { users, loading: usersLoading, fetchUsers } = useAdminUsers();
  const { userRole, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const canManageSettings = userRole && ['owner', 'admin'].includes(userRole.role);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

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
        <p className="text-sm text-muted-foreground">Security overview for your team</p>
      </div>

      {/* 2FA Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Email Verification (2FA)</CardTitle>
              <CardDescription>
                All logins require email verification for enhanced security
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg border border-green-500/20">
            <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Email 2FA is mandatory for all users</p>
              <p className="text-xs text-green-600/80 dark:text-green-400/80">
                After entering their credentials, all admin and client users receive a 6-digit verification code via email that must be entered to complete login.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Team Members</CardTitle>
                <CardDescription>
                  Overview of admin team members
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Total Team Members</span>
                </div>
                <p className="text-2xl font-bold mt-1">{users.length}</p>
              </div>
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">2FA Protected</span>
                </div>
                <p className="text-2xl font-bold mt-1">100%</p>
              </div>
            </div>

            {/* User List */}
            <div className="divide-y divide-border rounded-lg border">
              {users.map((u) => {
                const isCurrentUser = u.user_id === user?.id;
                
                return (
                  <div key={u.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-green-500/20">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {u.profile?.display_name || u.profile?.email || 'Unknown'}
                          {isCurrentUser && <span className="text-muted-foreground ml-1">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="default"
                      className="bg-green-500/20 text-green-600 hover:bg-green-500/30"
                    >
                      Email 2FA Active
                    </Badge>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              All users are protected with mandatory email-based two-factor authentication on every login.
            </p>
          </div>
        </CardContent>
      </Card>

      {!canManageSettings && (
        <div className="text-center text-muted-foreground text-sm py-4">
          Only owners and admins can view detailed security settings.
        </div>
      )}
    </div>
  );
}
