import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Download, Save, Import, Plus, Trash2, X, GripVertical,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateSitemapPDF } from './AdminSitemaps';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SitemapPage {
  name: string;
  children?: string[];
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

function safeJsonParse<T>(val: string | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
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
  const [editingNode, setEditingNode] = useState<{ type: 'section' | 'page' | 'child'; sIdx: number; pIdx?: number; cIdx?: number } | null>(null);
  const [dragState, setDragState] = useState<{ type: 'page' | 'child'; pIdx: number; cIdx?: number } | null>(null);

  // Canvas refs for SVG connectors
  const canvasRef = useRef<HTMLDivElement>(null);
  const rootNodeRef = useRef<HTMLDivElement>(null);
  const pageNodeRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const childNodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connectorLines, setConnectorLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string }[]>([]);

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
    setSections(s.length ? s : [{ title: 'Front-End', pages: [] }]);
    setLoading(false);
  }, [id, isNew, navigate]);

  useEffect(() => { fetchLeads(); fetchSitemap(); }, [fetchLeads, fetchSitemap]);

  // ── Connector lines ──

  const currentSection = sections[activeSectionIdx] || sections[0];

  const recalcConnectors = useCallback(() => {
    if (!canvasRef.current || !rootNodeRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const lines: typeof connectorLines = [];

    const rootRect = rootNodeRef.current.getBoundingClientRect();
    const rootRight = rootRect.right - canvasRect.left;
    const rootMidY = rootRect.top + rootRect.height / 2 - canvasRect.top;

    pageNodeRefs.current.forEach((el, pIdx) => {
      const pRect = el.getBoundingClientRect();
      const pLeft = pRect.left - canvasRect.left;
      const pMidY = pRect.top + pRect.height / 2 - canvasRect.top;
      const pRight = pRect.right - canvasRect.left;

      // root → page elbow
      const elbowX = rootRight + (pLeft - rootRight) / 2;
      lines.push({ x1: rootRight, y1: rootMidY, x2: elbowX, y2: rootMidY, color: 'var(--border)' });
      lines.push({ x1: elbowX, y1: rootMidY, x2: elbowX, y2: pMidY, color: 'var(--border)' });
      lines.push({ x1: elbowX, y1: pMidY, x2: pLeft, y2: pMidY, color: 'var(--border)' });

      // page → children
      const page = currentSection?.pages[pIdx];
      if (page?.children?.length) {
        page.children.forEach((_, cIdx) => {
          const childEl = childNodeRefs.current.get(`${pIdx}-${cIdx}`);
          if (!childEl) return;
          const cRect = childEl.getBoundingClientRect();
          const cLeft = cRect.left - canvasRect.left;
          const cMidY = cRect.top + cRect.height / 2 - canvasRect.top;
          const childElbowX = pRight + (cLeft - pRight) / 2;
          lines.push({ x1: pRight, y1: pMidY, x2: childElbowX, y2: pMidY, color: 'var(--muted-foreground)' });
          lines.push({ x1: childElbowX, y1: pMidY, x2: childElbowX, y2: cMidY, color: 'var(--muted-foreground)' });
          lines.push({ x1: childElbowX, y1: cMidY, x2: cLeft, y2: cMidY, color: 'var(--muted-foreground)' });
        });
      }
    });

    setConnectorLines(lines);
  }, [currentSection]);

  useEffect(() => {
    const t = setTimeout(recalcConnectors, 50);
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
    if (portals.includes('admin_portal')) {
      const features: string[] = safeJsonParse(ansMap['adminPortal.features'], []);
      newSections.push({ title: 'Admin Portal', pages: [{ name: 'Dashboard' }, ...features.map(f => ({ name: f }))] });
    }
    if (portals.includes('client_portal')) {
      const features: string[] = safeJsonParse(ansMap['clientPortal.features'], []);
      newSections.push({ title: 'Client Portal', pages: [{ name: 'Dashboard' }, ...features.map(f => ({ name: f }))] });
    }
    if (portals.includes('staff_portal')) {
      const features: string[] = safeJsonParse(ansMap['staffPortal.features'], []);
      newSections.push({ title: 'Staff Portal', pages: [{ name: 'Dashboard' }, ...features.map(f => ({ name: f }))] });
    }

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

  const addSection = () => {
    const idx = sections.length;
    setSections([...sections, { title: `Section ${idx + 1}`, pages: [] }]);
    setActiveSectionIdx(idx);
  };

  const removeSection = (idx: number) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, i) => i !== idx));
    setActiveSectionIdx(Math.max(0, idx - 1));
  };

  const updateSectionTitle = (idx: number, title: string) => {
    const next = [...sections];
    next[idx] = { ...next[idx], title };
    setSections(next);
  };

  // ── Page helpers ──

  const addPage = () => {
    const next = [...sections];
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages: [...next[activeSectionIdx].pages, { name: 'New Page' }] };
    setSections(next);
  };

  const updatePageName = (pIdx: number, newName: string) => {
    const next = [...sections];
    const pages = [...next[activeSectionIdx].pages];
    pages[pIdx] = { ...pages[pIdx], name: newName };
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages };
    setSections(next);
  };

  const removePage = (pIdx: number) => {
    const next = [...sections];
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages: next[activeSectionIdx].pages.filter((_, i) => i !== pIdx) };
    setSections(next);
  };

  const addChild = (pIdx: number) => {
    const next = [...sections];
    const pages = [...next[activeSectionIdx].pages];
    pages[pIdx] = { ...pages[pIdx], children: [...(pages[pIdx].children || []), 'Sub Page'] };
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages };
    setSections(next);
  };

  const updateChild = (pIdx: number, cIdx: number, value: string) => {
    const next = [...sections];
    const pages = [...next[activeSectionIdx].pages];
    const children = [...(pages[pIdx].children || [])];
    children[cIdx] = value;
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

  // ── Drag & Drop (page reorder) ──

  const handlePageDragStart = (pIdx: number) => {
    setDragState({ type: 'page', pIdx });
  };

  const handlePageDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (!dragState || dragState.type !== 'page' || dragState.pIdx === targetIdx) return;
  };

  const handlePageDrop = (targetIdx: number) => {
    if (!dragState || dragState.type !== 'page') return;
    const next = [...sections];
    const pages = [...next[activeSectionIdx].pages];
    const [moved] = pages.splice(dragState.pIdx, 1);
    pages.splice(targetIdx, 0, moved);
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages };
    setSections(next);
    setDragState(null);
  };

  // ── Download ──

  const handleDownload = () => {
    generateSitemapPDF({
      id: id || '',
      lead_id: selectedLeadId || null,
      build_flow_id: null,
      name: name || 'Sitemap',
      sections,
      created_at: '',
      updated_at: '',
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex flex-col h-full -m-6 lg:-m-8">
      {/* ── Top Toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/sitemaps')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Sitemap name…"
          className="max-w-[220px] font-semibold"
        />

        <Select value={selectedLeadId || 'none'} onValueChange={v => setSelectedLeadId(v === 'none' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
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
          <Button variant="outline" size="sm" onClick={importFromDiscovery}>
            <Import className="h-4 w-4 mr-1" />Import
          </Button>
        )}

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={handleDownload} disabled={!sections.some(s => s.pages.length)}>
          <Download className="h-4 w-4 mr-1" />PDF
        </Button>
        <Button size="sm" onClick={saveSitemap} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />{saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Left Sidebar (Sections) ── */}
        <div className="w-56 shrink-0 border-r border-border bg-card overflow-y-auto p-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sections</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addSection}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {sections.map((s, sIdx) => (
            <div
              key={sIdx}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                sIdx === activeSectionIdx
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
              onClick={() => setActiveSectionIdx(sIdx)}
            >
              {editingNode?.type === 'section' && editingNode.sIdx === sIdx ? (
                <Input
                  autoFocus
                  value={s.title}
                  onChange={e => updateSectionTitle(sIdx, e.target.value)}
                  onBlur={() => setEditingNode(null)}
                  onKeyDown={e => e.key === 'Enter' && setEditingNode(null)}
                  className="h-6 text-xs px-1 bg-transparent border-none"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span
                  className="flex-1 truncate"
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingNode({ type: 'section', sIdx }); }}
                >
                  {s.title}
                </span>
              )}
              <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center">
                {s.pages.length}
              </Badge>
              {sections.length > 1 && (
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); removeSection(sIdx); }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ── Main Canvas ── */}
        <div className="flex-1 overflow-auto bg-muted/30 relative" ref={canvasRef}>
          {/* SVG Connectors */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ minHeight: '100%', minWidth: '100%' }}>
            {connectorLines.map((line, i) => (
              <line
                key={i}
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke="hsl(var(--border))"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}
          </svg>

          <div className="relative z-10 flex items-start gap-16 p-8 min-h-full" style={{ minWidth: 'max-content' }}>
            {/* Root Node */}
            <div className="flex items-center" style={{ minHeight: `${Math.max(currentSection.pages.length * 60, 120)}px` }}>
              <div
                ref={rootNodeRef}
                className="bg-foreground text-background px-6 py-3 rounded-xl font-bold text-sm shadow-lg select-none whitespace-nowrap"
              >
                {currentSection.title}
              </div>
            </div>

            {/* Page Nodes Column */}
            <div className="flex flex-col gap-3 justify-center" style={{ minHeight: `${Math.max(currentSection.pages.length * 60, 120)}px` }}>
              {currentSection.pages.map((page, pIdx) => (
                <div
                  key={pIdx}
                  ref={el => { if (el) pageNodeRefs.current.set(pIdx, el); else pageNodeRefs.current.delete(pIdx); }}
                  draggable
                  onDragStart={() => handlePageDragStart(pIdx)}
                  onDragOver={(e) => handlePageDragOver(e, pIdx)}
                  onDrop={() => handlePageDrop(pIdx)}
                  onDragEnd={() => setDragState(null)}
                  className={`group flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg shadow-md cursor-grab active:cursor-grabbing transition-all hover:shadow-lg select-none ${
                    dragState?.type === 'page' && dragState.pIdx === pIdx ? 'opacity-50' : ''
                  }`}
                >
                  <GripVertical className="h-3.5 w-3.5 opacity-40 shrink-0" />

                  {editingNode?.type === 'page' && editingNode.pIdx === pIdx ? (
                    <Input
                      autoFocus
                      value={page.name}
                      onChange={e => updatePageName(pIdx, e.target.value)}
                      onBlur={() => setEditingNode(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditingNode(null)}
                      className="h-6 text-xs px-1 bg-transparent border-none text-primary-foreground w-28"
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="text-sm font-medium whitespace-nowrap"
                      onDoubleClick={() => setEditingNode({ type: 'page', sIdx: activeSectionIdx, pIdx })}
                    >
                      {page.name}
                    </span>
                  )}

                  <button
                    className="opacity-0 group-hover:opacity-100 ml-1 hover:bg-primary-foreground/20 rounded p-0.5 transition-opacity"
                    onClick={() => addChild(pIdx)}
                    title="Add sub-page"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded p-0.5 transition-opacity"
                    onClick={() => removePage(pIdx)}
                    title="Delete page"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <button
                onClick={addPage}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg px-4 py-2 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add Page
              </button>
            </div>

            {/* Child Nodes Column */}
            {currentSection.pages.some(p => p.children?.length) && (
              <div className="flex flex-col gap-3 justify-center" style={{ minHeight: `${Math.max(currentSection.pages.length * 60, 120)}px` }}>
                {currentSection.pages.map((page, pIdx) => (
                  <div key={pIdx} className="space-y-2">
                    {page.children?.map((child, cIdx) => (
                      <div
                        key={cIdx}
                        ref={el => { const key = `${pIdx}-${cIdx}`; if (el) childNodeRefs.current.set(key, el); else childNodeRefs.current.delete(key); }}
                        className="group flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-lg shadow-sm text-sm select-none"
                      >
                        {editingNode?.type === 'child' && editingNode.pIdx === pIdx && editingNode.cIdx === cIdx ? (
                          <Input
                            autoFocus
                            value={child}
                            onChange={e => updateChild(pIdx, cIdx, e.target.value)}
                            onBlur={() => setEditingNode(null)}
                            onKeyDown={e => e.key === 'Enter' && setEditingNode(null)}
                            className="h-5 text-xs px-1 bg-transparent border-none w-24"
                          />
                        ) : (
                          <span
                            className="text-muted-foreground whitespace-nowrap"
                            onDoubleClick={() => setEditingNode({ type: 'child', sIdx: activeSectionIdx, pIdx, cIdx })}
                          >
                            {child}
                          </span>
                        )}
                        <button
                          className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded p-0.5 transition-opacity"
                          onClick={() => removeChild(pIdx, cIdx)}
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </button>
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
