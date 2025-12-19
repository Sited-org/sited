import { useState } from 'react';
import { useAdminUsers, ROLE_PERMISSIONS } from '@/hooks/useAdminUsers';
import { useAuth, StaffRole } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Shield, UserPlus, Code, DollarSign, Settings, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ROLE_INFO: Record<StaffRole, { label: string; description: string; icon: React.ElementType; color: string }> = {
  owner: { label: 'Owner', description: 'Full access to everything', icon: Shield, color: 'bg-primary text-primary-foreground' },
  admin: { label: 'Admin', description: 'Full access except removing owner', icon: Settings, color: 'bg-primary text-primary-foreground' },
  developer: { label: 'Developer', description: 'Projects & customer notes, no payments', icon: Code, color: 'bg-blue-500/20 text-blue-500' },
  sales: { label: 'Sales', description: 'Leads & payments, can charge cards', icon: DollarSign, color: 'bg-green-500/20 text-green-500' },
  editor: { label: 'Editor', description: 'Can edit leads and projects', icon: Settings, color: 'bg-orange-500/20 text-orange-500' },
  viewer: { label: 'Viewer', description: 'View only access', icon: Eye, color: 'bg-muted text-muted-foreground' },
};

export default function AdminTeam() {
  const { users, loading, updateUserPermissions, deleteUser } = useAdminUsers();
  const { user, canManageUsers, userRole } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('developer');

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading...</div>;
  if (!canManageUsers) return <div className="text-muted-foreground">You don't have permission to view this page.</div>;

  const handleRoleChange = async (userId: string, role: StaffRole) => {
    const permissions = ROLE_PERMISSIONS[role];
    await updateUserPermissions(userId, { role, ...permissions });
  };

  const handleAddStaff = () => {
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    toast.success(`Invitation will be sent to ${newEmail} as ${ROLE_INFO[newRole].label}`);
    setIsAddDialogOpen(false);
    setNewEmail('');
    setNewRole('developer');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">Manage staff members and permissions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="staff@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as StaffRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['developer', 'sales', 'admin'] as StaffRole[]).map((role) => {
                      const info = ROLE_INFO[role];
                      const Icon = info.icon;
                      return (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <div>
                              <span className="font-medium">{info.label}</span>
                              <span className="text-muted-foreground ml-2 text-xs">{info.description}</span>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Role Permissions Preview */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium">Permissions Preview</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={ROLE_PERMISSIONS[newRole].can_view_payments ? 'text-green-500' : 'text-muted-foreground'}>
                      {ROLE_PERMISSIONS[newRole].can_view_payments ? '✓' : '✗'}
                    </span>
                    <span>View Payments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={ROLE_PERMISSIONS[newRole].can_edit_leads ? 'text-green-500' : 'text-muted-foreground'}>
                      {ROLE_PERMISSIONS[newRole].can_edit_leads ? '✓' : '✗'}
                    </span>
                    <span>Edit Leads</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={ROLE_PERMISSIONS[newRole].can_edit_project ? 'text-green-500' : 'text-muted-foreground'}>
                      {ROLE_PERMISSIONS[newRole].can_edit_project ? '✓' : '✗'}
                    </span>
                    <span>Edit Projects</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={ROLE_PERMISSIONS[newRole].can_charge_cards ? 'text-green-500' : 'text-muted-foreground'}>
                      {ROLE_PERMISSIONS[newRole].can_charge_cards ? '✓' : '✗'}
                    </span>
                    <span>Charge Cards</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={ROLE_PERMISSIONS[newRole].can_delete_leads ? 'text-green-500' : 'text-muted-foreground'}>
                      {ROLE_PERMISSIONS[newRole].can_delete_leads ? '✓' : '✗'}
                    </span>
                    <span>Delete Leads</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={ROLE_PERMISSIONS[newRole].can_manage_users ? 'text-green-500' : 'text-muted-foreground'}>
                      {ROLE_PERMISSIONS[newRole].can_manage_users ? '✓' : '✗'}
                    </span>
                    <span>Manage Users</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddStaff}>Send Invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {users.map(u => {
          const roleInfo = ROLE_INFO[u.role as StaffRole] || ROLE_INFO.viewer;
          const Icon = roleInfo.icon;
          const isCurrentUser = u.user_id === user?.id;
          const isOwner = u.role === 'owner';
          const canModify = !isCurrentUser && !isOwner;
          
          return (
            <div key={u.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${roleInfo.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{u.profile?.email || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{u.profile?.display_name}</p>
                  </div>
                </div>
                <Badge variant="outline" className={roleInfo.color}>
                  {roleInfo.label}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Joined {format(new Date(u.created_at), 'MMM d, yyyy')}
                </span>
                <div className="flex gap-2">
                  {canModify && (
                    <>
                      <Select
                        value={u.role}
                        onValueChange={(v) => handleRoleChange(u.user_id, v as StaffRole)}
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(['developer', 'sales', 'admin'] as StaffRole[]).map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_INFO[role].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {u.profile?.email} from the team. They will lose all access.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteUser(u.user_id)} className="bg-destructive">
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => {
              const roleInfo = ROLE_INFO[u.role as StaffRole] || ROLE_INFO.viewer;
              const Icon = roleInfo.icon;
              const isCurrentUser = u.user_id === user?.id;
              const isOwner = u.role === 'owner';
              const canModify = !isCurrentUser && !isOwner;

              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${roleInfo.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{u.profile?.email || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{u.profile?.display_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canModify ? (
                      <Select
                        value={u.role}
                        onValueChange={(v) => handleRoleChange(u.user_id, v as StaffRole)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(['developer', 'sales', 'admin'] as StaffRole[]).map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_INFO[role].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={roleInfo.color}>
                        {roleInfo.label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.can_view_payments && <Badge variant="secondary" className="text-xs">Payments</Badge>}
                      {u.can_edit_leads && <Badge variant="secondary" className="text-xs">Edit Leads</Badge>}
                      {u.can_edit_project && <Badge variant="secondary" className="text-xs">Projects</Badge>}
                      {u.can_charge_cards && <Badge variant="secondary" className="text-xs">Charge</Badge>}
                      {u.can_delete_leads && <Badge variant="secondary" className="text-xs">Delete</Badge>}
                      {u.can_manage_users && <Badge variant="secondary" className="text-xs">Manage</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(u.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {canModify && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {u.profile?.email} from the team. They will lose all access.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteUser(u.user_id)} className="bg-destructive">
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}