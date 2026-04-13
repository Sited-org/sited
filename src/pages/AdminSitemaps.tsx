import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

// ─── Types ─────────────────────────────────────────────────────────────────────

type NodeType = 'page' | 'popup' | 'tab';

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

interface ProjectSitemap {
  id: string;
  lead_id: string | null;
  build_flow_id: string | null;
  name: string;
  sections: SitemapSection[];
  created_at: string;
  updated_at: string;
}

interface LeadOption {
  id: string;
  name: string | null;
  business_name: string | null;
}

// ─── PDF Constants ─────────────────────────────────────────────────────────────

const PW = 841.89;
const PH = 595.28;
const ML = 40;
const MR = 40;

const PAGE_COLORS_PDF = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#22c55e', // green
  '#f97316', // orange
  '#ef4444', // rose
  '#14b8a6', // teal
  '#eab308', // amber
  '#d946ef', // pink
];

const CHILD_NODE_COLORS_PDF = [
  '#e11d48', // rose
  '#0891b2', // teal
  '#ca8a04', // amber
  '#7c3aed', // purple
  '#16a34a', // green
  '#ea580c', // orange
  '#c026d3', // pink
  '#2563eb', // blue
  '#dc2626', // red
  '#0d9488', // emerald
  '#f472b6', // pastel rose
  '#67e8f9', // pastel teal
  '#fbbf24', // pastel amber
  '#a78bfa', // pastel purple
  '#6ee7b7', // pastel green
  '#fb923c', // pastel orange
  '#f0abfc', // pastel pink
  '#93c5fd', // pastel blue
  '#fca5a5', // pastel red
  '#5eead4', // pastel emerald
];

const LIGHT_GREY_PDF = '#d1d5db';
const TEXT_WHITE = '#ffffff';
const TEXT_DARK_PDF = '#374151';
const HEADER_BG = '#0f172a';
const ACCENT = '#3b82f6';
const TEXT_MID = '#94a3b8';
const TEXT_LIGHT = '#cbd5e1';
const FOOTER_LINE = '#e2e8f0';

/** Backward compat: migrate string[] children to SitemapChild[] */
function migrateChild(c: any): SitemapChild {
  if (typeof c === 'string') return { name: c };
  return c;
}

// ─── PDF Helper: Draw nodes matching builder styles ───────────────────────────

function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, strokeWidth?: number, strokeStyle?: 'solid' | 'dotted') {
  doc.setFillColor(fill);
  if (stroke) {
    doc.setDrawColor(stroke);
    doc.setLineWidth(strokeWidth || 1.5);
    if (strokeStyle === 'dotted') {
      // Draw filled rect, then dotted border manually
      doc.roundedRect(x, y, w, h, r, r, 'F');
      drawDottedRect(doc, x, y, w, h, r, stroke, strokeWidth || 1.5);
    } else {
      doc.roundedRect(x, y, w, h, r, r, 'FD');
    }
  } else {
    doc.roundedRect(x, y, w, h, r, r, 'F');
  }
}

function drawDottedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, color: string, lw: number) {
  doc.setDrawColor(color);
  doc.setLineWidth(lw);
  const gap = 4;
  const dash = 3;
  // Top edge
  drawDottedLine(doc, x + r, y, x + w - r, y, dash, gap);
  // Right edge
  drawDottedLine(doc, x + w, y + r, x + w, y + h - r, dash, gap);
  // Bottom edge
  drawDottedLine(doc, x + w - r, y + h, x + r, y + h, dash, gap);
  // Left edge
  drawDottedLine(doc, x, y + h - r, x, y + r, dash, gap);
}

function drawDottedLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, dash: number, gap: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  let pos = 0;
  while (pos < len) {
    const end = Math.min(pos + dash, len);
    doc.line(x1 + ux * pos, y1 + uy * pos, x1 + ux * end, y1 + uy * end);
    pos = end + gap;
  }
}

function drawDashedElbow(doc: jsPDF, fromX: number, fromY: number, elbowX: number, toY: number, toX: number, color: string, lw: number) {
  doc.setDrawColor(color);
  doc.setLineWidth(lw);
  const dash = 3;
  const gap = 3;
  drawDottedLine(doc, fromX, fromY, elbowX, fromY, dash, gap);
  drawDottedLine(doc, elbowX, fromY, elbowX, toY, dash, gap);
  drawDottedLine(doc, elbowX, toY, toX, toY, dash, gap);
}

function drawBrandedHeader(doc: jsPDF, sectionTitle: string, clientLabel: string, docId: string) {
  doc.setFillColor(HEADER_BG);
  doc.rect(0, 0, PW, 48, 'F');
  doc.setFillColor(ACCENT);
  doc.rect(0, 48, PW, 2, 'F');

  doc.setTextColor(TEXT_WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SITED.CO', ML, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(TEXT_LIGHT);
  if (clientLabel && clientLabel !== '—') {
    doc.text(`Client: ${clientLabel}`, PW - MR, 22, { align: 'right' });
  }
  doc.text(`Doc ID: ${docId}`, PW - MR, 32, { align: 'right' });

  doc.setTextColor(TEXT_MID);
  doc.setFontSize(8);
  doc.text(sectionTitle, ML, 64);
}

function drawBrandedFooter(doc: jsPDF, pageNum: number, totalPages: number, sitemapName: string) {
  const footerY = PH - 28;
  doc.setDrawColor(FOOTER_LINE);
  doc.setLineWidth(0.5);
  doc.line(ML, footerY, PW - MR, footerY);

  doc.setTextColor(TEXT_MID);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('SITED.CO — Web Design & Development', ML, footerY + 12);
  doc.text(sitemapName, PW / 2, footerY + 12, { align: 'center' });
  doc.text(`${pageNum} / ${totalPages}`, PW - MR, footerY + 12, { align: 'right' });
}

// ─── Adaptive Sizing Defaults & Bounds ────────────────────────────────────────

const SIZE_DEFAULTS = {
  root:  { w: 120, h: 32, font: 9,   minW: 70,  maxW: 140, minH: 20, maxH: 36, minFont: 6, maxFont: 10 },
  page:  { w: 110, h: 28, font: 8,   minW: 60,  maxW: 130, minH: 16, maxH: 32, minFont: 5.5, maxFont: 9 },
  child: { w: 100, h: 24, font: 7,   minW: 50,  maxW: 120, minH: 14, maxH: 28, minFont: 5, maxFont: 8 },
  tab:   { w: 90,  h: 20, font: 6.5, minW: 44,  maxW: 110, minH: 12, maxH: 24, minFont: 4.5, maxFont: 7.5 },
};

const MIN_GAP = 2;
const IDEAL_GAP = 6;

/** Compute scale factor (0..1) so items + gaps fit within available height */
function computeScale(
  count: number,
  defaultH: number,
  idealGap: number,
  available: number,
): number {
  if (count <= 0) return 1;
  const needed = count * defaultH + (count - 1) * idealGap;
  if (needed <= available) return 1;
  // shrink to fit with minimum gap
  const minNeeded = count * defaultH + (count - 1) * MIN_GAP;
  if (minNeeded <= available) return 1; // just reduce gap
  // need to shrink items
  return Math.max(0, (available - (count - 1) * MIN_GAP) / (count * defaultH));
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

interface ScaledSizes {
  w: number; h: number; font: number; gap: number;
}

function scaleTier(
  tier: keyof typeof SIZE_DEFAULTS,
  count: number,
  available: number,
): ScaledSizes {
  const d = SIZE_DEFAULTS[tier];
  const s = computeScale(count, d.h, IDEAL_GAP, available);
  const h = clamp(d.h * s, d.minH, d.maxH);
  const w = clamp(d.w * s, d.minW, d.maxW);
  const font = clamp(d.font * s, d.minFont, d.maxFont);
  // recalculate gap after clamped height
  const totalItemH = count * h;
  const gap = count > 1 ? Math.max(MIN_GAP, (available - totalItemH) / (count - 1)) : IDEAL_GAP;
  return { w, h, font, gap };
}

/** Find the max child count and max tab count across all pages in a section */
function sectionDensity(pages: SitemapPage[]) {
  let maxChildren = 0;
  let maxTabs = 0;
  pages.forEach(p => {
    const children = (p.children || []).map(migrateChild);
    if (children.length > maxChildren) maxChildren = children.length;
    children.forEach(c => {
      const tabs = c.tabs || [];
      if (tabs.length > maxTabs) maxTabs = tabs.length;
    });
  });
  return { maxChildren, maxTabs };
}

// ─── Branded PDF Generation ───────────────────────────────────────────────────

export async function generateSitemapPDF(sitemap: ProjectSitemap, leadLabel?: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const sections = sitemap.sections;

  if (!sections.length) { toast.error('No sections to generate'); return; }

  // Increment download counter
  let downloadCount = 0;
  try {
    const { data } = await supabase
      .from('project_sitemaps')
      .select('download_count')
      .eq('id', sitemap.id)
      .single();
    downloadCount = ((data as any)?.download_count || 0) + 1;
    await supabase
      .from('project_sitemaps')
      .update({ download_count: downloadCount } as any)
      .eq('id', sitemap.id);
  } catch { downloadCount = 1; }

  const shortId = sitemap.id.slice(0, 8).toUpperCase();
  const docId = `SM-${shortId}-${String(downloadCount).padStart(4, '0')}`;
  const clientDisplay = leadLabel || '—';

  sections.forEach((section, sIdx) => {
    if (sIdx > 0) doc.addPage();

    drawBrandedHeader(doc, section.title, clientDisplay, docId);
    drawBrandedFooter(doc, sIdx + 1, sections.length, sitemap.name);

    const pages = section.pages;
    if (!pages.length) {
      doc.setTextColor(TEXT_MID);
      doc.setFontSize(11);
      doc.text('No pages in this section', PW / 2, PH / 2, { align: 'center' });
      return;
    }

    const contentTop = 78;
    const contentBottom = PH - 38;
    const contentHeight = contentBottom - contentTop;

    // ── Compute adaptive sizes based on density ──
    const { maxChildren, maxTabs } = sectionDensity(pages);

    // Scale each tier to fit the available vertical space
    const ps = scaleTier('page', pages.length, contentHeight);
    const cs = scaleTier('child', maxChildren, contentHeight);
    const ts = scaleTier('tab', maxTabs, contentHeight);
    const rs = scaleTier('root', 1, contentHeight);

    // ── Column X positions with adaptive widths ──
    const colGap1 = clamp(60 * (ps.h / SIZE_DEFAULTS.page.h), 30, 60);
    const colGap2 = clamp(50 * (cs.h / SIZE_DEFAULTS.child.h), 24, 50);
    const colGap3 = clamp(40 * (ts.h / SIZE_DEFAULTS.tab.h), 20, 40);

    const rootX = ML;
    const pageColX = rootX + rs.w + colGap1;
    const childColX = pageColX + ps.w + colGap2;
    const tabColX = childColX + cs.w + colGap3;

    // ── Root / Section node ──
    const rootCY = contentTop + contentHeight / 2;
    const rootY = rootCY - rs.h / 2;
    drawRoundedRect(doc, rootX, rootY, rs.w, rs.h, 6, HEADER_BG);
    doc.setTextColor(TEXT_WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(rs.font);
    doc.text(section.title, rootX + rs.w / 2, rootY + rs.h / 2 + 3, { align: 'center' });

    // ── Layout pages vertically ──
    const totalPageH = pages.length * ps.h + (pages.length - 1) * ps.gap;
    let pageStartY = contentTop + (contentHeight - totalPageH) / 2;
    if (pageStartY < contentTop) pageStartY = contentTop;

    const rootRightX = rootX + rs.w;
    const rootMidY = rootY + rs.h / 2;

    pages.forEach((page, pIdx) => {
      const pageColor = PAGE_COLORS_PDF[pIdx % PAGE_COLORS_PDF.length];
      const pageY = pageStartY + pIdx * (ps.h + ps.gap);
      const pageMidY = pageY + ps.h / 2;

      // Elbow connector: root → page
      doc.setDrawColor(pageColor);
      doc.setLineWidth(1.2);
      const eX = rootRightX + colGap1 * 0.5;
      doc.line(rootRightX, rootMidY, eX, rootMidY);
      doc.line(eX, rootMidY, eX, pageMidY);
      doc.line(eX, pageMidY, pageColX, pageMidY);

      doc.setFillColor(pageColor);
      doc.circle(pageColX, pageMidY, 2, 'F');

      // ── Page node ──
      drawRoundedRect(doc, pageColX, pageY, ps.w, ps.h, 5, pageColor);
      doc.setTextColor(TEXT_WHITE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(ps.font);
      const maxChars = Math.max(6, Math.floor(ps.w / (ps.font * 0.55)));
      const tName = page.name.length > maxChars ? page.name.substring(0, maxChars - 1) + '…' : page.name;
      doc.text(tName, pageColX + ps.w / 2, pageY + ps.h / 2 + ps.font * 0.35, { align: 'center' });

      // Children
      const children = (page.children || []).map(migrateChild);
      if (children.length) {
        const totalChildH = children.length * cs.h + (children.length - 1) * cs.gap;
        let childStartY = pageMidY - totalChildH / 2;
        if (childStartY < contentTop) childStartY = contentTop;
        if (childStartY + totalChildH > contentBottom) childStartY = contentBottom - totalChildH;

        const pageRightX = pageColX + ps.w;
        const childElbowX = pageRightX + colGap2 * 0.35;

        children.forEach((child, cIdx) => {
          const childY = childStartY + cIdx * (cs.h + cs.gap);
          const childMidY = childY + cs.h / 2;
          const childType = child.nodeType || 'page';
          const childColor = CHILD_NODE_COLORS_PDF[(pIdx * 10 + cIdx) % CHILD_NODE_COLORS_PDF.length];

          const isShared = child.linkedFrom && child.linkedFrom.length > 0;

          if (isShared) {
            drawDashedElbow(doc, pageRightX, pageMidY, childElbowX, childMidY, childColX, pageColor, 1);
          } else {
            doc.setDrawColor(pageColor);
            doc.setLineWidth(1);
            doc.line(pageRightX, pageMidY, childElbowX, pageMidY);
            doc.line(childElbowX, pageMidY, childElbowX, childMidY);
            doc.line(childElbowX, childMidY, childColX, childMidY);
          }

          doc.setFillColor(pageColor);
          doc.circle(childColX - 3, childMidY, 1.5, 'F');

          if (isShared) {
            child.linkedFrom!.forEach(lpIdx => {
              if (lpIdx < 0 || lpIdx >= pages.length) return;
              const lpColor = PAGE_COLORS_PDF[lpIdx % PAGE_COLORS_PDF.length];
              const lpY = pageStartY + lpIdx * (ps.h + ps.gap);
              const lpMidY = lpY + ps.h / 2;
              const lpElbowX = pageColX + ps.w + colGap2 * 0.35;
              drawDashedElbow(doc, pageColX + ps.w, lpMidY, lpElbowX, childMidY, childColX, lpColor, 1);
              doc.setFillColor(lpColor);
              doc.circle(childColX - 3 - (child.linkedFrom!.indexOf(lpIdx) + 1) * 3.5, childMidY, 1.5, 'F');
            });
          } else {
            doc.setFillColor(childColor);
            doc.circle(childColX, childMidY, 1.5, 'F');
          }

          // ── Child node styled by type ──
          if (childType === 'page') {
            drawRoundedRect(doc, childColX, childY, cs.w, cs.h, 4, childColor);
            doc.setTextColor(TEXT_WHITE);
          } else if (childType === 'popup') {
            drawRoundedRect(doc, childColX, childY, cs.w, cs.h, 4, LIGHT_GREY_PDF, childColor, 1.5, 'dotted');
            doc.setTextColor(TEXT_DARK_PDF);
          } else {
            drawRoundedRect(doc, childColX, childY, cs.w, cs.h, 4, LIGHT_GREY_PDF);
            doc.setTextColor(TEXT_DARK_PDF);
          }

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(cs.font);
          const maxChildChars = Math.max(5, Math.floor(cs.w / (cs.font * 0.55)));
          const tChild = child.name.length > maxChildChars ? child.name.substring(0, maxChildChars - 1) + '…' : child.name;
          doc.text(tChild, childColX + cs.w / 2, childY + cs.h / 2 + cs.font * 0.35, { align: 'center' });

          // Tabs
          const tabs = child.tabs || [];
          if (tabs.length) {
            const totalTabH = tabs.length * ts.h + (tabs.length - 1) * ts.gap;
            let tabStartY = childMidY - totalTabH / 2;
            if (tabStartY < contentTop) tabStartY = contentTop;
            if (tabStartY + totalTabH > contentBottom) tabStartY = contentBottom - totalTabH;

            const childRightX = childColX + cs.w;
            const tabElbowX = childRightX + colGap3 * 0.35;

            tabs.forEach((tab, tIdx) => {
              const tabY = tabStartY + tIdx * (ts.h + ts.gap);
              const tabMidY = tabY + ts.h / 2;
              const tabType = tab.nodeType || 'tab';
              const tabColor = CHILD_NODE_COLORS_PDF[(pIdx * 100 + cIdx * 10 + tIdx) % CHILD_NODE_COLORS_PDF.length];

              doc.setDrawColor(childColor);
              doc.setLineWidth(0.8);
              doc.line(childRightX, childMidY, tabElbowX, childMidY);
              doc.line(tabElbowX, childMidY, tabElbowX, tabMidY);
              doc.line(tabElbowX, tabMidY, tabColX, tabMidY);

              doc.setFillColor(tabColor);
              doc.circle(tabColX, tabMidY, 1.2, 'F');

              if (tabType === 'page') {
                drawRoundedRect(doc, tabColX, tabY, ts.w, ts.h, 3, tabColor);
                doc.setTextColor(TEXT_WHITE);
              } else if (tabType === 'popup') {
                drawRoundedRect(doc, tabColX, tabY, ts.w, ts.h, 3, LIGHT_GREY_PDF, tabColor, 1.2, 'dotted');
                doc.setTextColor(TEXT_DARK_PDF);
              } else {
                drawRoundedRect(doc, tabColX, tabY, ts.w, ts.h, 3, LIGHT_GREY_PDF);
                doc.setTextColor(TEXT_DARK_PDF);
              }

              doc.setFont('helvetica', 'normal');
              doc.setFontSize(ts.font);
              const maxTabChars = Math.max(5, Math.floor(ts.w / (ts.font * 0.55)));
              const tTab = tab.name.length > maxTabChars ? tab.name.substring(0, maxTabChars - 1) + '…' : tab.name;
              doc.text(tTab, tabColX + ts.w / 2, tabY + ts.h / 2 + ts.font * 0.35, { align: 'center' });
            });
          }
        });
      }
    });
  });

  doc.save(`${sitemap.name.replace(/\s+/g, '_')}_Sitemap.pdf`);
  toast.success('PDF downloaded');
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminSitemaps() {
  const navigate = useNavigate();
  const [sitemaps, setSitemaps] = useState<ProjectSitemap[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSitemaps = useCallback(async () => {
    const { data, error } = await supabase
      .from('project_sitemaps')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setSitemaps(data.map(d => ({ ...d, sections: (d.sections as any) || [] })));
    }
    setLoading(false);
  }, []);

  const fetchLeads = useCallback(async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, name, business_name')
      .order('created_at', { ascending: false })
      .limit(500);
    if (data) setLeads(data);
  }, []);

  useEffect(() => { fetchSitemaps(); fetchLeads(); }, [fetchSitemaps, fetchLeads]);

  const deleteSitemap = async (id: string) => {
    if (!confirm('Delete this sitemap?')) return;
    await supabase.from('project_sitemaps').delete().eq('id', id);
    toast.success('Deleted');
    fetchSitemaps();
  };

  const getLeadLabel = (leadId: string | null) => {
    if (!leadId) return '—';
    const lead = leads.find(l => l.id === leadId);
    return lead ? (lead.business_name || lead.name || lead.id.slice(0, 8)) : leadId.slice(0, 8);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sitemaps</h1>
          <p className="text-sm text-muted-foreground">Create visual sitemap PDFs for client projects</p>
        </div>
        <Button onClick={() => navigate('/admin/sitemaps/new')}>
          <Plus className="h-4 w-4 mr-2" />New Sitemap
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : sitemaps.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No sitemaps yet. Create one to get started.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sitemaps.map(sm => (
                  <TableRow key={sm.id}>
                    <TableCell className="font-medium">{sm.name}</TableCell>
                    <TableCell>{getLeadLabel(sm.lead_id)}</TableCell>
                    <TableCell><Badge variant="secondary">{sm.sections.length}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{format(new Date(sm.created_at), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/sitemaps/${sm.id}`)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => generateSitemapPDF(sm, getLeadLabel(sm.lead_id))}><Download className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteSitemap(sm.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
