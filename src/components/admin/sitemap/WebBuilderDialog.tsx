import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WebBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingWeb: { id: string; name: string; description: string | null; pages: any[] } | null;
  onSaved: () => void;
}

// Recursive node: supports children up to 10 levels deep
interface BuilderNode {
  name: string;
  nodeType: string;
  children: BuilderNode[];
  _expanded?: boolean;
}

const MAX_DEPTH = 10;

function parseNodes(raw: any[]): BuilderNode[] {
  return (raw || []).map((p: any) => ({
    name: p.name || '',
    nodeType: p.nodeType || 'page',
    children: parseNodes(p.children || []),
    _expanded: false,
  }));
}

function stripMeta(nodes: BuilderNode[]): any[] {
  return nodes.map(n => ({
    name: n.name,
    nodeType: n.nodeType,
    ...(n.children.length > 0 ? { children: stripMeta(n.children) } : {}),
  }));
}

export function WebBuilderDialog({ open, onOpenChange, editingWeb, onSaved }: WebBuilderDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nodes, setNodes] = useState<BuilderNode[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingWeb) {
      setName(editingWeb.name);
      setDescription(editingWeb.description || '');
      setNodes(parseNodes(editingWeb.pages));
    } else {
      setName('');
      setDescription('');
      setNodes([{ name: 'New Page', nodeType: 'page', children: [], _expanded: true }]);
    }
  }, [editingWeb, open]);

  // Immutable updater: update a node at a given path
  const updateAtPath = (path: number[], updater: (node: BuilderNode) => BuilderNode) => {
    const update = (nodes: BuilderNode[], remaining: number[]): BuilderNode[] => {
      const next = [...nodes];
      if (remaining.length === 1) {
        next[remaining[0]] = updater(next[remaining[0]]);
      } else {
        const [head, ...rest] = remaining;
        next[head] = { ...next[head], children: update(next[head].children, rest) };
      }
      return next;
    };
    setNodes(update(nodes, path));
  };

  const removeAtPath = (path: number[]) => {
    const remove = (nodes: BuilderNode[], remaining: number[]): BuilderNode[] => {
      if (remaining.length === 1) {
        return nodes.filter((_, i) => i !== remaining[0]);
      }
      const [head, ...rest] = remaining;
      const next = [...nodes];
      next[head] = { ...next[head], children: remove(next[head].children, rest) };
      return next;
    };
    setNodes(remove(nodes, path));
  };

  const addChildAtPath = (path: number[]) => {
    updateAtPath(path, node => ({
      ...node,
      _expanded: true,
      children: [...node.children, { name: 'New Sub-page', nodeType: 'page', children: [], _expanded: false }],
    }));
  };

  const addRootPage = () => {
    setNodes([...nodes, { name: 'New Page', nodeType: 'page', children: [], _expanded: true }]);
  };

  const renderNode = (node: BuilderNode, path: number[], depth: number): JSX.Element => {
    const canNest = depth < MAX_DEPTH;
    const hasChildren = node.children.length > 0;
    const isExpanded = node._expanded || false;

    return (
      <div key={path.join('-')} className={`${depth > 0 ? 'ml-4 border-l border-border pl-2' : ''}`}>
        <div className="flex items-center gap-1.5 py-1 group">
          {(hasChildren || canNest) ? (
            <button
              onClick={() => updateAtPath(path, n => ({ ...n, _expanded: !n._expanded }))}
              className="shrink-0"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </button>
          ) : (
            <div className="w-3 shrink-0" />
          )}
          <Input
            value={node.name}
            onChange={e => updateAtPath(path, n => ({ ...n, name: e.target.value }))}
            className="h-6 text-xs flex-1 bg-transparent border-none px-1"
          />
          <select
            value={node.nodeType}
            onChange={e => updateAtPath(path, n => ({ ...n, nodeType: e.target.value }))}
            className="text-[10px] bg-transparent border border-border rounded px-1 h-5"
          >
            <option value="page">Page</option>
            <option value="popup">Pop-Up</option>
            <option value="tab">Tab</option>
            <option value="note">Note</option>
          </select>
          {canNest && (
            <button
              onClick={() => addChildAtPath(path)}
              className="opacity-0 group-hover:opacity-100 hover:text-primary shrink-0"
              title="Add child"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => removeAtPath(path)}
            className="opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        {isExpanded && hasChildren && (
          <div className="space-y-0">
            {node.children.map((child, cIdx) => renderNode(child, [...path, cIdx], depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const save = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (nodes.length === 0) { toast.error('Add at least one page'); return; }
    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      pages: stripMeta(nodes) as any,
      is_preset: false,
    };

    if (editingWeb) {
      const { error } = await supabase.from('sitemap_webs').update(payload).eq('id', editingWeb.id);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
      toast.success('Web updated');
    } else {
      const { error } = await supabase.from('sitemap_webs').insert(payload);
      if (error) { toast.error('Failed to create'); setSaving(false); return; }
      toast.success('Web created');
    }

    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">{editingWeb ? 'Edit Web Template' : 'Create Web Template'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dashboard Web" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" className="h-8 text-sm" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Structure</Label>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={addRootPage}>
                <Plus className="h-3 w-3 mr-0.5" /> Root Page
              </Button>
            </div>

            <div className="border border-border rounded-lg p-2 space-y-0 max-h-[50vh] overflow-y-auto bg-muted/20">
              {nodes.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-4">Add pages to build the web structure</p>
              )}
              {nodes.map((node, idx) => renderNode(node, [idx], 0))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Hover over a node to add children (up to 10 levels deep) or delete it.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : editingWeb ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
