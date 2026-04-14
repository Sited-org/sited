import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Minus, Plus, Package, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
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

function countNodes(pages: any[]): number {
  return pages.reduce((sum: number, p: any) => sum + 1 + (p.children ? countNodes(p.children) : 0), 0);
}

export function FloatingFunctionsPanel({ onInsertWeb }: FloatingFunctionsPanelProps) {
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 80 });
  const [dragging, setDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const [webs, setWebs] = useState<CustomWeb[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const renderPreviewTree = (pages: any[], depth = 0): JSX.Element => (
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
        <span className="text-xs font-semibold flex-1">Web Templates</span>
        <button onClick={() => setMinimized(!minimized)} className="hover:bg-accent rounded p-0.5">
          <Minus className="h-3 w-3" />
        </button>
      </div>

      {!minimized && (
        <div className="overflow-y-auto p-2 space-y-1" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {webs.length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-4">No web templates yet. Create them in the Sitemaps admin page.</p>
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
                  <Button
                    size="sm"
                    className="w-full h-7 text-[10px] mt-2"
                    onClick={() => onInsertWeb(JSON.parse(JSON.stringify(web.pages)))}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add to Sitemap
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
