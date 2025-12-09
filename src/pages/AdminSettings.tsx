import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const { user, adminProfile, refreshAdminProfile } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(adminProfile?.display_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('admin_profiles').update({ display_name: displayName }).eq('user_id', user.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Profile updated' }); refreshAdminProfile(); }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast({ title: 'Password too short', variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Password updated' }); setNewPassword(''); }
    setSaving(false);
  };

  return (
    <div className="space-y-8 max-w-xl">
      <div><h1 className="text-2xl font-bold tracking-tight">Settings</h1><p className="text-muted-foreground">Manage your account settings</p></div>
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">Profile</h3>
        <div className="space-y-2"><Label>Display Name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ''} disabled /></div>
        <Button onClick={handleUpdateProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </div>
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">Change Password</h3>
        <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" /></div>
        <Button onClick={handleChangePassword} disabled={saving || !newPassword}>{saving ? 'Updating...' : 'Update Password'}</Button>
      </div>
    </div>
  );
}
