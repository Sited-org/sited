import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Download, Save, Import, Plus, Trash2, X, GripVertical, Layers,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateSitemapPDF } from './AdminSitemaps';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SitemapTab {
  name: string;
}

interface SitemapChild {
  name: string;
  tabs?: SitemapTab[];
}

interface SitemapPage {
  name: string;
  children?: SitemapChild[];
}

interface SitemapSection {
  title: string;
  pages: SitemapPage[];
}

interface LeadOption {
  id: string;
  name: string | null;
  business_name: string | null;
}

type EditingNode = {
  type: 'section' | 'page' | 'child' | 'tab';
  sIdx: number;
  pIdx?: number;
  cIdx?: number;
  tIdx?: number;
} | null;

type DragItem = {
  type: 'page' | 'child' | 'tab';
  pIdx: number;
  cIdx?: number;
  tIdx?: number;
} | null;

type DropTarget = {
  type: 'page' | 'child' | 'tab';
  index: number;
  parentPIdx?: number;
  parentCIdx?: number;
} | null;

function safeJsonParse<T>(val: string | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

/** Migrate legacy string[] children to SitemapChild[] */
function migrateChildren(children: any[] | undefined): SitemapChild[] | undefined {
  if (!children?.length) return undefined;
  return children.map(c => typeof c === 'string' ? { name: c } : c);
}

function migrateSections(raw: any[]): SitemapSection[] {
  return raw.map(s => ({
    ...s,
    pages: (s.pages || []).map((p: any) => ({
      ...p,
      children: migrateChildren(p.children),
    })),
  }));
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminSitemapBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [name, setName] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [sections, setSections] = useState<SitemapSection[]>([{ title: 'Front-End', pages: [{ name: 'Home' }] }]);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [editingNode, setEditingNode] = useState<EditingNode>(null);
  const [dragItem, setDragItem] = useState<DragItem>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);

  // Canvas refs for SVG connectors
  const canvasRef = useRef<HTMLDivElement>(null);
  const rootNodeRef = useRef<HTMLDivElement>(null);
  const pageNodeRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const childNodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tabNodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connectorLines, setConnectorLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  // ── Fetch ──

  const fetchLeads = useCallback(async () => {
    const { data } = await supabase.from('leads').select('id, name, business_name').order('created_at', { ascending: false }).limit(500);
    if (data) setLeads(data);
  }, []);

  const fetchSitemap = useCallback(async () => {
    if (isNew) return;
    const { data, error } = await supabase.from('project_sitemaps').select('*').eq('id', id!).maybeSingle();
    if (error || !data) { toast.error('Sitemap not found'); navigate('/admin/sitemaps'); return; }
    setName(data.name);
    setSelectedLeadId(data.lead_id || '');
    const s = (data.sections as any) || [];
    setSections(s.length ? migrateSections(s) : [{ title: 'Front-End', pages: [] }]);
    setLoading(false);
  }, [id, isNew, navigate]);

  useEffect(() => { fetchLeads(); fetchSitemap(); }, [fetchLeads, fetchSitemap]);

  // ── Connector lines ──

  const currentSection = sections[activeSectionIdx] || sections[0];

  const recalcConnectors = useCallback(() => {
    if (!canvasRef.current || !rootNodeRef.current) return;
    const cr = canvasRef.current.getBoundingClientRect();
    const off = { x: cr.left - canvasRef.current.scrollLeft, y: cr.top - canvasRef.current.scrollTop };
    const lines: typeof connectorLines = [];

    const rr = rootNodeRef.current.getBoundingClientRect();
    const rootRight = rr.right - off.x;
    const rootMidY = rr.top + rr.height / 2 - off.y;

    pageNodeRefs.current.forEach((el, pIdx) => {
      const pr = el.getBoundingClientRect();
      const pLeft = pr.left - off.x;
      const pMidY = pr.top + pr.height / 2 - off.y;
      const pRight = pr.right - off.x;
      const eX = rootRight + (pLeft - rootRight) / 2;
      lines.push({ x1: rootRight, y1: rootMidY, x2: eX, y2: rootMidY });
      lines.push({ x1: eX, y1: rootMidY, x2: eX, y2: pMidY });
      lines.push({ x1: eX, y1: pMidY, x2: pLeft, y2: pMidY });

      const page = currentSection?.pages[pIdx];
      page?.children?.forEach((child, cIdx) => {
        const ce = childNodeRefs.current.get(`${pIdx}-${cIdx}`);
        if (!ce) return;
        const ccr = ce.getBoundingClientRect();
        const cLeft = ccr.left - off.x;
        const cMidY = ccr.top + ccr.height / 2 - off.y;
        const cRight = ccr.right - off.x;
        const ceX = pRight + (cLeft - pRight) / 2;
        lines.push({ x1: pRight, y1: pMidY, x2: ceX, y2: pMidY });
        lines.push({ x1: ceX, y1: pMidY, x2: ceX, y2: cMidY });
        lines.push({ x1: ceX, y1: cMidY, x2: cLeft, y2: cMidY });

        // child → tabs
        child.tabs?.forEach((_, tIdx) => {
          const te = tabNodeRefs.current.get(`${pIdx}-${cIdx}-${tIdx}`);
          if (!te) return;
          const tr = te.getBoundingClientRect();
          const tLeft = tr.left - off.x;
          const tMidY = tr.top + tr.height / 2 - off.y;
          const teX = cRight + (tLeft - cRight) / 2;
          lines.push({ x1: cRight, y1: cMidY, x2: teX, y2: cMidY });
          lines.push({ x1: teX, y1: cMidY, x2: teX, y2: tMidY });
          lines.push({ x1: teX, y1: tMidY, x2: tLeft, y2: tMidY });
        });
      });
    });

    setConnectorLines(lines);
  }, [currentSection]);

  useEffect(() => {
    const t = setTimeout(recalcConnectors, 60);
    return () => clearTimeout(t);
  }, [sections, activeSectionIdx, recalcConnectors]);

  useEffect(() => {
    window.addEventListener('resize', recalcConnectors);
    return () => window.removeEventListener('resize', recalcConnectors);
  }, [recalcConnectors]);

  // ── Save ──

  const saveSitemap = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    const payload: any = {
      name: name.trim(),
      lead_id: selectedLeadId && selectedLeadId !== 'none' ? selectedLeadId : null,
      sections,
    };
    if (payload.lead_id) {
      const { data: bf } = await supabase.from('build_flows').select('id').eq('lead_id', payload.lead_id).limit(1).maybeSingle();
      payload.build_flow_id = bf?.id || null;
    }
    if (isNew) {
      const { data, error } = await supabase.from('project_sitemaps').insert(payload).select('id').single();
      if (error) { toast.error('Failed to create'); setSaving(false); return; }
      toast.success('Sitemap created');
      navigate(`/admin/sitemaps/${data.id}`, { replace: true });
    } else {
      const { error } = await supabase.from('project_sitemaps').update(payload).eq('id', id!);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
      toast.success('Sitemap saved');
    }
    setSaving(false);
  };

  // ── Import from Discovery ──

  const importFromDiscovery = async () => {
    if (!selectedLeadId || selectedLeadId === 'none') { toast.error('Select a client first'); return; }
    const { data: bf } = await supabase.from('build_flows').select('id').eq('lead_id', selectedLeadId).limit(1).maybeSingle();
    if (!bf) { toast.error('No build flow found'); return; }
    const { data: answers } = await supabase.from('discovery_answers').select('question_key, answer_value').eq('build_flow_id', bf.id);
    if (!answers?.length) { toast.error('No discovery answers'); return; }

    const ansMap: Record<string, string> = {};
    answers.forEach(a => { ansMap[a.question_key] = a.answer_value; });
    const newSections: SitemapSection[] = [];
    const portals: string[] = safeJsonParse(ansMap['selectedPortals'], []);

    if (portals.includes('front_end')) {
      const core: string[] = safeJsonParse(ansMap['frontEnd.corePages'], []);
      const marketing: string[] = safeJsonParse(ansMap['frontEnd.marketingPages'], []);
      const custom: string[] = safeJsonParse(ansMap['frontEnd.customPages'], []);
      newSections.push({ title: 'Front-End', pages: [...core, ...marketing, ...custom].filter(Boolean).map(p => ({ name: p })) });
    }
    ['admin_portal', 'client_portal', 'staff_portal'].forEach(portal => {
      if (!portals.includes(portal)) return;
      const label = portal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const features: string[] = safeJsonParse(ansMap[`${portal.replace(/_([a-z])/g, (_, c) => c.toUpperCase().replace('_', ''))}.features`] || ansMap[`${portal === 'admin_portal' ? 'adminPortal' : portal === 'client_portal' ? 'clientPortal' : 'staffPortal'}.features`], []);
      newSections.push({ title: label, pages: [{ name: 'Dashboard' }, ...features.map(f => ({ name: f }))] });
    });

    if (!newSections.length) { toast.error('No portals found'); return; }
    setSections(newSections);
    setActiveSectionIdx(0);
    if (!name) {
      const lead = leads.find(l => l.id === selectedLeadId);
      setName(`${lead?.business_name || lead?.name || 'Client'} Sitemap`);
    }
    toast.success(`Imported ${newSections.length} section(s)`);
  };

  // ── Section helpers ──

  const updateSection = (idx: number, title: string) => {
    const next = [...sections];
    next[idx] = { ...next[idx], title };
    setSections(next);
  };

  const addSection = () => {
    setSections([...sections, { title: `Section ${sections.length + 1}`, pages: [] }]);
    setActiveSectionIdx(sections.length);
  };

  const removeSection = (idx: number) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, i) => i !== idx));
    setActiveSectionIdx(Math.max(0, idx - 1));
  };

  // ── Page helpers ──

  const addPage = () => {
    const next = [...sections];
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages: [...next[activeSectionIdx].pages, { name: 'New Page' }] };
    setSections(next);
  };

  const updatePageName = (pIdx: number, val: string) => {
    const next = [...sections];
    const pages = [...next[activeSectionIdx].pages];
    pages[pIdx] = { ...pages[pIdx], name: val };
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages };
    setSections(next);
  };

  const removePage = (pIdx: number) => {
    const next = [...sections];
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages: next[activeSectionIdx].pages.filter((_, i) => i !== pIdx) };
    setSections(next);
  };

  // ── Child helpers ──

  const addChild = (pIdx: number) => {
    const next = [...sections];
    const pages = [...next[activeSectionIdx].pages];
    const existing = pages[pIdx].children || [];
    pages[pIdx] = { ...pages[pIdx], children: [...existing, { name: 'Sub Page' }] };
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages };
    setSections(next);
  };

  const updateChildName = (pIdx: number, cIdx: number, val: string) => {
    const next = [...sections];
    const pages = [...next[activeSectionIdx].pages];
    const children = [...(pages[pIdx].children || [])];
    children[cIdx] = { ...children[cIdx], name: val };
    pages[pIdx] = { ...pages[pIdx], children };
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages };
    setSections(next);
  };

  const removeChild = (pIdx: number, cIdx: number) => {
    const next = [...sections];
    const pages = [...next[activeSectionIdx].pages];
    const children = (pages[pIdx].children || []).filter((_, i) => i !== cIdx);
    pages[pIdx] = { ...pages[pIdx], children: children.length ? children : undefined };
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages };
    setSections(next);
  };

  // ── Tab helpers ──

  const addTab = (pIdx: number, cIdx: number) => {
    const next = [...sections];
    const pages = [...next[activeSectionIdx].pages];
    const children = [...(pages[pIdx].children || [])];
    const existing = children[cIdx].tabs || [];
    children[cIdx] = { ...children[cIdx], tabs: [...existing, { name: 'New Tab' }] };
    pages[pIdx] = { ...pages[pIdx], children };
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages };
    setSections(next);
  };

  const updateTabName = (pIdx: number, cIdx: number, tIdx: number, val: string) => {
    const next = [...sections];
    const pages = [...next[activeSectionIdx].pages];
    const children = [...(pages[pIdx].children || [])];
    const tabs = [...(children[cIdx].tabs || [])];
    tabs[tIdx] = { name: val };
    children[cIdx] = { ...children[cIdx], tabs };
    pages[pIdx] = { ...pages[pIdx], children };
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages };
    setSections(next);
  };

  const removeTab = (pIdx: number, cIdx: number, tIdx: number) => {
    const next = [...sections];
    const pages = [...next[activeSectionIdx].pages];
    const children = [...(pages[pIdx].children || [])];
    const tabs = (children[cIdx].tabs || []).filter((_, i) => i !== tIdx);
    children[cIdx] = { ...children[cIdx], tabs: tabs.length ? tabs : undefined };
    pages[pIdx] = { ...pages[pIdx], children };
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages };
    setSections(next);
  };

  // ── Pointer-based Drag & Drop (smooth "lift" feel) ──

  const dragCloneRef = useRef<HTMLDivElement | null>(null);
  const dragSourceRef = useRef<HTMLElement | null>(null);
  const pointerOffsetRef = useRef({ x: 0, y: 0 });

  const startDrag = useCallback((item: NonNullable<DragItem>, e: React.PointerEvent) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    pointerOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // Create floating clone
    const clone = el.cloneNode(true) as HTMLDivElement;
    clone.style.position = 'fixed';
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.9';
    clone.style.boxShadow = '0 12px 28px rgba(0,0,0,0.35)';
    clone.style.transform = 'scale(1.04)';
    clone.style.transition = 'box-shadow 0.15s, transform 0.15s';
    clone.style.borderRadius = '8px';
    document.body.appendChild(clone);
    dragCloneRef.current = clone;
    dragSourceRef.current = el;

    el.style.opacity = '0.25';
    el.style.transform = 'scale(0.95)';

    setDragItem(item);
    setDropTarget(null);

    const onPointerMove = (ev: PointerEvent) => {
      if (dragCloneRef.current) {
        dragCloneRef.current.style.left = `${ev.clientX - pointerOffsetRef.current.x}px`;
        dragCloneRef.current.style.top = `${ev.clientY - pointerOffsetRef.current.y}px`;
      }
      // Hit-test for drop target
      if (dragCloneRef.current) dragCloneRef.current.style.display = 'none';
      const hitEl = document.elementFromPoint(ev.clientX, ev.clientY);
      if (dragCloneRef.current) dragCloneRef.current.style.display = '';

      if (hitEl) {
        const dropEl = hitEl.closest('[data-drop-type]') as HTMLElement | null;
        if (dropEl && dropEl.dataset.dropType === item.type) {
          const newTarget: DropTarget = {
            type: dropEl.dataset.dropType as any,
            index: parseInt(dropEl.dataset.dropIndex || '0'),
            parentPIdx: dropEl.dataset.dropParentP ? parseInt(dropEl.dataset.dropParentP) : undefined,
            parentCIdx: dropEl.dataset.dropParentC ? parseInt(dropEl.dataset.dropParentC) : undefined,
          };
          setDropTarget(prev => {
            if (prev?.index === newTarget.index && prev?.parentPIdx === newTarget.parentPIdx && prev?.parentCIdx === newTarget.parentCIdx) return prev;
            return newTarget;
          });
        } else {
          setDropTarget(null);
        }
      }
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);

      // Clean up clone
      if (dragCloneRef.current) {
        dragCloneRef.current.remove();
        dragCloneRef.current = null;
      }
      if (dragSourceRef.current) {
        dragSourceRef.current.style.opacity = '1';
        dragSourceRef.current.style.transform = '';
        dragSourceRef.current = null;
      }

      // Apply the drop
      setDropTarget(currentTarget => {
        setDragItem(currentDrag => {
          if (currentDrag && currentTarget && currentDrag.type === currentTarget.type) {
            setSections(prev => {
              const next = [...prev];
              const pages = [...next[activeSectionIdx].pages];

              if (currentDrag.type === 'page' && currentDrag.pIdx !== currentTarget.index) {
                const [moved] = pages.splice(currentDrag.pIdx, 1);
                pages.splice(currentTarget.index, 0, moved);
              } else if (currentDrag.type === 'child' && currentDrag.cIdx !== undefined && currentTarget.parentPIdx !== undefined) {
                if (currentDrag.pIdx === currentTarget.parentPIdx && currentDrag.cIdx !== currentTarget.index) {
                  const children = [...(pages[currentDrag.pIdx].children || [])];
                  const [moved] = children.splice(currentDrag.cIdx, 1);
                  children.splice(currentTarget.index, 0, moved);
                  pages[currentDrag.pIdx] = { ...pages[currentDrag.pIdx], children };
                }
              } else if (currentDrag.type === 'tab' && currentDrag.cIdx !== undefined && currentDrag.tIdx !== undefined && currentTarget.parentPIdx !== undefined && currentTarget.parentCIdx !== undefined) {
                if (currentDrag.pIdx === currentTarget.parentPIdx && currentDrag.cIdx === currentTarget.parentCIdx && currentDrag.tIdx !== currentTarget.index) {
                  const children = [...(pages[currentDrag.pIdx].children || [])];
                  const tabs = [...(children[currentDrag.cIdx].tabs || [])];
                  const [moved] = tabs.splice(currentDrag.tIdx, 1);
                  tabs.splice(currentTarget.index, 0, moved);
                  children[currentDrag.cIdx] = { ...children[currentDrag.cIdx], tabs };
                  pages[currentDrag.pIdx] = { ...pages[currentDrag.pIdx], children };
                }
              }

              next[activeSectionIdx] = { ...next[activeSectionIdx], pages };
              return next;
            });
          }
          return null;
        });
        return null;
      });
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }, [activeSectionIdx]);

  // ── Download ──

  const handleDownload = () => {
    generateSitemapPDF({
      id: id || '', lead_id: selectedLeadId || null, build_flow_id: null,
      name: name || 'Sitemap', sections, created_at: '', updated_at: '',
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isDropping = (type: string, index: number, parentPIdx?: number, parentCIdx?: number) =>
    dropTarget?.type === type && dropTarget.index === index &&
    dropTarget.parentPIdx === parentPIdx && dropTarget.parentCIdx === parentCIdx;

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-50">
      {/* ── Top Toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/sitemaps')} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Sitemap name…"
          className="max-w-[200px] font-semibold text-sm h-8"
        />

        <Select value={selectedLeadId || 'none'} onValueChange={v => setSelectedLeadId(v === 'none' ? '' : v)}>
          <SelectTrigger className="w-[170px] h-8 text-sm">
            <SelectValue placeholder="Link client…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No client</SelectItem>
            {leads.map(l => (
              <SelectItem key={l.id} value={l.id}>{l.business_name || l.name || l.id.slice(0, 8)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedLeadId && selectedLeadId !== 'none' && (
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={importFromDiscovery}>
            <Import className="h-3.5 w-3.5 mr-1" />Import
          </Button>
        )}

        <div className="flex-1" />

        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleDownload} disabled={!sections.some(s => s.pages.length)}>
          <Download className="h-3.5 w-3.5 mr-1" />PDF
        </Button>
        <Button size="sm" className="h-8 text-xs" onClick={saveSitemap} disabled={saving}>
          <Save className="h-3.5 w-3.5 mr-1" />{saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Left Sidebar (Sections) ── */}
        <div className="w-52 shrink-0 border-r border-border bg-card overflow-y-auto p-3 space-y-1.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sections</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addSection}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {sections.map((s, sIdx) => (
            <div
              key={sIdx}
              className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                sIdx === activeSectionIdx
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
              onClick={() => setActiveSectionIdx(sIdx)}
            >
              <Layers className="h-3 w-3 shrink-0 opacity-60" />
              {editingNode?.type === 'section' && editingNode.sIdx === sIdx ? (
                <Input
                  autoFocus
                  value={s.title}
                  onChange={e => updateSection(sIdx, e.target.value)}
                  onBlur={() => setEditingNode(null)}
                  onKeyDown={e => e.key === 'Enter' && setEditingNode(null)}
                  className="h-5 text-[11px] px-1 bg-transparent border-none"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 truncate" onDoubleClick={e => { e.stopPropagation(); setEditingNode({ type: 'section', sIdx }); }}>
                  {s.title}
                </span>
              )}
              <Badge variant="secondary" className="text-[9px] h-4 min-w-[16px] justify-center px-1">
                {s.pages.length}
              </Badge>
              {sections.length > 1 && (
                <button className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); removeSection(sIdx); }}>
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ── Main Canvas ── */}
        <div className="flex-1 overflow-auto bg-muted/20 relative" ref={canvasRef}>
          {/* SVG Connectors */}
          <svg className="absolute inset-0 pointer-events-none z-0" style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%' }}>
            {connectorLines.map((l, i) => (
              <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="hsl(var(--border))" strokeWidth="1.5" strokeLinecap="round" />
            ))}
          </svg>

          <div className="relative z-10 flex items-start gap-20 p-10 min-h-full" style={{ minWidth: 'max-content' }}>
            {/* Root Node */}
            <div className="flex items-center" style={{ minHeight: `${Math.max(currentSection.pages.length * 56, 100)}px` }}>
              <div ref={rootNodeRef} className="bg-foreground text-background px-5 py-3 rounded-xl font-bold text-sm shadow-lg select-none whitespace-nowrap">
                {currentSection.title}
              </div>
            </div>

            {/* Page Nodes Column */}
            <div className="flex flex-col gap-2 justify-center" style={{ minHeight: `${Math.max(currentSection.pages.length * 56, 100)}px` }}>
              {currentSection.pages.map((page, pIdx) => (
                <div key={pIdx}>
                  {/* Drop indicator */}
                  {isDropping('page', pIdx) && <div className="h-1 bg-primary rounded-full mb-1 mx-2 transition-all" />}
                  <div
                    ref={el => { if (el) pageNodeRefs.current.set(pIdx, el); else pageNodeRefs.current.delete(pIdx); }}
                    data-drop-type="page"
                    data-drop-index={pIdx}
                    onPointerDown={e => { if ((e.target as HTMLElement).closest('button, input')) return; startDrag({ type: 'page', pIdx }, e); }}
                    className={`group flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-md cursor-grab active:cursor-grabbing transition-all hover:shadow-lg select-none text-sm touch-none ${
                      dragItem?.type === 'page' && dragItem.pIdx === pIdx ? 'opacity-25 scale-95' : ''
                    }`}
                  >
                    <GripVertical className="h-3 w-3 opacity-40 shrink-0" />
                    {editingNode?.type === 'page' && editingNode.pIdx === pIdx ? (
                      <Input
                        autoFocus value={page.name}
                        onChange={e => updatePageName(pIdx, e.target.value)}
                        onBlur={() => setEditingNode(null)}
                        onKeyDown={e => e.key === 'Enter' && setEditingNode(null)}
                        className="h-5 text-xs px-1 bg-transparent border-none text-primary-foreground w-24"
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span className="font-medium whitespace-nowrap text-xs" onDoubleClick={() => setEditingNode({ type: 'page', sIdx: activeSectionIdx, pIdx })}>
                        {page.name}
                      </span>
                    )}
                    <button className="opacity-0 group-hover:opacity-100 ml-auto hover:bg-primary-foreground/20 rounded p-0.5" onClick={() => addChild(pIdx)} title="Add sub-page">
                      <Plus className="h-3 w-3" />
                    </button>
                    <button className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded p-0.5" onClick={() => removePage(pIdx)}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addPage} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg px-3 py-1.5 transition-colors">
                <Plus className="h-3 w-3" /> Add Page
              </button>
            </div>

            {/* Child (Sub-page) Nodes Column */}
            {currentSection.pages.some(p => p.children?.length) && (
              <div className="flex flex-col gap-2 justify-center" style={{ minHeight: `${Math.max(currentSection.pages.length * 56, 100)}px` }}>
                {currentSection.pages.map((page, pIdx) => (
                  <div key={pIdx} className="space-y-1.5">
                    {page.children?.map((child, cIdx) => (
                      <div key={cIdx}>
                        {isDropping('child', cIdx, pIdx) && <div className="h-0.5 bg-primary rounded-full mb-1 mx-2" />}
                        <div
                          ref={el => { const k = `${pIdx}-${cIdx}`; if (el) childNodeRefs.current.set(k, el); else childNodeRefs.current.delete(k); }}
                          draggable
                          onDragStart={e => handleDragStart({ type: 'child', pIdx, cIdx }, e)}
                          onDragOver={e => handleDragOver({ type: 'child', index: cIdx, parentPIdx: pIdx }, e)}
                          onDrop={e => handleDrop({ type: 'child', index: cIdx, parentPIdx: pIdx }, e)}
                          onDragLeave={handleDragLeave}
                          onDragEnd={handleDragEnd}
                          className={`group flex items-center gap-1.5 bg-card border border-border px-2.5 py-1.5 rounded-lg shadow-sm text-xs select-none cursor-grab active:cursor-grabbing ${
                            dragItem?.type === 'child' && dragItem.pIdx === pIdx && dragItem.cIdx === cIdx ? 'opacity-40 scale-95' : ''
                          }`}
                        >
                          <GripVertical className="h-3 w-3 opacity-30 shrink-0" />
                          {editingNode?.type === 'child' && editingNode.pIdx === pIdx && editingNode.cIdx === cIdx ? (
                            <Input
                              autoFocus value={child.name}
                              onChange={e => updateChildName(pIdx, cIdx, e.target.value)}
                              onBlur={() => setEditingNode(null)}
                              onKeyDown={e => e.key === 'Enter' && setEditingNode(null)}
                              className="h-5 text-[11px] px-1 bg-transparent border-none w-20"
                            />
                          ) : (
                            <span className="text-muted-foreground whitespace-nowrap" onDoubleClick={() => setEditingNode({ type: 'child', sIdx: activeSectionIdx, pIdx, cIdx })}>
                              {child.name}
                            </span>
                          )}
                          <button className="opacity-0 group-hover:opacity-100 ml-auto hover:bg-accent rounded p-0.5" onClick={() => addTab(pIdx, cIdx)} title="Add tab">
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                          <button className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded p-0.5" onClick={() => removeChild(pIdx, cIdx)}>
                            <X className="h-2.5 w-2.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Only show "add sub-page" below the last child of a page that has children */}
                  </div>
                ))}
              </div>
            )}

            {/* Tab Nodes Column */}
            {currentSection.pages.some(p => p.children?.some(c => c.tabs?.length)) && (
              <div className="flex flex-col gap-2 justify-center" style={{ minHeight: `${Math.max(currentSection.pages.length * 56, 100)}px` }}>
                {currentSection.pages.map((page, pIdx) => (
                  <div key={pIdx} className="space-y-1">
                    {page.children?.map((child, cIdx) => (
                      <div key={cIdx} className="space-y-1">
                        {child.tabs?.map((tab, tIdx) => (
                          <div key={tIdx}>
                            {isDropping('tab', tIdx, pIdx, cIdx) && <div className="h-0.5 bg-primary rounded-full mb-1 mx-1" />}
                            <div
                              ref={el => { const k = `${pIdx}-${cIdx}-${tIdx}`; if (el) tabNodeRefs.current.set(k, el); else tabNodeRefs.current.delete(k); }}
                              draggable
                              onDragStart={e => handleDragStart({ type: 'tab', pIdx, cIdx, tIdx }, e)}
                              onDragOver={e => handleDragOver({ type: 'tab', index: tIdx, parentPIdx: pIdx, parentCIdx: cIdx }, e)}
                              onDrop={e => handleDrop({ type: 'tab', index: tIdx, parentPIdx: pIdx, parentCIdx: cIdx }, e)}
                              onDragLeave={handleDragLeave}
                              onDragEnd={handleDragEnd}
                              className={`group flex items-center gap-1 bg-muted border border-border/50 px-2 py-1 rounded text-[11px] select-none cursor-grab active:cursor-grabbing ${
                                dragItem?.type === 'tab' && dragItem.pIdx === pIdx && dragItem.cIdx === cIdx && dragItem.tIdx === tIdx ? 'opacity-40 scale-95' : ''
                              }`}
                            >
                              <GripVertical className="h-2.5 w-2.5 opacity-30 shrink-0" />
                              {editingNode?.type === 'tab' && editingNode.pIdx === pIdx && editingNode.cIdx === cIdx && editingNode.tIdx === tIdx ? (
                                <Input
                                  autoFocus value={tab.name}
                                  onChange={e => updateTabName(pIdx, cIdx, tIdx, e.target.value)}
                                  onBlur={() => setEditingNode(null)}
                                  onKeyDown={e => e.key === 'Enter' && setEditingNode(null)}
                                  className="h-4 text-[10px] px-0.5 bg-transparent border-none w-16"
                                />
                              ) : (
                                <span className="text-muted-foreground whitespace-nowrap" onDoubleClick={() => setEditingNode({ type: 'tab', sIdx: activeSectionIdx, pIdx, cIdx, tIdx })}>
                                  {tab.name}
                                </span>
                              )}
                              <button className="opacity-0 group-hover:opacity-100 ml-auto hover:bg-destructive/20 rounded p-0.5" onClick={() => removeTab(pIdx, cIdx, tIdx)}>
                                <X className="h-2 w-2 text-destructive" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
