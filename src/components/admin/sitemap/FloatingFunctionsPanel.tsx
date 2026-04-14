import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GripVertical, Minus, Plus, Package, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react';
import { WEB_PRESETS, type WebPreset } from './webPresets';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WebBuilderDialog } from './WebBuilderDialog';

interface FloatingFunctionsPanelProps {
  onInsertWeb: (pages: any[]) => void;
}

interface CustomWeb {
  id: string;
  name: string;
  description: string | null;
  pages: any[];
}

function countPages(pages: any[]): number {
  return pages.reduce((sum: number, p: any) => sum + 1 + (p.children?.length || 0), 0);
}

export function FloatingFunctionsPanel({ onInsertWeb }: FloatingFunctionsPanelProps) {
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 80 });
  const [dragging, setDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const [customWebs, setCustomWebs] = useState<CustomWeb[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWeb, setEditingWeb] = useState<CustomWeb | null>(null);
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);

  // Fetch custom webs
  const fetchWebs = useCallback(async () => {
    const { data } = await supabase.from('sitemap_webs').select('*').order('created_at', { ascending: false });
    if (data) setCustomWebs(data.map((w: any) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      pages: Array.isArray(w.pages) ? w.pages : [],
    })));
  }, []);

  useEffect(() => { fetchWebs(); }, [fetchWebs]);

  // Panel drag
  const startPanelDrag = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragOffsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    setDragging(true);

    const onMove = (ev: PointerEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 280, ev.clientX - dragOffsetRef.current.x)),
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

  const deleteWeb = async (id: string) => {
    const { error } = await supabase.from('sitemap_webs').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Web deleted');
    fetchWebs();
  };

  const renderPreviewTree = (pages: any[], depth = 0) => (
    <div className={`${depth > 0 ? 'ml-3 border-l border-border pl-2' : ''} space-y-0.5`}>
      {pages.map((p: any, i: number) => (
        <div key={i}>
          <span className="text-[10px] text-muted-foreground">{p.name}</span>
          {p.children?.length > 0 && renderPreviewTree(p.children, depth + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div
        ref={panelRef}
        className="fixed z-40 shadow-xl rounded-xl border border-border bg-card overflow-hidden"
        style={{
          left: position.x,
          top: position.y,
          width: minimized ? 200 : 280,
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
          <span className="text-xs font-semibold flex-1">Functions</span>
          <button onClick={() => setMinimized(!minimized)} className="hover:bg-accent rounded p-0.5">
            <Minus className="h-3 w-3" />
          </button>
        </div>

        {!minimized && (
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            <Tabs defaultValue="library" className="w-full">
              <TabsList className="w-full h-8 rounded-none border-b">
                <TabsTrigger value="library" className="text-[10px] h-7 flex-1">Library</TabsTrigger>
                <TabsTrigger value="custom" className="text-[10px] h-7 flex-1">My Webs</TabsTrigger>
              </TabsList>

              {/* Library */}
              <TabsContent value="library" className="p-2 space-y-1 mt-0">
                {WEB_PRESETS.map(preset => (
                  <div key={preset.id} className="border border-border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center gap-2 px-2.5 py-2 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setExpandedPreset(expandedPreset === preset.id ? null : preset.id)}
                    >
                      {expandedPreset === preset.id ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{preset.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{preset.description}</p>
                      </div>
                      <Badge variant="secondary" className="text-[9px] h-4 shrink-0">{countPages(preset.pages)}</Badge>
                    </div>
                    {expandedPreset === preset.id && (
                      <div className="px-2.5 pb-2 border-t border-border pt-2">
                        {renderPreviewTree(preset.pages)}
                        <Button
                          size="sm"
                          className="w-full h-7 text-[10px] mt-2"
                          onClick={() => onInsertWeb(JSON.parse(JSON.stringify(preset.pages)))}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add to Sitemap
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>

              {/* My Webs */}
              <TabsContent value="custom" className="p-2 space-y-1 mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-[10px] mb-2"
                  onClick={() => { setEditingWeb(null); setShowBuilder(true); }}
                >
                  <Plus className="h-3 w-3 mr-1" /> Create Web
                </Button>
                {customWebs.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-4">No custom webs yet</p>
                )}
                {customWebs.map(web => (
                  <div key={web.id} className="border border-border rounded-lg p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{web.name}</p>
                        {web.description && <p className="text-[10px] text-muted-foreground truncate">{web.description}</p>}
                      </div>
                      <Badge variant="secondary" className="text-[9px] h-4 shrink-0">{countPages(web.pages)}</Badge>
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      <Button
                        size="sm"
                        className="flex-1 h-6 text-[10px]"
                        onClick={() => onInsertWeb(JSON.parse(JSON.stringify(web.pages)))}
                      >
                        <Plus className="h-2.5 w-2.5 mr-0.5" /> Add
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => { setEditingWeb(web); setShowBuilder(true); }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-1.5 text-destructive hover:text-destructive"
                        onClick={() => deleteWeb(web.id)}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {showBuilder && (
        <WebBuilderDialog
          open={showBuilder}
          onOpenChange={setShowBuilder}
          editingWeb={editingWeb}
          onSaved={fetchWebs}
        />
      )}
    </>
  );
}
