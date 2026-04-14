import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GripVertical, Minus, Plus, Package, Trash2, ChevronDown, ChevronRight, Pencil, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FloatingFunctionsPanelProps {
  onInsertWeb: (pages: any[]) => void;
}

interface CustomWeb {
  id: string;
  name: string;
  description: string | null;
  pages: any[];
}

// ─── Recursive builder node ────────────────────────────────────────────────────

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
    _expanded: true,
  }));
}

function stripMeta(nodes: BuilderNode[]): any[] {
  return nodes.map(n => ({
    name: n.name,
    nodeType: n.nodeType,
    ...(n.children.length > 0 ? { children: stripMeta(n.children) } : {}),
  }));
}

function countNodes(pages: any[]): number {
  return pages.reduce((sum: number, p: any) => sum + 1 + (p.children ? countNodes(p.children) : 0), 0);
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function FloatingFunctionsPanel({ onInsertWeb }: FloatingFunctionsPanelProps) {
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: 80 });
  const [dragging, setDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const [webs, setWebs] = useState<CustomWeb[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Builder state
  const [builderMode, setBuilderMode] = useState<'list' | 'edit'>('list');
  const [editingWebId, setEditingWebId] = useState<string | null>(null);
  const [builderName, setBuilderName] = useState('');
  const [builderDesc, setBuilderDesc] = useState('');
  const [builderNodes, setBuilderNodes] = useState<BuilderNode[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchWebs = useCallback(async () => {
    const { data } = await supabase.from('sitemap_webs').select('*').order('created_at', { ascending: false });
    if (data) setWebs(data.map((w: any) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      pages: Array.isArray(w.pages) ? w.pages : [],
    })));
  }, []);

  useEffect(() => { fetchWebs(); }, [fetchWebs]);

  const startPanelDrag = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragOffsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    setDragging(true);
    const onMove = (ev: PointerEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 300, ev.clientX - dragOffsetRef.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 60, ev.clientY - dragOffsetRef.current.y)),
      });
    };
    const onUp = () => {
      setDragging(false);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [position]);

  // ─── Builder helpers ───────────────────────────────────────────────────────

  const openBuilder = (web?: CustomWeb) => {
    if (web) {
      setEditingWebId(web.id);
      setBuilderName(web.name);
      setBuilderDesc(web.description || '');
      setBuilderNodes(parseNodes(web.pages));
    } else {
      setEditingWebId(null);
      setBuilderName('');
      setBuilderDesc('');
      setBuilderNodes([{ name: 'New Page', nodeType: 'page', children: [], _expanded: true }]);
    }
    setBuilderMode('edit');
  };

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
    setBuilderNodes(prev => update(prev, path));
  };

  const removeAtPath = (path: number[]) => {
    const remove = (nodes: BuilderNode[], remaining: number[]): BuilderNode[] => {
      if (remaining.length === 1) return nodes.filter((_, i) => i !== remaining[0]);
      const [head, ...rest] = remaining;
      const next = [...nodes];
      next[head] = { ...next[head], children: remove(next[head].children, rest) };
      return next;
    };
    setBuilderNodes(prev => remove(prev, path));
  };

  const addChildAtPath = (path: number[]) => {
    updateAtPath(path, node => ({
      ...node,
      _expanded: true,
      children: [...node.children, { name: 'New Sub-page', nodeType: 'page', children: [], _expanded: false }],
    }));
  };

  const saveWeb = async () => {
    if (!builderName.trim()) { toast.error('Name is required'); return; }
    if (builderNodes.length === 0) { toast.error('Add at least one page'); return; }
    setSaving(true);

    const payload = {
      name: builderName.trim(),
      description: builderDesc.trim() || null,
      pages: stripMeta(builderNodes) as any,
      is_preset: false,
    };

    if (editingWebId) {
      const { error } = await supabase.from('sitemap_webs').update(payload).eq('id', editingWebId);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
      toast.success('Web updated');
    } else {
      const { error } = await supabase.from('sitemap_webs').insert(payload);
      if (error) { toast.error('Failed to create'); setSaving(false); return; }
      toast.success('Web created');
    }

    setSaving(false);
    fetchWebs();
    setBuilderMode('list');
  };

  const deleteWeb = async (id: string) => {
    if (!confirm('Delete this web template?')) return;
    await supabase.from('sitemap_webs').delete().eq('id', id);
    toast.success('Deleted');
    fetchWebs();
  };

  // ─── Tree rendering helpers ────────────────────────────────────────────────

  const renderPreviewTree = (pages: any[], depth = 0): JSX.Element => (
    <div className={`${depth > 0 ? 'ml-3 border-l border-border pl-2' : ''} space-y-0.5`}>
      {pages.map((p: any, i: number) => (
        <div key={i}>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              p.nodeType === 'popup' ? 'bg-amber-500' :
              p.nodeType === 'tab' ? 'bg-blue-500' :
              p.nodeType === 'note' ? 'bg-muted-foreground/40' :
              'bg-primary'
            }`} />
            <span className={`text-[10px] text-muted-foreground ${p.nodeType === 'note' ? 'italic' : ''}`}>{p.name}</span>
          </div>
          {p.children?.length > 0 && renderPreviewTree(p.children, depth + 1)}
        </div>
      ))}
    </div>
  );

  const renderBuilderNode = (node: BuilderNode, path: number[], depth: number): JSX.Element => {
    const canNest = depth < MAX_DEPTH;
    const hasChildren = node.children.length > 0;
    const isExpanded = node._expanded || false;

    return (
      <div key={path.join('-')} className={`${depth > 0 ? 'ml-3 border-l border-border pl-1.5' : ''}`}>
        <div className="flex items-center gap-1 py-0.5 group">
          {(hasChildren || canNest) ? (
            <button onClick={() => updateAtPath(path, n => ({ ...n, _expanded: !n._expanded }))} className="shrink-0">
              {isExpanded ? <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" /> : <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />}
            </button>
          ) : <div className="w-2.5 shrink-0" />}
          <Input
            value={node.name}
            onChange={e => updateAtPath(path, n => ({ ...n, name: e.target.value }))}
            className="h-5 text-[10px] flex-1 bg-transparent border-none px-1 min-w-0"
          />
          <select
            value={node.nodeType}
            onChange={e => updateAtPath(path, n => ({ ...n, nodeType: e.target.value }))}
            className="text-[9px] bg-transparent border border-border rounded px-0.5 h-4"
          >
            <option value="page">Page</option>
            <option value="popup">Pop-Up</option>
            <option value="tab">Tab</option>
            <option value="note">Note</option>
          </select>
          {canNest && (
            <button onClick={() => addChildAtPath(path)} className="opacity-0 group-hover:opacity-100 hover:text-primary shrink-0" title="Add child">
              <Plus className="h-2.5 w-2.5" />
            </button>
          )}
          <button onClick={() => removeAtPath(path)} className="opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0">
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
        {isExpanded && hasChildren && (
          <div>{node.children.map((child, cIdx) => renderBuilderNode(child, [...path, cIdx], depth + 1))}</div>
        )}
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={panelRef}
      className="fixed z-40 shadow-xl rounded-xl border border-border bg-card overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: minimized ? 200 : 300,
        maxHeight: minimized ? 'auto' : 'calc(100vh - 120px)',
        cursor: dragging ? 'grabbing' : 'auto',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border cursor-grab active:cursor-grabbing select-none"
        onPointerDown={startPanelDrag}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold flex-1">
          {builderMode === 'edit' ? (editingWebId ? 'Edit Web' : 'New Web') : 'Web Templates'}
        </span>
        <button onClick={() => setMinimized(!minimized)} className="hover:bg-accent rounded p-0.5">
          <Minus className="h-3 w-3" />
        </button>
      </div>

      {!minimized && builderMode === 'list' && (
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {/* New Web button */}
          <div className="p-2 border-b border-border">
            <Button size="sm" className="w-full h-7 text-[10px]" onClick={() => openBuilder()}>
              <Plus className="h-3 w-3 mr-1" /> Create New Web
            </Button>
          </div>

          <div className="p-2 space-y-1">
            {webs.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-4">No web templates yet.</p>
            )}
            {webs.map(web => (
              <div key={web.id} className="border border-border rounded-lg overflow-hidden">
                <div
                  className="flex items-center gap-2 px-2.5 py-2 hover:bg-muted/50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === web.id ? null : web.id)}
                >
                  {expandedId === web.id ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{web.name}</p>
                    {web.description && <p className="text-[10px] text-muted-foreground truncate">{web.description}</p>}
                  </div>
                  <Badge variant="secondary" className="text-[9px] h-4 shrink-0">{countNodes(web.pages)}</Badge>
                </div>
                {expandedId === web.id && (
                  <div className="px-2.5 pb-2 border-t border-border pt-2">
                    {renderPreviewTree(web.pages)}
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-[10px]"
                        onClick={() => onInsertWeb(JSON.parse(JSON.stringify(web.pages)))}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={(e) => { e.stopPropagation(); openBuilder(web); }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteWeb(web.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Inline Builder ─── */}
      {!minimized && builderMode === 'edit' && (
        <div className="overflow-y-auto p-2 space-y-2" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          <div className="space-y-1.5">
            <div>
              <Label className="text-[10px]">Name</Label>
              <Input value={builderName} onChange={e => setBuilderName(e.target.value)} placeholder="e.g. Sales Funnel" className="h-6 text-[11px]" />
            </div>
            <div>
              <Label className="text-[10px]">Description</Label>
              <Input value={builderDesc} onChange={e => setBuilderDesc(e.target.value)} placeholder="Optional" className="h-6 text-[11px]" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-[10px]">Structure</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[9px] px-1.5"
                onClick={() => setBuilderNodes(prev => [...prev, { name: 'New Page', nodeType: 'page', children: [], _expanded: true }])}
              >
                <Plus className="h-2.5 w-2.5 mr-0.5" /> Root
              </Button>
            </div>
            <div className="border border-border rounded-lg p-1.5 space-y-0 max-h-[40vh] overflow-y-auto bg-muted/20">
              {builderNodes.length === 0 && (
                <p className="text-[9px] text-muted-foreground text-center py-3">Add pages to build the web</p>
              )}
              {builderNodes.map((node, idx) => renderBuilderNode(node, [idx], 0))}
            </div>
            <p className="text-[9px] text-muted-foreground mt-0.5">Hover nodes to add children or delete.</p>
          </div>

          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px]" onClick={() => setBuilderMode('list')}>
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
            <Button size="sm" className="flex-1 h-7 text-[10px]" onClick={saveWeb} disabled={saving}>
              {saving ? 'Saving…' : editingWebId ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
