import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// Using native checkbox to avoid radix-ui dep issues
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Download, Plus, Trash2, X, GripVertical, Layers, Undo2, Redo2, Link2,
  FileText, PanelTop, LayoutGrid, StickyNote, Loader2, Sparkles,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateSitemapPDF } from '@/lib/sitemap-pdf';

// ─── Types ─────────────────────────────────────────────────────────────────────

type NodeType = 'page' | 'popup' | 'tab' | 'note';

interface SitemapTab {
  name: string;
  nodeType?: NodeType;
  tabs?: SitemapTab[];
}

interface SitemapChild {
  name: string;
  nodeType?: NodeType;
  tabs?: SitemapTab[];
  linkedFrom?: number[];
}

interface SitemapPage {
  name: string;
  nodeType?: NodeType;
  children?: SitemapChild[];
}

interface SitemapSection {
  title: string;
  pages: SitemapPage[];
}

// ─── Shared UI helpers ─────────────────────────────────────────────────────────

const NODE_TYPE_OPTIONS: { type: NodeType; label: string; icon: typeof FileText; desc: string }[] = [
  { type: 'page', label: 'Page', icon: FileText, desc: 'A standard page' },
  { type: 'popup', label: 'Pop-Up', icon: PanelTop, desc: 'A modal / overlay' },
  { type: 'tab', label: 'Tab', icon: LayoutGrid, desc: 'A tab within a page' },
  { type: 'note', label: 'Note', icon: StickyNote, desc: 'A descriptive note' },
];

function AddNodePopover({ onAdd, size = 'sm' }: { onAdd: (type: NodeType) => void; size?: 'sm' | 'xs' }) {
  const [open, setOpen] = useState(false);
  const iconSize = size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3';
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={`${size === 'xs' ? 'opacity-0 group-hover:opacity-100' : ''} hover:bg-accent rounded p-0.5 transition-opacity`} title="Add node">
          <Plus className={iconSize} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1.5" side="right" align="start">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1.5">Add</p>
        {NODE_TYPE_OPTIONS.map(opt => (
          <button key={opt.type} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-muted text-xs text-left transition-colors" onClick={() => { onAdd(opt.type); setOpen(false); }}>
            <opt.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <span className="font-medium">{opt.label}</span>
              <p className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</p>
            </div>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function NodeTypeIcon({ nodeType, onChangeType }: { nodeType?: NodeType; onChangeType?: (type: NodeType) => void }) {
  const currentType = nodeType || 'page';
  const Icon = currentType === 'popup' ? PanelTop : currentType === 'tab' ? LayoutGrid : currentType === 'note' ? StickyNote : FileText;
  if (!onChangeType) return <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" />;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="shrink-0 opacity-60 hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-white/20" title="Change node type">
          <Icon className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1.5" side="bottom" align="start">
        {NODE_TYPE_OPTIONS.map(opt => (
          <button key={opt.type} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-muted text-xs text-left transition-colors ${currentType === opt.type ? 'bg-muted font-medium' : ''}`} onClick={() => onChangeType(opt.type)}>
            <opt.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {opt.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ─── Colors ────────────────────────────────────────────────────────────────────

const PAGE_COLORS = [
  'hsl(221, 83%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(142, 71%, 45%)', 'hsl(25, 95%, 53%)',
  'hsl(346, 77%, 50%)', 'hsl(187, 85%, 43%)', 'hsl(45, 93%, 47%)', 'hsl(316, 72%, 51%)',
];

const CHILD_NODE_COLORS = [
  'hsl(346, 77%, 50%)', 'hsl(187, 85%, 43%)', 'hsl(45, 93%, 47%)', 'hsl(262, 83%, 58%)',
  'hsl(142, 71%, 45%)', 'hsl(25, 95%, 53%)', 'hsl(316, 72%, 51%)', 'hsl(221, 83%, 53%)',
  'hsl(0, 84%, 60%)', 'hsl(168, 76%, 42%)', 'hsl(350, 80%, 72%)', 'hsl(190, 70%, 65%)',
  'hsl(50, 85%, 65%)', 'hsl(270, 70%, 72%)', 'hsl(150, 60%, 62%)', 'hsl(30, 80%, 68%)',
  'hsl(320, 65%, 70%)', 'hsl(215, 75%, 68%)', 'hsl(5, 75%, 70%)', 'hsl(160, 55%, 60%)',
];

function getChildNodeStyles(nodeType?: NodeType, colorIndex?: number): { className: string; style: React.CSSProperties } {
  const type = nodeType || 'page';
  const color = CHILD_NODE_COLORS[(colorIndex ?? 0) % CHILD_NODE_COLORS.length];
  switch (type) {
    case 'page': return { className: 'font-medium', style: { backgroundColor: color, borderColor: 'transparent', borderWidth: '2px', borderStyle: 'solid', color: '#ffffff' } };
    case 'popup': return { className: 'text-slate-700', style: { backgroundColor: '#d1d5db', borderColor: color, borderWidth: '2px', borderStyle: 'dotted' } };
    case 'tab': return { className: 'text-slate-700', style: { backgroundColor: '#d1d5db', borderColor: color, borderWidth: '1px', borderStyle: 'solid' } };
    case 'note': return { className: 'text-slate-600 italic', style: { backgroundColor: '#e5e7eb', borderColor: 'transparent', borderWidth: '0px', borderStyle: 'none' } };
    default: return { className: 'text-muted-foreground', style: { backgroundColor: 'hsl(var(--card))', borderColor: color, borderWidth: '2px', borderStyle: 'solid' } };
  }
}

// ─── Types for editing/dragging ────────────────────────────────────────────────

type EditingNode = { type: 'section' | 'page' | 'child' | 'tab'; sIdx: number; pIdx?: number; cIdx?: number; tIdx?: number; tPath?: number[] } | null;
type DragItem = { type: 'page' | 'child' | 'tab'; sIdx: number; pIdx: number; cIdx?: number; tIdx?: number } | null;
type DropTarget = { type: 'page' | 'child' | 'tab'; index: number; parentPIdx?: number; parentCIdx?: number } | null;

// ─── Recursive Tab Nodes ───────────────────────────────────────────────────────

const MAX_TAB_DEPTH = 3;

function TabNodes({ tabs, pIdx, cIdx, parentPath, depth, pageColor, tabNodeRefs, editingNode, setEditingNode, activeSectionIdx, updateTabName, removeTab, addTab, changeTabType, dragItem, startDrag, isDropping }: {
  tabs: SitemapTab[]; pIdx: number; cIdx: number; parentPath: number[]; depth: number; pageColor: string;
  tabNodeRefs: React.MutableRefObject<Map<string, HTMLDivElement>>; editingNode: EditingNode; setEditingNode: (n: EditingNode) => void;
  activeSectionIdx: number; updateTabName: (p: number, c: number, t: number[], v: string) => void; removeTab: (p: number, c: number, t: number[]) => void;
  addTab: (p: number, c: number, pp?: number[], nt?: NodeType) => void; changeTabType: (p: number, c: number, t: number[], nt: NodeType) => void;
  dragItem: DragItem; startDrag: (item: NonNullable<DragItem>, e: React.PointerEvent) => void; isDropping: (type: string, index: number, pp?: number, pc?: number) => boolean;
}) {
  const depthFontSize = depth === 1 ? 'text-[11px]' : depth === 2 ? 'text-[10px]' : 'text-[9px]';
  const depthOpacity = Math.max(0.2, 0.5 - (depth - 1) * 0.12);
  return (
    <div className="flex flex-col gap-1">
      {tabs.map((tab, tIdx) => {
        const currentPath = [...parentPath, tIdx];
        const refKey = `${pIdx}-${cIdx}-${currentPath.join('-')}`;
        const matchesEditing = editingNode?.type === 'tab' && editingNode.pIdx === pIdx && editingNode.cIdx === cIdx &&
          editingNode.tPath && editingNode.tPath.length === currentPath.length && editingNode.tPath.every((v, i) => v === currentPath[i]);
        return (
          <div key={tIdx} className="flex items-start gap-8">
            <div>
              {depth === 1 && isDropping('tab', tIdx, pIdx, cIdx) && <div className="h-1 rounded-full mb-1 mx-1 transition-all" style={{ backgroundColor: pageColor, opacity: 0.3 }} />}
              <div
                ref={el => { if (el) tabNodeRefs.current.set(refKey, el); else tabNodeRefs.current.delete(refKey); }}
                data-drop-type={depth === 1 ? 'tab' : undefined} data-drop-index={depth === 1 ? tIdx : undefined}
                data-drop-parent-p={depth === 1 ? pIdx : undefined} data-drop-parent-c={depth === 1 ? cIdx : undefined}
                onPointerDown={depth === 1 ? (e => { if ((e.target as HTMLElement).closest('button, input')) return; startDrag({ type: 'tab', sIdx: activeSectionIdx, pIdx, cIdx, tIdx }, e); }) : undefined}
                className={`group flex items-center gap-1 px-2 py-1 rounded ${depthFontSize} select-none ${depth === 1 ? 'cursor-grab active:cursor-grabbing touch-none' : ''} ${
                  depth === 1 && dragItem?.type === 'tab' && dragItem.pIdx === pIdx && dragItem.cIdx === cIdx && dragItem.tIdx === tIdx ? 'opacity-25 scale-95' : ''
                } ${getChildNodeStyles(tab.nodeType, pIdx * 100 + cIdx * 10 + tIdx).className}`}
                style={{ ...getChildNodeStyles(tab.nodeType, pIdx * 100 + cIdx * 10 + tIdx).style, opacity: depth > 1 ? 0.85 : 1 }}
              >
                {depth === 1 && <GripVertical className="h-2.5 w-2.5 opacity-30 shrink-0" />}
                <div className="rounded-full shrink-0" style={{ width: depth === 1 ? 4 : 3, height: depth === 1 ? 4 : 3, backgroundColor: pageColor, opacity: depthOpacity }} />
                <NodeTypeIcon nodeType={tab.nodeType} onChangeType={(type) => changeTabType(pIdx, cIdx, currentPath, type)} />
                {matchesEditing ? (
                  <Input autoFocus value={tab.name} onChange={e => updateTabName(pIdx, cIdx, currentPath, e.target.value)} onBlur={() => setEditingNode(null)} onKeyDown={e => e.key === 'Enter' && setEditingNode(null)}
                    maxLength={(tab.nodeType || 'tab') === 'note' ? 50 : undefined} className={`h-4 text-[10px] px-0.5 bg-transparent border-none ${(tab.nodeType || 'tab') === 'note' ? 'w-32' : 'w-16'}`} />
                ) : (
                  <span className="whitespace-nowrap" style={{ color: 'inherit' }} onDoubleClick={() => setEditingNode({ type: 'tab', sIdx: activeSectionIdx, pIdx, cIdx, tPath: currentPath })}>{tab.name}</span>
                )}
                {depth < MAX_TAB_DEPTH && <span className="opacity-0 group-hover:opacity-100"><AddNodePopover onAdd={(type) => addTab(pIdx, cIdx, currentPath, type)} size="xs" /></span>}
                <button className="opacity-0 group-hover:opacity-100 ml-auto hover:bg-destructive/20 rounded p-0.5" onClick={() => removeTab(pIdx, cIdx, currentPath)}><X className="h-2 w-2 text-destructive" /></button>
              </div>
            </div>
            {tab.tabs && tab.tabs.length > 0 && depth < MAX_TAB_DEPTH && (
              <TabNodes tabs={tab.tabs} pIdx={pIdx} cIdx={cIdx} parentPath={currentPath} depth={depth + 1} pageColor={pageColor}
                tabNodeRefs={tabNodeRefs} editingNode={editingNode} setEditingNode={setEditingNode} activeSectionIdx={activeSectionIdx}
                updateTabName={updateTabName} removeTab={removeTab} addTab={addTab} changeTabType={changeTabType} dragItem={dragItem} startDrag={startDrag} isDropping={isDropping} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PublicSitemapBuilder() {
  const navigate = useNavigate();
  const [name, setName] = useState('My Website');
  const [sections, setSectionsRaw] = useState<SitemapSection[]>([{ title: 'Front-End', pages: [{ name: 'Home' }] }]);

  // Undo / Redo
  const historyRef = useRef<SitemapSection[][]>([]);
  const futureRef = useRef<SitemapSection[][]>([]);
  const skipHistoryRef = useRef(false);

  const setSections: typeof setSectionsRaw = useCallback((val) => {
    setSectionsRaw(prev => {
      const next = typeof val === 'function' ? (val as (p: SitemapSection[]) => SitemapSection[])(prev) : val;
      if (!skipHistoryRef.current) {
        historyRef.current = [...historyRef.current, prev].slice(-5);
        futureRef.current = [];
      }
      skipHistoryRef.current = false;
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (!historyRef.current.length) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setSectionsRaw(cur => { futureRef.current = [...futureRef.current, cur].slice(-5); return prev; });
  }, []);

  const redo = useCallback(() => {
    if (!futureRef.current.length) return;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    setSectionsRaw(cur => { historyRef.current = [...historyRef.current, cur].slice(-5); return next; });
  }, []);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => { setCanUndo(historyRef.current.length > 0); setCanRedo(futureRef.current.length > 0); }, 200);
    return () => clearInterval(interval);
  }, []);

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [editingNode, setEditingNode] = useState<EditingNode>(null);
  const [dragItem, setDragItem] = useState<DragItem>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const rootNodeRef = useRef<HTMLDivElement>(null);
  const pageNodeRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const childNodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tabNodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connectorLines, setConnectorLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string; dashed?: boolean }[]>([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  // Lead capture dialog
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Upsell dialog
  const [showUpsell, setShowUpsell] = useState(false);

  // Scroll to top
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const currentSection = sections[activeSectionIdx] || sections[0];

  // ── Connector lines ──
  const recalcConnectors = useCallback(() => {
    if (!canvasRef.current || !rootNodeRef.current) return;
    const cr = canvasRef.current.getBoundingClientRect();
    const off = { x: cr.left - canvasRef.current.scrollLeft, y: cr.top - canvasRef.current.scrollTop };
    const lines: typeof connectorLines = [];
    const rr = rootNodeRef.current.getBoundingClientRect();
    const rootRight = rr.right - off.x;
    const rootMidY = rr.top + rr.height / 2 - off.y;

    pageNodeRefs.current.forEach((el, pIdx) => {
      const color = PAGE_COLORS[pIdx % PAGE_COLORS.length];
      const pr = el.getBoundingClientRect();
      const pLeft = pr.left - off.x;
      const pMidY = pr.top + pr.height / 2 - off.y;
      const pRight = pr.right - off.x;
      const eX = rootRight + (pLeft - rootRight) / 2;
      lines.push({ x1: rootRight, y1: rootMidY, x2: eX, y2: rootMidY, color });
      lines.push({ x1: eX, y1: rootMidY, x2: eX, y2: pMidY, color });
      lines.push({ x1: eX, y1: pMidY, x2: pLeft, y2: pMidY, color });

      const page = currentSection?.pages[pIdx];
      page?.children?.forEach((child, cIdx) => {
        const ce = childNodeRefs.current.get(`${pIdx}-${cIdx}`);
        if (!ce) return;
        const ccr = ce.getBoundingClientRect();
        const cLeft = ccr.left - off.x;
        const cMidY = ccr.top + ccr.height / 2 - off.y;
        const cRight = ccr.right - off.x;
        const ceX = pRight + (cLeft - pRight) / 2;
        const isShared = child.linkedFrom && child.linkedFrom.length > 0;
        lines.push({ x1: pRight, y1: pMidY, x2: ceX, y2: pMidY, color, dashed: isShared });
        lines.push({ x1: ceX, y1: pMidY, x2: ceX, y2: cMidY, color, dashed: isShared });
        lines.push({ x1: ceX, y1: cMidY, x2: cLeft, y2: cMidY, color, dashed: isShared });

        if (child.linkedFrom?.length) {
          child.linkedFrom.forEach(lpIdx => {
            const lpEl = pageNodeRefs.current.get(lpIdx);
            if (!lpEl) return;
            const lpColor = PAGE_COLORS[lpIdx % PAGE_COLORS.length];
            const lpr = lpEl.getBoundingClientRect();
            const lpRight = lpr.right - off.x;
            const lpMidY = lpr.top + lpr.height / 2 - off.y;
            const lElbowX = lpRight + (cLeft - lpRight) / 2;
            lines.push({ x1: lpRight, y1: lpMidY, x2: lElbowX, y2: lpMidY, color: lpColor, dashed: true });
            lines.push({ x1: lElbowX, y1: lpMidY, x2: lElbowX, y2: cMidY, color: lpColor, dashed: true });
            lines.push({ x1: lElbowX, y1: cMidY, x2: cLeft, y2: cMidY, color: lpColor, dashed: true });
          });
        }

        const drawTabConnectors = (tabs: SitemapTab[], parentRight: number, parentMidY: number, pathPrefix: string) => {
          tabs.forEach((tab, tIdx) => {
            const te = tabNodeRefs.current.get(`${pathPrefix}-${tIdx}`);
            if (!te) return;
            const tr = te.getBoundingClientRect();
            const tLeft = tr.left - off.x;
            const tRight = tr.right - off.x;
            const tMidY = tr.top + tr.height / 2 - off.y;
            const teX = parentRight + (tLeft - parentRight) / 2;
            lines.push({ x1: parentRight, y1: parentMidY, x2: teX, y2: parentMidY, color });
            lines.push({ x1: teX, y1: parentMidY, x2: teX, y2: tMidY, color });
            lines.push({ x1: teX, y1: tMidY, x2: tLeft, y2: tMidY, color });
            if (tab.tabs?.length) drawTabConnectors(tab.tabs, tRight, tMidY, `${pathPrefix}-${tIdx}`);
          });
        };
        if (child.tabs?.length) drawTabConnectors(child.tabs, cRight, cMidY, `${pIdx}-${cIdx}`);
      });
    });

    setConnectorLines(lines);
    setSvgSize({ w: canvasRef.current.scrollWidth, h: canvasRef.current.scrollHeight });
  }, [currentSection]);

  useEffect(() => { const t = setTimeout(recalcConnectors, 60); return () => clearTimeout(t); }, [sections, activeSectionIdx, recalcConnectors]);
  useEffect(() => { window.addEventListener('resize', recalcConnectors); return () => window.removeEventListener('resize', recalcConnectors); }, [recalcConnectors]);

  // ── Section helpers ──
  const updateSection = (idx: number, title: string) => { const next = [...sections]; next[idx] = { ...next[idx], title }; setSections(next); };
  const addSection = () => { setSections([...sections, { title: `Section ${sections.length + 1}`, pages: [] }]); setActiveSectionIdx(sections.length); };
  const removeSection = (idx: number) => { if (sections.length <= 1) return; setSections(sections.filter((_, i) => i !== idx)); setActiveSectionIdx(Math.max(0, idx - 1)); };

  // ── Page helpers ──
  const addPage = (nodeType: NodeType = 'page') => {
    const defaultName = nodeType === 'popup' ? 'New Pop-Up' : nodeType === 'tab' ? 'New Tab' : 'New Page';
    const next = [...sections]; next[activeSectionIdx] = { ...next[activeSectionIdx], pages: [...next[activeSectionIdx].pages, { name: defaultName, nodeType }] }; setSections(next);
  };
  const updatePageName = (pIdx: number, val: string) => { const next = [...sections]; const pages = [...next[activeSectionIdx].pages]; pages[pIdx] = { ...pages[pIdx], name: val }; next[activeSectionIdx] = { ...next[activeSectionIdx], pages }; setSections(next); };
  const removePage = (pIdx: number) => { const next = [...sections]; next[activeSectionIdx] = { ...next[activeSectionIdx], pages: next[activeSectionIdx].pages.filter((_, i) => i !== pIdx) }; setSections(next); };

  // ── Child helpers ──
  const addChild = (pIdx: number, nodeType: NodeType = 'page') => {
    const defaultName = nodeType === 'popup' ? 'New Pop-Up' : nodeType === 'tab' ? 'New Tab' : 'Sub Page';
    const next = [...sections]; const pages = [...next[activeSectionIdx].pages]; const existing = pages[pIdx].children || [];
    pages[pIdx] = { ...pages[pIdx], children: [...existing, { name: defaultName, nodeType }] }; next[activeSectionIdx] = { ...next[activeSectionIdx], pages }; setSections(next);
  };
  const changeChildType = (pIdx: number, cIdx: number, nodeType: NodeType) => {
    const next = [...sections]; const pages = [...next[activeSectionIdx].pages]; const children = [...(pages[pIdx].children || [])];
    children[cIdx] = { ...children[cIdx], nodeType }; pages[pIdx] = { ...pages[pIdx], children }; next[activeSectionIdx] = { ...next[activeSectionIdx], pages }; setSections(next);
  };
  const changeTabType = (pIdx: number, cIdx: number, tPath: number[], nodeType: NodeType) => {
    const next = [...sections]; const pages = [...next[activeSectionIdx].pages]; const children = [...(pages[pIdx].children || [])];
    const child = JSON.parse(JSON.stringify(children[cIdx])) as SitemapChild;
    let target: SitemapTab = child.tabs![tPath[0]]; for (let i = 1; i < tPath.length; i++) target = target.tabs![tPath[i]];
    target.nodeType = nodeType; children[cIdx] = child; pages[pIdx] = { ...pages[pIdx], children }; next[activeSectionIdx] = { ...next[activeSectionIdx], pages }; setSections(next);
  };
  const updateChildName = (pIdx: number, cIdx: number, val: string) => {
    const next = [...sections]; const pages = [...next[activeSectionIdx].pages]; const children = [...(pages[pIdx].children || [])];
    children[cIdx] = { ...children[cIdx], name: val }; pages[pIdx] = { ...pages[pIdx], children }; next[activeSectionIdx] = { ...next[activeSectionIdx], pages }; setSections(next);
  };
  const removeChild = (pIdx: number, cIdx: number) => {
    const next = [...sections]; const pages = [...next[activeSectionIdx].pages]; const children = (pages[pIdx].children || []).filter((_, i) => i !== cIdx);
    pages[pIdx] = { ...pages[pIdx], children: children.length ? children : undefined }; next[activeSectionIdx] = { ...next[activeSectionIdx], pages }; setSections(next);
  };

  // ── Tab helpers ──
  const addTab = (pIdx: number, cIdx: number, parentPath?: number[], nodeType: NodeType = 'tab') => {
    const defaultName = nodeType === 'popup' ? 'New Pop-Up' : nodeType === 'page' ? 'New Page' : 'New Tab';
    const next = [...sections]; const pages = [...next[activeSectionIdx].pages]; const children = [...(pages[pIdx].children || [])];
    if (parentPath && parentPath.length > 0) {
      const child = JSON.parse(JSON.stringify(children[cIdx])) as SitemapChild;
      let target: SitemapTab = child.tabs![parentPath[0]]; for (let i = 1; i < parentPath.length; i++) target = target.tabs![parentPath[i]];
      if (!target.tabs) target.tabs = []; target.tabs.push({ name: defaultName, nodeType }); children[cIdx] = child;
    } else {
      const existing = children[cIdx].tabs || []; children[cIdx] = { ...children[cIdx], tabs: [...existing, { name: defaultName, nodeType }] };
    }
    pages[pIdx] = { ...pages[pIdx], children }; next[activeSectionIdx] = { ...next[activeSectionIdx], pages }; setSections(next);
  };
  const updateTabName = (pIdx: number, cIdx: number, tPath: number[], val: string) => {
    const next = [...sections]; const pages = [...next[activeSectionIdx].pages]; const children = [...(pages[pIdx].children || [])];
    const child = JSON.parse(JSON.stringify(children[cIdx])) as SitemapChild;
    let target: SitemapTab = child.tabs![tPath[0]]; for (let i = 1; i < tPath.length; i++) target = target.tabs![tPath[i]];
    target.name = val; children[cIdx] = child; pages[pIdx] = { ...pages[pIdx], children }; next[activeSectionIdx] = { ...next[activeSectionIdx], pages }; setSections(next);
  };
  const removeTab = (pIdx: number, cIdx: number, tPath: number[]) => {
    const next = [...sections]; const pages = [...next[activeSectionIdx].pages]; const children = [...(pages[pIdx].children || [])];
    const child = JSON.parse(JSON.stringify(children[cIdx])) as SitemapChild;
    if (tPath.length === 1) { const tabs = (child.tabs || []).filter((_, i) => i !== tPath[0]); child.tabs = tabs.length ? tabs : undefined; }
    else { let parent: SitemapTab = child.tabs![tPath[0]]; for (let i = 1; i < tPath.length - 1; i++) parent = parent.tabs![tPath[i]]; const lastIdx = tPath[tPath.length - 1]; const tabs = (parent.tabs || []).filter((_, i) => i !== lastIdx); parent.tabs = tabs.length ? tabs : undefined; }
    children[cIdx] = child; pages[pIdx] = { ...pages[pIdx], children }; next[activeSectionIdx] = { ...next[activeSectionIdx], pages }; setSections(next);
  };

  // ── Linked parent helpers ──
  const toggleLinkedParent = (pIdx: number, cIdx: number, linkedPIdx: number) => {
    const next = [...sections]; const pages = [...next[activeSectionIdx].pages]; const children = [...(pages[pIdx].children || [])];
    const child = { ...children[cIdx] }; const existing = child.linkedFrom || [];
    if (existing.includes(linkedPIdx)) { child.linkedFrom = existing.filter(i => i !== linkedPIdx); if (child.linkedFrom.length === 0) child.linkedFrom = undefined; }
    else { child.linkedFrom = [...existing, linkedPIdx]; }
    children[cIdx] = child; pages[pIdx] = { ...pages[pIdx], children }; next[activeSectionIdx] = { ...next[activeSectionIdx], pages }; setSections(next);
  };
  const moveChildToLinkedParent = (pIdx: number, cIdx: number) => {
    const next = [...sections]; const pages = [...next[activeSectionIdx].pages]; const children = [...(pages[pIdx].children || [])];
    const child = { ...children[cIdx] }; const linked = child.linkedFrom || []; if (linked.length === 0) return;
    const newOwnerIdx = linked[0]; children.splice(cIdx, 1); pages[pIdx] = { ...pages[pIdx], children };
    const newLinked = linked.slice(1); newLinked.push(pIdx); child.linkedFrom = newLinked.length > 0 ? newLinked : undefined;
    const newOwnerChildren = [...(pages[newOwnerIdx].children || []), child]; pages[newOwnerIdx] = { ...pages[newOwnerIdx], children: newOwnerChildren };
    next[activeSectionIdx] = { ...next[activeSectionIdx], pages }; setSections(next);
  };

  // ── Drag & Drop ──
  const dragCloneRef = useRef<HTMLDivElement | null>(null);
  const dragSourceRef = useRef<HTMLElement | null>(null);
  const pointerOffsetRef = useRef({ x: 0, y: 0 });

  const startDrag = useCallback((item: NonNullable<DragItem>, e: React.PointerEvent) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    pointerOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const clone = el.cloneNode(true) as HTMLDivElement;
    clone.style.position = 'fixed'; clone.style.left = `${rect.left}px`; clone.style.top = `${rect.top}px`; clone.style.width = `${rect.width}px`;
    clone.style.zIndex = '9999'; clone.style.pointerEvents = 'none'; clone.style.opacity = '0.9'; clone.style.boxShadow = '0 12px 28px rgba(0,0,0,0.35)';
    clone.style.transform = 'scale(1.04)'; clone.style.transition = 'box-shadow 0.15s, transform 0.15s'; clone.style.borderRadius = '8px';
    document.body.appendChild(clone); dragCloneRef.current = clone; dragSourceRef.current = el;
    el.style.opacity = '0.25'; el.style.transform = 'scale(0.95)';
    setDragItem(item); setDropTarget(null);

    const onPointerMove = (ev: PointerEvent) => {
      if (dragCloneRef.current) { dragCloneRef.current.style.left = `${ev.clientX - pointerOffsetRef.current.x}px`; dragCloneRef.current.style.top = `${ev.clientY - pointerOffsetRef.current.y}px`; }
      if (dragCloneRef.current) dragCloneRef.current.style.display = 'none';
      const hitEl = document.elementFromPoint(ev.clientX, ev.clientY);
      if (dragCloneRef.current) dragCloneRef.current.style.display = '';
      if (hitEl) {
        const dropEl = hitEl.closest('[data-drop-type]') as HTMLElement | null;
        if (dropEl) {
          const newTarget: DropTarget = { type: dropEl.dataset.dropType as any, index: parseInt(dropEl.dataset.dropIndex || '0'), parentPIdx: dropEl.dataset.dropParentP ? parseInt(dropEl.dataset.dropParentP) : undefined, parentCIdx: dropEl.dataset.dropParentC ? parseInt(dropEl.dataset.dropParentC) : undefined };
          setDropTarget(prev => prev?.type === newTarget.type && prev?.index === newTarget.index && prev?.parentPIdx === newTarget.parentPIdx && prev?.parentCIdx === newTarget.parentCIdx ? prev : newTarget);
        } else { setDropTarget(null); }
      }
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove); document.removeEventListener('pointerup', onPointerUp);
      if (dragCloneRef.current) { dragCloneRef.current.remove(); dragCloneRef.current = null; }
      if (dragSourceRef.current) { dragSourceRef.current.style.opacity = '1'; dragSourceRef.current.style.transform = ''; dragSourceRef.current = null; }
      setDropTarget(currentTarget => {
        setDragItem(currentDrag => {
          if (currentDrag && currentTarget) {
            const dragType = currentDrag.type; const dropType = currentTarget.type;
            setSections(prev => {
              const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
              const pages = next[activeSectionIdx].pages;
              if (dragType === dropType) {
                if (dragType === 'page' && currentDrag.pIdx !== currentTarget.index) { const [moved] = pages.splice(currentDrag.pIdx, 1); pages.splice(currentTarget.index, 0, moved); }
                else if (dragType === 'child' && currentDrag.cIdx !== undefined && currentTarget.parentPIdx !== undefined) {
                  if (currentDrag.pIdx === currentTarget.parentPIdx && currentDrag.cIdx !== currentTarget.index) { const children = pages[currentDrag.pIdx].children || []; const [moved] = children.splice(currentDrag.cIdx, 1); children.splice(currentTarget.index, 0, moved); }
                  else if (currentDrag.pIdx !== currentTarget.parentPIdx) { const srcChildren = pages[currentDrag.pIdx].children || []; const [moved] = srcChildren.splice(currentDrag.cIdx, 1); if (srcChildren.length === 0) pages[currentDrag.pIdx].children = undefined; const dstChildren = pages[currentTarget.parentPIdx].children || []; dstChildren.splice(currentTarget.index, 0, moved); pages[currentTarget.parentPIdx].children = dstChildren; }
                }
                else if (dragType === 'tab' && currentDrag.cIdx !== undefined && currentDrag.tIdx !== undefined && currentTarget.parentPIdx !== undefined && currentTarget.parentCIdx !== undefined) {
                  if (currentDrag.pIdx === currentTarget.parentPIdx && currentDrag.cIdx === currentTarget.parentCIdx && currentDrag.tIdx !== currentTarget.index) { const tabs = pages[currentDrag.pIdx].children![currentDrag.cIdx].tabs || []; const [moved] = tabs.splice(currentDrag.tIdx, 1); tabs.splice(currentTarget.index, 0, moved); }
                }
              }
              else if (dragType === 'child' && dropType === 'page' && currentDrag.cIdx !== undefined) {
                const srcChildren = pages[currentDrag.pIdx].children || []; const [movedChild] = srcChildren.splice(currentDrag.cIdx, 1);
                if (srcChildren.length === 0) pages[currentDrag.pIdx].children = undefined;
                const newPage: any = { name: movedChild.name, nodeType: movedChild.nodeType || 'page' };
                if (movedChild.tabs?.length) newPage.children = movedChild.tabs.map((t: any) => ({ name: t.name, nodeType: t.nodeType || 'tab' }));
                pages.splice(currentTarget.index, 0, newPage);
              }
              else if (dragType === 'page' && dropType === 'child' && currentTarget.parentPIdx !== undefined) {
                const [movedPage] = pages.splice(currentDrag.pIdx, 1);
                let targetPIdx = currentTarget.parentPIdx; if (currentDrag.pIdx < targetPIdx) targetPIdx--;
                const newChild: any = { name: movedPage.name, nodeType: movedPage.nodeType || 'page' };
                if (movedPage.children?.length) newChild.tabs = movedPage.children.map((c: any) => ({ name: c.name, nodeType: c.nodeType || 'tab' }));
                const dstChildren = pages[targetPIdx].children || []; dstChildren.splice(currentTarget.index, 0, newChild); pages[targetPIdx].children = dstChildren;
              }
              else if (dragType === 'tab' && dropType === 'child' && currentDrag.cIdx !== undefined && currentDrag.tIdx !== undefined && currentTarget.parentPIdx !== undefined) {
                const srcTabs = pages[currentDrag.pIdx].children![currentDrag.cIdx].tabs || []; const [movedTab] = srcTabs.splice(currentDrag.tIdx, 1);
                if (srcTabs.length === 0) pages[currentDrag.pIdx].children![currentDrag.cIdx].tabs = undefined;
                const newChild: any = { name: movedTab.name, nodeType: movedTab.nodeType || 'tab' }; if (movedTab.tabs?.length) newChild.tabs = movedTab.tabs;
                const dstChildren = pages[currentTarget.parentPIdx].children || []; dstChildren.splice(currentTarget.index, 0, newChild); pages[currentTarget.parentPIdx].children = dstChildren;
              }
              else if (dragType === 'child' && dropType === 'tab' && currentDrag.cIdx !== undefined && currentTarget.parentPIdx !== undefined && currentTarget.parentCIdx !== undefined) {
                const srcChildren = pages[currentDrag.pIdx].children || []; const [movedChild] = srcChildren.splice(currentDrag.cIdx, 1);
                if (srcChildren.length === 0) pages[currentDrag.pIdx].children = undefined;
                const newTab: any = { name: movedChild.name, nodeType: movedChild.nodeType || 'tab' }; if (movedChild.tabs?.length) newTab.tabs = movedChild.tabs;
                let tgtPIdx = currentTarget.parentPIdx; let tgtCIdx = currentTarget.parentCIdx;
                if (currentDrag.pIdx === tgtPIdx && currentDrag.cIdx < tgtCIdx) tgtCIdx--;
                const dstTabs = pages[tgtPIdx].children?.[tgtCIdx]?.tabs || []; dstTabs.splice(currentTarget.index, 0, newTab);
                if (pages[tgtPIdx].children?.[tgtCIdx]) pages[tgtPIdx].children![tgtCIdx].tabs = dstTabs;
              }
              next[activeSectionIdx] = { ...next[activeSectionIdx], pages }; return next;
            });
          }
          return null;
        });
        return null;
      });
    };
    document.addEventListener('pointermove', onPointerMove); document.addEventListener('pointerup', onPointerUp);
  }, [activeSectionIdx]);

  // ── Download (gated behind lead capture) ──
  const handleDownloadClick = () => {
    if (!sections.some(s => s.pages.length)) { toast.error('Add some pages first'); return; }
    setShowLeadCapture(true);
  };

  const handleLeadSubmitAndDownload = async () => {
    if (!firstName.trim() || !lastName.trim()) { toast.error('Please enter your full name'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { toast.error('Please enter a valid email'); return; }

    setSubmitting(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await supabase.functions.invoke('save-partial-lead', {
        body: { name: fullName, email: email.trim(), project_type: 'website', form_data: { source: 'sitemap_builder_tool', sitemap_name: name } },
      });

      // Generate PDF
      generateSitemapPDF({
        id: '', lead_id: null, build_flow_id: null,
        name: name || 'Sitemap', sections, created_at: '', updated_at: '',
      }, '');

      setShowLeadCapture(false);
      toast.success('Your sitemap PDF is downloading!');

      // Show upsell after brief delay
      setTimeout(() => setShowUpsell(true), 1500);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDroppingSt = (type: string, index: number, parentPIdx?: number, parentCIdx?: number) =>
    dropTarget?.type === type && dropTarget.index === index && dropTarget.parentPIdx === parentPIdx && dropTarget.parentCIdx === parentCIdx;

  return (
    <Layout hideFooter>
      <SEOHead title="Free Sitemap Builder — Sited" description="Plan your website structure visually with our free drag-and-drop sitemap builder. Download as PDF." />

      <div className="flex flex-col bg-background" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {/* Top Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card shrink-0">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Sitemap name…" className="max-w-[200px] font-semibold text-sm h-8" />

          <div className="flex items-center gap-0.5 border-l border-border pl-3 ml-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo} title="Undo"><Undo2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo} title="Redo"><Redo2 className="h-4 w-4" /></Button>
          </div>

          <div className="flex-1" />

          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleDownloadClick} disabled={!sections.some(s => s.pages.length)}>
            <Download className="h-3.5 w-3.5 mr-1" />Download PDF
          </Button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left Sidebar (Sections) */}
          <div className="w-52 shrink-0 border-r border-border bg-card overflow-y-auto p-3 space-y-1.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sections</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addSection}><Plus className="h-3 w-3" /></Button>
            </div>
            {sections.map((s, sIdx) => (
              <div key={sIdx} className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${sIdx === activeSectionIdx ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`} onClick={() => setActiveSectionIdx(sIdx)}>
                <Layers className="h-3 w-3 shrink-0 opacity-60" />
                {editingNode?.type === 'section' && editingNode.sIdx === sIdx ? (
                  <Input autoFocus value={s.title} onChange={e => updateSection(sIdx, e.target.value)} onBlur={() => setEditingNode(null)} onKeyDown={e => e.key === 'Enter' && setEditingNode(null)} className="h-5 text-[11px] px-1 bg-transparent border-none" onClick={e => e.stopPropagation()} />
                ) : (
                  <span className="flex-1 truncate" onDoubleClick={e => { e.stopPropagation(); setEditingNode({ type: 'section', sIdx }); }}>{s.title}</span>
                )}
                <Badge variant="secondary" className="text-[9px] h-4 min-w-[16px] justify-center px-1">{s.pages.length}</Badge>
                {sections.length > 1 && <button className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); removeSection(sIdx); }}><X className="h-3 w-3" /></button>}
              </div>
            ))}
          </div>

          {/* Main Canvas */}
          <div className="flex-1 overflow-auto bg-muted/20 relative" ref={canvasRef}>
            <svg className="absolute top-0 left-0 pointer-events-none z-0" style={{ width: svgSize.w || '100%', height: svgSize.h || '100%' }}>
              {connectorLines.map((l, i) => (
                <g key={i}>
                  <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" strokeDasharray={l.dashed ? '4 3' : undefined} />
                  {i % 3 === 2 && <circle cx={l.x2} cy={l.y2} r="2.5" fill={l.color} opacity="0.7" />}
                </g>
              ))}
            </svg>

            <div className="relative z-10 flex items-start gap-16 p-10 min-h-full" style={{ minWidth: 'max-content' }}>
              {/* Root Node */}
              <div className="flex items-center" style={{ minHeight: `${Math.max(currentSection.pages.reduce((sum, p) => {
                const countTabs = (tabs?: SitemapTab[]): number => tabs ? tabs.reduce((s, t) => s + 1 + countTabs(t.tabs), 0) : 0;
                return sum + 48 + (p.children?.length || 0) * 40 + (p.children?.reduce((s, c) => s + countTabs(c.tabs) * 32, 0) || 0);
              }, 0), 100)}px` }}>
                <div ref={rootNodeRef} className="bg-foreground text-background px-5 py-3 rounded-xl font-bold text-sm shadow-lg select-none whitespace-nowrap">{currentSection.title}</div>
              </div>

              {/* Pages */}
              <div className="flex flex-col gap-4" style={{ minWidth: 'max-content' }}>
                {currentSection.pages.map((page, pIdx) => {
                  const pageColor = PAGE_COLORS[pIdx % PAGE_COLORS.length];
                  return (
                    <div key={pIdx} className="flex items-start gap-12">
                      <div className="flex flex-col items-start">
                        {isDroppingSt('page', pIdx) && <div className="h-1 rounded-full mb-1 mx-2 transition-all" style={{ backgroundColor: pageColor }} />}
                        <div
                          ref={el => { if (el) pageNodeRefs.current.set(pIdx, el); else pageNodeRefs.current.delete(pIdx); }}
                          data-drop-type="page" data-drop-index={pIdx}
                          onPointerDown={e => { if ((e.target as HTMLElement).closest('button, input')) return; startDrag({ type: 'page', sIdx: activeSectionIdx, pIdx }, e); }}
                          className={`group flex items-center gap-1.5 text-white px-3 py-2 rounded-lg shadow-md cursor-grab active:cursor-grabbing transition-all hover:shadow-lg select-none text-sm touch-none ${dragItem?.type === 'page' && dragItem.pIdx === pIdx ? 'opacity-25 scale-95' : ''}`}
                          style={{ backgroundColor: pageColor }}
                        >
                          <GripVertical className="h-3 w-3 opacity-40 shrink-0" />
                          {editingNode?.type === 'page' && editingNode.pIdx === pIdx ? (
                            <Input autoFocus value={page.name} onChange={e => updatePageName(pIdx, e.target.value)} onBlur={() => setEditingNode(null)} onKeyDown={e => e.key === 'Enter' && setEditingNode(null)} className="h-5 text-xs px-1 bg-transparent border-none text-white w-24" onClick={e => e.stopPropagation()} />
                          ) : (
                            <span className="font-medium whitespace-nowrap text-xs" onDoubleClick={() => setEditingNode({ type: 'page', sIdx: activeSectionIdx, pIdx })}>{page.name}</span>
                          )}
                          <span className="opacity-0 group-hover:opacity-100 ml-auto"><AddNodePopover onAdd={(type) => addChild(pIdx, type)} size="xs" /></span>
                          <button className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded p-0.5" onClick={() => removePage(pIdx)}><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>

                      {page.children && page.children.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          {page.children.map((child, cIdx) => (
                            <div key={cIdx} className="flex items-start gap-10">
                              <div>
                                {isDroppingSt('child', cIdx, pIdx) && <div className="h-1 rounded-full mb-1 mx-2 transition-all" style={{ backgroundColor: pageColor, opacity: 0.5 }} />}
                                <div
                                  ref={el => { const k = `${pIdx}-${cIdx}`; if (el) childNodeRefs.current.set(k, el); else childNodeRefs.current.delete(k); }}
                                  data-drop-type="child" data-drop-index={cIdx} data-drop-parent-p={pIdx}
                                  onPointerDown={e => { if ((e.target as HTMLElement).closest('button, input')) return; startDrag({ type: 'child', sIdx: activeSectionIdx, pIdx, cIdx }, e); }}
                                  className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-sm text-xs select-none cursor-grab active:cursor-grabbing touch-none ${dragItem?.type === 'child' && dragItem.pIdx === pIdx && dragItem.cIdx === cIdx ? 'opacity-25 scale-95' : ''} ${getChildNodeStyles(child.nodeType, pIdx * 10 + cIdx).className}`}
                                  style={{ ...getChildNodeStyles(child.nodeType, pIdx * 10 + cIdx).style, ...(child.linkedFrom?.length ? { boxShadow: `0 0 0 1px ${pageColor}20` } : {}) }}
                                >
                                  <GripVertical className="h-3 w-3 opacity-30 shrink-0" />
                                  <NodeTypeIcon nodeType={child.nodeType} onChangeType={(type) => changeChildType(pIdx, cIdx, type)} />
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pageColor, opacity: 0.6 }} />
                                    {child.linkedFrom?.map(lpIdx => <div key={lpIdx} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PAGE_COLORS[lpIdx % PAGE_COLORS.length], opacity: 0.6 }} />)}
                                  </div>
                                  {editingNode?.type === 'child' && editingNode.pIdx === pIdx && editingNode.cIdx === cIdx ? (
                                    <Input autoFocus value={child.name} onChange={e => updateChildName(pIdx, cIdx, e.target.value)} onBlur={() => setEditingNode(null)} onKeyDown={e => e.key === 'Enter' && setEditingNode(null)}
                                      maxLength={(child.nodeType || 'page') === 'note' ? 50 : undefined} className={`h-5 text-[11px] px-1 bg-transparent border-none ${(child.nodeType || 'page') === 'note' ? 'w-40' : 'w-20'}`} />
                                  ) : (
                                    <span className={(child.nodeType || 'page') === 'note' ? 'whitespace-nowrap max-w-[200px] truncate' : 'whitespace-nowrap'} style={{ color: 'inherit' }} onDoubleClick={() => setEditingNode({ type: 'child', sIdx: activeSectionIdx, pIdx, cIdx })}>{child.name}</span>
                                  )}
                                  {(child.nodeType || 'page') !== 'note' && (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button className={`${child.linkedFrom?.length ? 'opacity-70' : 'opacity-0 group-hover:opacity-100'} hover:bg-accent rounded p-0.5 transition-opacity`} title="Link to other pages">
                                          <Link2 className="h-2.5 w-2.5" />
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-48 p-2" side="right" align="start">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Linked pages</p>
                                        {currentSection.pages.map((otherPage, otherPIdx) => {
                                          const isOriginalParent = otherPIdx === pIdx;
                                          const isLinked = isOriginalParent || (child.linkedFrom?.includes(otherPIdx) || false);
                                          const hasOtherLinks = isOriginalParent ? (child.linkedFrom?.length || 0) > 0 : true;
                                          return (
                                            <label key={otherPIdx} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted cursor-pointer text-xs">
                                              <Checkbox checked={isLinked} disabled={isLinked && !hasOtherLinks} onCheckedChange={() => { if (isOriginalParent) moveChildToLinkedParent(pIdx, cIdx); else toggleLinkedParent(pIdx, cIdx, otherPIdx); }} />
                                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PAGE_COLORS[otherPIdx % PAGE_COLORS.length] }} />
                                              <span className="truncate">{otherPage.name}</span>
                                            </label>
                                          );
                                        })}
                                        {currentSection.pages.length <= 1 && <p className="text-[10px] text-muted-foreground py-1">Add more pages to link</p>}
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                  <span className="opacity-0 group-hover:opacity-100"><AddNodePopover onAdd={(type) => addTab(pIdx, cIdx, undefined, type)} size="xs" /></span>
                                  <button className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded p-0.5" onClick={() => removeChild(pIdx, cIdx)}><X className="h-2.5 w-2.5 text-destructive" /></button>
                                </div>
                              </div>
                              {child.tabs && child.tabs.length > 0 && (
                                <TabNodes tabs={child.tabs} pIdx={pIdx} cIdx={cIdx} parentPath={[]} depth={1} pageColor={pageColor}
                                  tabNodeRefs={tabNodeRefs} editingNode={editingNode} setEditingNode={setEditingNode} activeSectionIdx={activeSectionIdx}
                                  updateTabName={updateTabName} removeTab={removeTab} addTab={addTab} changeTabType={changeTabType} dragItem={dragItem} startDrag={startDrag} isDropping={isDroppingSt} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button onClick={() => addPage()} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg px-3 py-1.5 transition-colors w-fit">
                  <Plus className="h-3 w-3" /> Add Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Capture Dialog */}
      <Dialog open={showLeadCapture} onOpenChange={setShowLeadCapture}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Download Your Sitemap</DialogTitle>
            <p className="text-sm text-muted-foreground">Enter your details to download your sitemap as a PDF.</p>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs">First Name</Label>
                <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleLeadSubmitAndDownload} disabled={submitting} className="w-full">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</> : <><Download className="h-4 w-4 mr-2" />Download PDF</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upsell Dialog */}
      <Dialog open={showUpsell} onOpenChange={setShowUpsell}>
        <DialogContent className="sm:max-w-lg text-center">
          <div className="py-4 space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[hsl(var(--gold))]/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-[hsl(var(--gold))]" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Get it done professionally</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We have a special offer for you. Let our team turn your sitemap into a premium, high-converting website.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button size="lg" className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))]/90 text-black font-bold" onClick={() => { setShowUpsell(false); navigate('/contact/offers'); }}>
                See Our Special Offer
              </Button>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowUpsell(false)}>
                No thanks, I'll build it myself
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
