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

interface BuilderPage {
  name: string;
  nodeType: string;
  children: BuilderChild[];
}
interface BuilderChild {
  name: string;
  nodeType: string;
}

export function WebBuilderDialog({ open, onOpenChange, editingWeb, onSaved }: WebBuilderDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pages, setPages] = useState<BuilderPage[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedPage, setExpandedPage] = useState<number | null>(null);

  useEffect(() => {
    if (editingWeb) {
      setName(editingWeb.name);
      setDescription(editingWeb.description || '');
      setPages(editingWeb.pages.map((p: any) => ({
        name: p.name || '',
        nodeType: p.nodeType || 'page',
        children: (p.children || []).map((c: any) => ({
          name: c.name || '',
          nodeType: c.nodeType || 'page',
        })),
      })));
    } else {
      setName('');
      setDescription('');
      setPages([{ name: 'New Page', nodeType: 'page', children: [] }]);
    }
  }, [editingWeb, open]);

  const addPage = () => {
    setPages([...pages, { name: 'New Page', nodeType: 'page', children: [] }]);
  };

  const removePage = (idx: number) => {
    setPages(pages.filter((_, i) => i !== idx));
    if (expandedPage === idx) setExpandedPage(null);
  };

  const updatePage = (idx: number, field: string, value: string) => {
    const next = [...pages];
    next[idx] = { ...next[idx], [field]: value };
    setPages(next);
  };

  const addChild = (pIdx: number) => {
    const next = [...pages];
    next[pIdx] = { ...next[pIdx], children: [...next[pIdx].children, { name: 'Sub Page', nodeType: 'page' }] };
    setPages(next);
  };

  const removeChild = (pIdx: number, cIdx: number) => {
    const next = [...pages];
    next[pIdx] = { ...next[pIdx], children: next[pIdx].children.filter((_, i) => i !== cIdx) };
    setPages(next);
  };

  const updateChild = (pIdx: number, cIdx: number, field: string, value: string) => {
    const next = [...pages];
    const children = [...next[pIdx].children];
    children[cIdx] = { ...children[cIdx], [field]: value };
    next[pIdx] = { ...next[pIdx], children };
    setPages(next);
  };

  const save = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (pages.length === 0) { toast.error('Add at least one page'); return; }
    setSaving(true);

    // Convert to SitemapPage format
    const sitemapPages = pages.map(p => ({
      name: p.name,
      nodeType: p.nodeType as any,
      ...(p.children.length > 0 ? {
        children: p.children.map(c => ({ name: c.name, nodeType: c.nodeType as any })),
      } : {}),
    }));

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      pages: sitemapPages as any,
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
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">{editingWeb ? 'Edit Web' : 'Create Web'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dashboard Web" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" className="h-8 text-sm" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Pages</Label>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={addPage}>
                <Plus className="h-3 w-3 mr-0.5" /> Page
              </Button>
            </div>

            <div className="space-y-1.5">
              {pages.map((page, pIdx) => (
                <div key={pIdx} className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted/30">
                    <button onClick={() => setExpandedPage(expandedPage === pIdx ? null : pIdx)}>
                      {expandedPage === pIdx ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                    <Input
                      value={page.name}
                      onChange={e => updatePage(pIdx, 'name', e.target.value)}
                      className="h-6 text-xs flex-1 bg-transparent border-none px-1"
                    />
                    <select
                      value={page.nodeType}
                      onChange={e => updatePage(pIdx, 'nodeType', e.target.value)}
                      className="text-[10px] bg-transparent border rounded px-1 h-5"
                    >
                      <option value="page">Page</option>
                      <option value="popup">Pop-Up</option>
                      <option value="tab">Tab</option>
                      <option value="note">Note</option>
                    </select>
                    <button onClick={() => removePage(pIdx)} className="hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {expandedPage === pIdx && (
                    <div className="px-2 py-1.5 space-y-1 border-t border-border bg-background">
                      {page.children.map((child, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-1.5 ml-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                          <Input
                            value={child.name}
                            onChange={e => updateChild(pIdx, cIdx, 'name', e.target.value)}
                            className="h-5 text-[10px] flex-1 bg-transparent border-none px-1"
                          />
                          <select
                            value={child.nodeType}
                            onChange={e => updateChild(pIdx, cIdx, 'nodeType', e.target.value)}
                            className="text-[9px] bg-transparent border rounded px-0.5 h-4"
                          >
                            <option value="page">Page</option>
                            <option value="popup">Pop-Up</option>
                            <option value="tab">Tab</option>
                            <option value="note">Note</option>
                          </select>
                          <button onClick={() => removeChild(pIdx, cIdx)} className="hover:text-destructive">
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addChild(pIdx)}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground ml-3 mt-0.5"
                      >
                        <Plus className="h-2.5 w-2.5" /> Add Sub-page
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
