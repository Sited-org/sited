import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Shield, Plus, Eye, EyeOff, Copy, Trash2, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CredentialEntry } from '@/hooks/useBuildFlow';

interface CredentialVaultProps {
  credentials: CredentialEntry[];
  buildFlowId: string;
  leadId: string;
  userId: string;
  canEdit: boolean;
  onUpdate: () => Promise<void>;
}

export function CredentialVault({ credentials, buildFlowId, leadId, userId, canEdit, onUpdate }: CredentialVaultProps) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [newCred, setNewCred] = useState({
    service_name: '',
    key_type: '',
    key_value: '',
    notes: '',
    is_test_key: false,
    is_live_key: false,
  });

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast({ title: 'Copied to clipboard' });
  };

  const handleAdd = async () => {
    const { error } = await supabase.from('credential_vault').insert({
      build_flow_id: buildFlowId,
      lead_id: leadId,
      collected_by: userId,
      ...newCred,
    });
    if (error) {
      toast({ title: 'Error saving credential', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Credential saved to vault' });
      setAddOpen(false);
      setNewCred({ service_name: '', key_type: '', key_value: '', notes: '', is_test_key: false, is_live_key: false });
      await onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('credential_vault').delete().eq('id', id);
    toast({ title: 'Credential removed' });
    await onUpdate();
  };

  const maskValue = (v: string) => v.length > 8 ? `${v.slice(0, 4)}${'•'.repeat(v.length - 8)}${v.slice(-4)}` : '••••••••';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" /> Credential Vault
          </CardTitle>
          {canEdit && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Credential
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {credentials.length === 0 && (
          <p className="text-sm text-muted-foreground">No credentials saved yet.</p>
        )}
        {credentials.map(cred => (
          <div key={cred.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
            <Key className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{cred.service_name}</span>
                <Badge variant="outline" className="text-xs">{cred.key_type}</Badge>
                {cred.is_test_key && <Badge variant="secondary" className="text-xs">Test</Badge>}
                {cred.is_live_key && <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/30">Live</Badge>}
              </div>
              <p className="text-sm font-mono text-muted-foreground truncate mt-1">
                {revealedIds.has(cred.id) ? cred.key_value : maskValue(cred.key_value)}
              </p>
              {cred.notes && <p className="text-xs text-muted-foreground mt-1">{cred.notes}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => toggleReveal(cred.id)}>
                {revealedIds.has(cred.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => copyToClipboard(cred.key_value)}>
                <Copy className="h-4 w-4" />
              </Button>
              {canEdit && (
                <Button size="icon" variant="ghost" onClick={() => handleDelete(cred.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Credential</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Service Name</Label>
              <Input value={newCred.service_name} onChange={e => setNewCred({ ...newCred, service_name: e.target.value })} placeholder="e.g. Stripe, Domain Registrar" className="mt-1" />
            </div>
            <div>
              <Label>Key Type</Label>
              <Input value={newCred.key_type} onChange={e => setNewCred({ ...newCred, key_type: e.target.value })} placeholder="e.g. Secret Key, API Key, Login" className="mt-1" />
            </div>
            <div>
              <Label>Key Value</Label>
              <Input type="password" value={newCred.key_value} onChange={e => setNewCred({ ...newCred, key_value: e.target.value })} placeholder="Paste the key or credential" className="mt-1" />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={newCred.notes} onChange={e => setNewCred({ ...newCred, notes: e.target.value })} placeholder="Any additional notes..." className="mt-1" rows={2} />
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={newCred.is_test_key} onCheckedChange={v => setNewCred({ ...newCred, is_test_key: v })} />
                <Label className="text-sm">Test Key</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newCred.is_live_key} onCheckedChange={v => setNewCred({ ...newCred, is_live_key: v })} />
                <Label className="text-sm">Live Key</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newCred.service_name || !newCred.key_value}>
              Save to Vault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
