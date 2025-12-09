import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Trash2, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminTeam() {
  const { users, loading, updateUserPermissions, deleteUser } = useAdminUsers();
  const { user, canManageUsers } = useAuth();

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading...</div>;
  if (!canManageUsers) return <div className="text-muted-foreground">You don't have permission to view this page.</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Team</h1><p className="text-muted-foreground">Manage admin users and permissions</p></div>
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-muted/50"><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Can Edit</TableHead><TableHead>Can Manage Users</TableHead><TableHead>Joined</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell><div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /><span>{u.profile?.email || 'Unknown'}</span></div></TableCell>
                <TableCell className="capitalize">{u.role}</TableCell>
                <TableCell><Switch checked={u.can_edit_leads} onCheckedChange={(v) => updateUserPermissions(u.user_id, { can_edit_leads: v })} disabled={u.user_id === user?.id} /></TableCell>
                <TableCell><Switch checked={u.can_manage_users} onCheckedChange={(v) => updateUserPermissions(u.user_id, { can_manage_users: v })} disabled={u.user_id === user?.id || u.role === 'owner'} /></TableCell>
                <TableCell className="text-muted-foreground text-sm">{format(new Date(u.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell>{u.user_id !== user?.id && u.role !== 'owner' && <Button variant="ghost" size="icon" onClick={() => deleteUser(u.user_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
