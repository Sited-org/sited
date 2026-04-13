import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export interface ProjectSitemap {
  id: string;
  lead_id: string | null;
  build_flow_id: string | null;
  name: string;
  sections: SitemapSection[];
  created_at: string;
  updated_at: string;
}

// ─── Colors (matching builder) ─────────────────────────────────────────────────

const PAGE_COLORS = [
  '#3b82f6', '#8b5cf6', '#22c55e', '#f97316',
  '#ef4444', '#14b8a6', '#eab308', '#d946ef',
];

const CHILD_NODE_COLORS = [
  '#e11d48', '#0891b2', '#ca8a04', '#7c3aed',
  '#16a34a', '#ea580c', '#c026d3', '#2563eb',
  '#dc2626', '#0d9488', '#f472b6', '#67e8f9',
  '#fbbf24', '#a78bfa', '#6ee7b7', '#fb923c',
  '#f0abfc', '#93c5fd', '#fca5a5', '#5eead4',
];

const LIGHT_GREY = '#d1d5db';
const TEXT_WHITE = '#ffffff';
const TEXT_DARK = '#374151';
const HEADER_BG = '#0f172a';
const ACCENT = '#3b82f6';
const TEXT_MID = '#94a3b8';
const TEXT_LIGHT = '#cbd5e1';
const FOOTER_LINE = '#e2e8f0';

// ─── Layout constants (at "natural" 1x scale) ─────────────────────────────────

const NODE_H = 28;
const NODE_FONT = 9;
const NODE_RADIUS = 6;
const V_GAP = 6;       // vertical gap between sibling nodes
const H_GAP = 60;      // horizontal gap between columns
const CONNECTOR_DOT = 2.5;

function migrateChild(c: any): SitemapChild {
  return typeof c === 'string' ? { name: c } : c;
}

// ─── Layout Tree ───────────────────────────────────────────────────────────────
// We build a layout tree first, then render it. Each "LayoutNode" knows its
// position and size in a coordinate system starting at (0,0).

interface LayoutNode {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  nodeType: NodeType;
  color: string;       // fill or border color
  isRoot?: boolean;
  children: LayoutNode[];
  // Connector info
  parentColor?: string;
  linkedFromColors?: string[]; // dashed connectors from other parents
}

/** Measure the total vertical extent of a node and all its recursive children */
function measureSubtreeHeight(node: { children?: any[]; tabs?: any[] }, isChild?: boolean): number {
  const items = isChild
    ? ((node as SitemapChild).tabs || [])
    : ((node as SitemapPage).children || []).map(migrateChild);

  if (items.length === 0) return NODE_H;

  let totalChildrenH = 0;
  items.forEach((item: any) => {
    totalChildrenH += measureSubtreeHeight(item, true);
  });
  totalChildrenH += (items.length - 1) * V_GAP;

  return Math.max(NODE_H, totalChildrenH);
}

/** Measure text width roughly */
function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.55 + 16; // padding
}

/** Build layout for one section, returning a root LayoutNode */
function layoutSection(section: SitemapSection): { root: LayoutNode; totalW: number; totalH: number } {
  const pages = section.pages;
  if (pages.length === 0) {
    const root: LayoutNode = { x: 0, y: 0, w: 120, h: NODE_H, label: section.title, nodeType: 'page', color: HEADER_BG, isRoot: true, children: [] };
    return { root, totalW: 120, totalH: NODE_H };
  }

  // Calculate node widths based on text
  const minW = 70;
  const maxW = 160;

  function nodeWidth(label: string): number {
    return Math.max(minW, Math.min(maxW, estimateTextWidth(label, NODE_FONT)));
  }

  // Measure each page subtree height
  const pageHeights = pages.map(p => measureSubtreeHeight(p));
  const totalPagesH = pageHeights.reduce((s, h) => s + h, 0) + (pages.length - 1) * V_GAP;

  // Root node
  const rootW = nodeWidth(section.title);
  const rootNode: LayoutNode = {
    x: 0,
    y: totalPagesH / 2 - NODE_H / 2,
    w: rootW,
    h: NODE_H,
    label: section.title,
    nodeType: 'page',
    color: HEADER_BG,
    isRoot: true,
    children: [],
  };

  // Layout pages column
  const pageColX = rootW + H_GAP;
  let pageY = 0;
  let maxRightX = pageColX;

  pages.forEach((page, pIdx) => {
    const pageColor = PAGE_COLORS[pIdx % PAGE_COLORS.length];
    const subtreeH = pageHeights[pIdx];
    const pageMidY = pageY + subtreeH / 2 - NODE_H / 2;
    const pw = nodeWidth(page.name);

    const pageNode: LayoutNode = {
      x: pageColX,
      y: pageMidY,
      w: pw,
      h: NODE_H,
      label: page.name,
      nodeType: 'page',
      color: pageColor,
      parentColor: pageColor,
      children: [],
    };

    // Layout children
    const children = (page.children || []).map(migrateChild);
    if (children.length > 0) {
      const childColX = pageColX + pw + H_GAP * 0.8;
      const childHeights = children.map(c => measureSubtreeHeight(c, true));
      const totalChildrenH = childHeights.reduce((s, h) => s + h, 0) + (children.length - 1) * V_GAP;
      let childStartY = pageMidY + NODE_H / 2 - totalChildrenH / 2;

      children.forEach((child, cIdx) => {
        const childSubH = childHeights[cIdx];
        const childMidY = childStartY + childSubH / 2 - NODE_H / 2;
        const childColor = CHILD_NODE_COLORS[(pIdx * 10 + cIdx) % CHILD_NODE_COLORS.length];
        const cw = nodeWidth(child.name);

        const linkedColors = child.linkedFrom?.map(lpIdx => PAGE_COLORS[lpIdx % PAGE_COLORS.length]);

        const childNode: LayoutNode = {
          x: childColX,
          y: childMidY,
          w: cw,
          h: NODE_H,
          label: child.name,
          nodeType: child.nodeType || 'page',
          color: childColor,
          parentColor: pageColor,
          linkedFromColors: linkedColors,
          children: [],
        };

        // Layout tabs recursively
        function layoutTabs(tabs: SitemapTab[], parentX: number, parentW: number, parentY: number, parentH: number, parentColor: string, depth: number, colorSeed: number): LayoutNode[] {
          if (!tabs.length) return [];
          const tabColX = parentX + parentW + H_GAP * 0.6;
          const tabHeights = tabs.map(t => measureSubtreeHeight(t, true));
          const totalTabsH = tabHeights.reduce((s, h) => s + h, 0) + (tabs.length - 1) * V_GAP;
          let tabStartY = parentY + parentH / 2 - totalTabsH / 2;
          const result: LayoutNode[] = [];

          tabs.forEach((tab, tIdx) => {
            const tabSubH = tabHeights[tIdx];
            const tabMidY = tabStartY + tabSubH / 2 - NODE_H / 2;
            const tabColor = CHILD_NODE_COLORS[(colorSeed * 100 + tIdx) % CHILD_NODE_COLORS.length];
            const tw = nodeWidth(tab.name);

            const tabNode: LayoutNode = {
              x: tabColX,
              y: tabMidY,
              w: tw,
              h: NODE_H,
              label: tab.name,
              nodeType: tab.nodeType || 'tab',
              color: tabColor,
              parentColor: parentColor,
              children: [],
            };

            // Recurse into sub-tabs (unlimited depth)
            if (tab.tabs?.length) {
              tabNode.children = layoutTabs(tab.tabs, tabColX, tw, tabMidY, NODE_H, tabColor, depth + 1, colorSeed * 10 + tIdx);
            }

            const tabRight = tabColX + tw;
            // Track max right accounting for sub-tab children
            function getMaxRight(n: LayoutNode): number {
              let mr = n.x + n.w;
              n.children.forEach(c => { mr = Math.max(mr, getMaxRight(c)); });
              return mr;
            }
            const thisRight = getMaxRight(tabNode);
            if (thisRight > maxRightX) maxRightX = thisRight;

            result.push(tabNode);
            tabStartY += tabSubH + V_GAP;
          });

          return result;
        }

        if (child.tabs?.length) {
          childNode.children = layoutTabs(child.tabs, childColX, cw, childMidY, NODE_H, childColor, 1, pIdx * 10 + cIdx);
        }

        const childRight = childColX + cw;
        function getMaxRight(n: LayoutNode): number {
          let mr = n.x + n.w;
          n.children.forEach(c => { mr = Math.max(mr, getMaxRight(c)); });
          return mr;
        }
        if (getMaxRight(childNode) > maxRightX) maxRightX = getMaxRight(childNode);

        pageNode.children.push(childNode);
        childStartY += childSubH + V_GAP;
      });
    }

    if (pageColX + pw > maxRightX) maxRightX = pageColX + pw;
    rootNode.children.push(pageNode);
    pageY += subtreeH + V_GAP;
  });

  // Normalize: find min Y and shift everything so minY = 0
  function getAllNodes(n: LayoutNode): LayoutNode[] {
    return [n, ...n.children.flatMap(getAllNodes)];
  }
  const allNodes = getAllNodes(rootNode);
  const minY = Math.min(...allNodes.map(n => n.y));
  const maxY = Math.max(...allNodes.map(n => n.y + n.h));
  if (minY < 0) {
    allNodes.forEach(n => { n.y -= minY; });
  }
  const adjMinY = Math.min(...allNodes.map(n => n.y));
  const totalH = Math.max(...allNodes.map(n => n.y + n.h)) - adjMinY;

  return { root: rootNode, totalW: maxRightX, totalH };
}

// ─── PDF Rendering ─────────────────────────────────────────────────────────────

const PW = 841.89; // A4 landscape width in pt
const PH = 595.28; // A4 landscape height in pt
const MARGIN = 40;
const HEADER_H = 50;
const FOOTER_H = 28;

function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, strokeWidth?: number, isDotted?: boolean) {
  const clampedR = Math.min(r, h / 2, w / 2);
  doc.setFillColor(fill);
  if (stroke && !isDotted) {
    doc.setDrawColor(stroke);
    doc.setLineWidth(strokeWidth || 1.5);
    doc.roundedRect(x, y, w, h, clampedR, clampedR, 'FD');
  } else if (stroke && isDotted) {
    doc.roundedRect(x, y, w, h, clampedR, clampedR, 'F');
    // Draw dotted border
    doc.setDrawColor(stroke);
    doc.setLineWidth(strokeWidth || 1.5);
    const dash = 3, gap = 3;
    // Top
    drawDottedLine(doc, x + clampedR, y, x + w - clampedR, y, dash, gap);
    // Right
    drawDottedLine(doc, x + w, y + clampedR, x + w, y + h - clampedR, dash, gap);
    // Bottom
    drawDottedLine(doc, x + w - clampedR, y + h, x + clampedR, y + h, dash, gap);
    // Left
    drawDottedLine(doc, x, y + h - clampedR, x, y + clampedR, dash, gap);
  } else {
    doc.roundedRect(x, y, w, h, clampedR, clampedR, 'F');
  }
}

function drawDottedLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, dash: number, gap: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.1) return;
  const ux = dx / len, uy = dy / len;
  let pos = 0;
  while (pos < len) {
    const end = Math.min(pos + dash, len);
    doc.line(x1 + ux * pos, y1 + uy * pos, x1 + ux * end, y1 + uy * end);
    pos = end + gap;
  }
}

function drawElbow(doc: jsPDF, fromX: number, fromY: number, toX: number, toY: number, color: string, lineWidth: number, dashed?: boolean) {
  doc.setDrawColor(color);
  doc.setLineWidth(lineWidth);
  const elbowX = fromX + (toX - fromX) / 2;

  if (dashed) {
    const dash = 3, gap = 3;
    drawDottedLine(doc, fromX, fromY, elbowX, fromY, dash, gap);
    drawDottedLine(doc, elbowX, fromY, elbowX, toY, dash, gap);
    drawDottedLine(doc, elbowX, toY, toX, toY, dash, gap);
  } else {
    doc.line(fromX, fromY, elbowX, fromY);
    doc.line(elbowX, fromY, elbowX, toY);
    doc.line(elbowX, toY, toX, toY);
  }

  // Dot at destination
  doc.setFillColor(color);
  doc.circle(toX, toY, Math.max(1, lineWidth * 0.8), 'F');
}

function renderNode(doc: jsPDF, node: LayoutNode, scale: number, offsetX: number, offsetY: number, fontSize: number) {
  const x = node.x * scale + offsetX;
  const y = node.y * scale + offsetY;
  const w = node.w * scale;
  const h = node.h * scale;
  const r = Math.min(NODE_RADIUS * scale, h / 2);
  const fs = Math.max(4, fontSize);

  if (node.isRoot) {
    // Root: dark bg, white bold text
    drawRoundedRect(doc, x, y, w, h, r, HEADER_BG);
    doc.setTextColor(TEXT_WHITE);
    doc.setFont('helvetica', 'bold');
  } else if (node.nodeType === 'page') {
    // Page: full color bg, white bold text
    drawRoundedRect(doc, x, y, w, h, r, node.color);
    doc.setTextColor(TEXT_WHITE);
    doc.setFont('helvetica', 'bold');
  } else if (node.nodeType === 'popup') {
    // Popup: grey bg, dotted colored border, dark text
    drawRoundedRect(doc, x, y, w, h, r, LIGHT_GREY, node.color, Math.max(0.8, 1.5 * scale), true);
    doc.setTextColor(TEXT_DARK);
    doc.setFont('helvetica', 'normal');
  } else {
    // Tab: grey bg, no border, dark text
    drawRoundedRect(doc, x, y, w, h, r, LIGHT_GREY);
    doc.setTextColor(TEXT_DARK);
    doc.setFont('helvetica', 'normal');
  }

  doc.setFontSize(fs);
  // Truncate text to fit
  const maxChars = Math.max(3, Math.floor(w / (fs * 0.52)));
  const label = node.label.length > maxChars ? node.label.substring(0, maxChars - 1) + '…' : node.label;
  doc.text(label, x + w / 2, y + h / 2 + fs * 0.3, { align: 'center' });
}

function renderConnectors(doc: jsPDF, parent: LayoutNode, scale: number, offsetX: number, offsetY: number) {
  const parentRight = (parent.x + parent.w) * scale + offsetX;
  const parentMidY = (parent.y + parent.h / 2) * scale + offsetY;
  const lw = Math.max(0.5, 1.2 * scale);

  parent.children.forEach(child => {
    const childLeft = child.x * scale + offsetX;
    const childMidY = (child.y + child.h / 2) * scale + offsetY;
    const connectorColor = child.parentColor || parent.color;

    drawElbow(doc, parentRight, parentMidY, childLeft, childMidY, connectorColor, lw, false);

    // Draw linked-from dashed connectors (these go from other page nodes to this child)
    // We handle this at the section level since we need page positions

    // Recurse
    renderConnectors(doc, child, scale, offsetX, offsetY);
  });
}

/** Render linked-from dashed connectors */
function renderLinkedConnectors(doc: jsPDF, rootNode: LayoutNode, scale: number, offsetX: number, offsetY: number) {
  const lw = Math.max(0.5, 1 * scale);
  // Pages are direct children of root
  rootNode.children.forEach(pageNode => {
    // Children of page
    pageNode.children.forEach(childNode => {
      if (childNode.linkedFromColors?.length) {
        // Find the linked parent page nodes by color matching
        childNode.linkedFromColors.forEach(lpColor => {
          const linkedPage = rootNode.children.find(p => p.color === lpColor);
          if (!linkedPage) return;
          const lpRight = (linkedPage.x + linkedPage.w) * scale + offsetX;
          const lpMidY = (linkedPage.y + linkedPage.h / 2) * scale + offsetY;
          const childLeft = childNode.x * scale + offsetX;
          const childMidY = (childNode.y + childNode.h / 2) * scale + offsetY;
          drawElbow(doc, lpRight, lpMidY, childLeft, childMidY, lpColor, lw, true);
        });
      }
    });
  });
}

function drawHeader(doc: jsPDF, sectionTitle: string, clientLabel: string, docId: string) {
  doc.setFillColor(HEADER_BG);
  doc.rect(0, 0, PW, HEADER_H - 2, 'F');
  doc.setFillColor(ACCENT);
  doc.rect(0, HEADER_H - 2, PW, 2, 'F');

  doc.setTextColor(TEXT_WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SITED.CO', MARGIN, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(TEXT_LIGHT);
  if (clientLabel && clientLabel !== '—') {
    doc.text(`Client: ${clientLabel}`, PW - MARGIN, 22, { align: 'right' });
  }
  doc.text(`Doc ID: ${docId}`, PW - MARGIN, 32, { align: 'right' });

  doc.setTextColor(TEXT_MID);
  doc.setFontSize(8);
  doc.text(sectionTitle, MARGIN, HEADER_H + 12);
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number, sitemapName: string) {
  const footerY = PH - FOOTER_H;
  doc.setDrawColor(FOOTER_LINE);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, footerY, PW - MARGIN, footerY);

  doc.setTextColor(TEXT_MID);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('SITED.CO — Web Design & Development', MARGIN, footerY + 12);
  doc.text(sitemapName, PW / 2, footerY + 12, { align: 'center' });
  doc.text(`${pageNum} / ${totalPages}`, PW - MARGIN, footerY + 12, { align: 'right' });
}

// ─── Main Export ───────────────────────────────────────────────────────────────

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

  const contentTop = HEADER_H + 20;
  const contentBottom = PH - FOOTER_H - 8;
  const contentLeft = MARGIN;
  const contentRight = PW - MARGIN;
  const availW = contentRight - contentLeft;
  const availH = contentBottom - contentTop;

  sections.forEach((section, sIdx) => {
    if (sIdx > 0) doc.addPage();

    drawHeader(doc, section.title, clientDisplay, docId);
    drawFooter(doc, sIdx + 1, sections.length, sitemap.name);

    if (!section.pages.length) {
      doc.setTextColor(TEXT_MID);
      doc.setFontSize(11);
      doc.text('No pages in this section', PW / 2, PH / 2, { align: 'center' });
      return;
    }

    // Build layout
    const { root, totalW, totalH } = layoutSection(section);

    // Scale to fit
    const scaleX = availW / totalW;
    const scaleY = availH / totalH;
    const scale = Math.min(scaleX, scaleY, 1); // never enlarge beyond 1x

    // Center in available area
    const renderedW = totalW * scale;
    const renderedH = totalH * scale;
    const offsetX = contentLeft + (availW - renderedW) / 2;
    const offsetY = contentTop + (availH - renderedH) / 2;

    const fontSize = Math.max(4, NODE_FONT * scale);

    // Render connectors first (behind nodes)
    renderConnectors(doc, root, scale, offsetX, offsetY);
    renderLinkedConnectors(doc, root, scale, offsetX, offsetY);

    // Render all nodes
    function renderAll(node: LayoutNode) {
      renderNode(doc, node, scale, offsetX, offsetY, fontSize);
      node.children.forEach(renderAll);
    }
    renderAll(root);
  });

  doc.save(`${sitemap.name.replace(/\s+/g, '_')}_Sitemap.pdf`);
  toast.success('PDF downloaded');
}
