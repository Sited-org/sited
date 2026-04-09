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

interface SitemapTab {
  name: string;
  tabs?: SitemapTab[];
}

interface SitemapChild {
  name: string;
  tabs?: SitemapTab[];
  linkedFrom?: number[];
}

interface SitemapPage {
  name: string;
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

// ─── PDF Brand Constants ───────────────────────────────────────────────────────

const DARK_BG = '#0f172a';
const ACCENT = '#3b82f6';
const ACCENT_LIGHT = '#60a5fa';
const TEXT_WHITE = '#ffffff';
const TEXT_LIGHT = '#cbd5e1';
const TEXT_MID = '#94a3b8';
const TEXT_DARK = '#1e293b';
const NODE_BG = '#1e293b';
const NODE_PAGE = '#3b82f6';
const NODE_CHILD_BG = '#f1f5f9';
const NODE_CHILD_BORDER = '#e2e8f0';
const TAB_BG = '#dbeafe';
const TAB_BORDER = '#93c5fd';
const FOOTER_LINE = '#334155';
const SUBTLE_LINE = '#334155';

const PW = 841.89;
const PH = 595.28;
const ML = 57;
const MR = 57;
const MT = 28;
const MB = 28;

/** Backward compat: migrate string[] children to SitemapChild[] */
function migrateChild(c: any): SitemapChild {
  if (typeof c === 'string') return { name: c };
  return c;
}

// ─── Branded PDF Generation ───────────────────────────────────────────────────

function drawBrandedHeader(doc: jsPDF, sectionTitle: string, clientLabel: string, docId: string) {
  // Full-width dark header bar
  doc.setFillColor(DARK_BG);
  doc.rect(0, 0, PW, 56, 'F');

  // Accent line under header
  doc.setFillColor(ACCENT);
  doc.rect(0, 56, PW, 2.5, 'F');

  // SITED.CO logo — top left, Poppins Bold simulation with Helvetica Bold (closest available)
  doc.setTextColor(TEXT_WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SITED.CO', ML, 37);

  // Client ID & Doc ID — top right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_LIGHT);
  if (clientLabel && clientLabel !== '—') {
    doc.text(`Client: ${clientLabel}`, PW - MR, 24, { align: 'right' });
  }
  doc.text(`Doc ID: ${docId}`, PW - MR, 36, { align: 'right' });

  // Section title — subtle, below the accent line
  doc.setTextColor(TEXT_MID);
  doc.setFontSize(9);
  doc.text(sectionTitle, ML, 74);
}

function drawBrandedFooter(doc: jsPDF, pageNum: number, totalPages: number, sitemapName: string) {
  const footerY = PH - 32;

  // Separator line
  doc.setDrawColor(FOOTER_LINE);
  doc.setLineWidth(0.5);
  doc.line(ML, footerY, PW - MR, footerY);

  // Left: brand tagline
  doc.setTextColor(TEXT_MID);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('SITED.CO — Web Design & Development', ML, footerY + 14);

  // Center: sitemap name
  doc.text(sitemapName, PW / 2, footerY + 14, { align: 'center' });

  // Right: page counter
  doc.text(`${pageNum} / ${totalPages}`, PW - MR, footerY + 14, { align: 'right' });
}

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

  // Build document identifier
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
      doc.setFontSize(12);
      doc.text('No pages in this section', PW / 2, PH / 2, { align: 'center' });
      return;
    }

    const contentTop = 90;
    const contentBottom = PH - 48;
    const contentHeight = contentBottom - contentTop;

    // Column layout
    const rootW = 130;
    const rootH = 36;
    const rootX = ML;
    const rootCY = contentTop + contentHeight / 2;
    const rootY = rootCY - rootH / 2;

    const pageColX = rootX + rootW + 70;
    const pageW = 120;
    const pageH = 30;

    const childColX = pageColX + pageW + 60;
    const childW = 110;
    const childH = 26;

    const tabColX = childColX + childW + 50;
    const tabW = 100;
    const tabH = 22;

    // Root node — dark card
    doc.setFillColor(NODE_BG);
    doc.roundedRect(rootX, rootY, rootW, rootH, 6, 6, 'F');
    doc.setTextColor(TEXT_WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(section.title, rootX + rootW / 2, rootY + rootH / 2 + 3.5, { align: 'center' });

    // Layout pages
    const pageGap = Math.min(10, (contentHeight - pages.length * pageH) / Math.max(pages.length - 1, 1));
    const totalPageH = pages.length * pageH + (pages.length - 1) * pageGap;
    let pageStartY = contentTop + (contentHeight - totalPageH) / 2;
    if (pageStartY < contentTop) pageStartY = contentTop;

    const rootRightX = rootX + rootW;
    const rootMidY = rootY + rootH / 2;

    pages.forEach((page, pIdx) => {
      const pageY = pageStartY + pIdx * (pageH + pageGap);
      const pageMidY = pageY + pageH / 2;

      // Elbow connector: root → page
      doc.setDrawColor(ACCENT_LIGHT);
      doc.setLineWidth(1.2);
      const eX = rootRightX + 35;
      doc.line(rootRightX, rootMidY, eX, rootMidY);
      doc.line(eX, rootMidY, eX, pageMidY);
      doc.line(eX, pageMidY, pageColX, pageMidY);

      // Small dot at connection point
      doc.setFillColor(ACCENT_LIGHT);
      doc.circle(pageColX, pageMidY, 2, 'F');

      // Page node
      doc.setFillColor(NODE_PAGE);
      doc.roundedRect(pageColX, pageY, pageW, pageH, 5, 5, 'F');
      doc.setTextColor(TEXT_WHITE);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const tName = page.name.length > 16 ? page.name.substring(0, 15) + '…' : page.name;
      doc.text(tName, pageColX + pageW / 2, pageY + pageH / 2 + 3, { align: 'center' });

      // Children
      const children = (page.children || []).map(migrateChild);
      if (children.length) {
        const childGap = 5;
        const totalChildH = children.length * childH + (children.length - 1) * childGap;
        let childStartY = pageMidY - totalChildH / 2;
        if (childStartY < contentTop) childStartY = contentTop;

        const pageRightX = pageColX + pageW;
        const childElbowX = pageRightX + 18;

        children.forEach((child, cIdx) => {
          const childY = childStartY + cIdx * (childH + childGap);
          const childMidY = childY + childH / 2;

          // Elbow connector
          doc.setDrawColor(NODE_CHILD_BORDER);
          doc.setLineWidth(1);
          doc.line(pageRightX, pageMidY, childElbowX, pageMidY);
          doc.line(childElbowX, pageMidY, childElbowX, childMidY);
          doc.line(childElbowX, childMidY, childColX, childMidY);
          doc.setFillColor(NODE_CHILD_BORDER);
          doc.circle(childColX, childMidY, 1.5, 'F');

          // Child node
          doc.setFillColor(NODE_CHILD_BG);
          doc.setDrawColor(NODE_CHILD_BORDER);
          doc.roundedRect(childColX, childY, childW, childH, 4, 4, 'FD');
          doc.setTextColor(TEXT_DARK);
          doc.setFontSize(8);
          const tChild = child.name.length > 14 ? child.name.substring(0, 13) + '…' : child.name;
          doc.text(tChild, childColX + childW / 2, childY + childH / 2 + 3, { align: 'center' });

          // Tabs
          const tabs = child.tabs || [];
          if (tabs.length) {
            const tabGap = 4;
            const totalTabH = tabs.length * tabH + (tabs.length - 1) * tabGap;
            let tabStartY = childMidY - totalTabH / 2;
            if (tabStartY < contentTop) tabStartY = contentTop;

            const childRightX = childColX + childW;
            const tabElbowX = childRightX + 14;

            tabs.forEach((tab, tIdx) => {
              const tabY = tabStartY + tIdx * (tabH + tabGap);
              const tabMidY = tabY + tabH / 2;

              doc.setDrawColor(TAB_BORDER);
              doc.setLineWidth(0.8);
              doc.line(childRightX, childMidY, tabElbowX, childMidY);
              doc.line(tabElbowX, childMidY, tabElbowX, tabMidY);
              doc.line(tabElbowX, tabMidY, tabColX, tabMidY);
              doc.setFillColor(TAB_BORDER);
              doc.circle(tabColX, tabMidY, 1.2, 'F');

              doc.setFillColor(TAB_BG);
              doc.setDrawColor(TAB_BORDER);
              doc.roundedRect(tabColX, tabY, tabW, tabH, 3, 3, 'FD');
              doc.setTextColor(TEXT_DARK);
              doc.setFontSize(7);
              const tTab = tab.name.length > 13 ? tab.name.substring(0, 12) + '…' : tab.name;
              doc.text(tTab, tabColX + tabW / 2, tabY + tabH / 2 + 2.5, { align: 'center' });
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
