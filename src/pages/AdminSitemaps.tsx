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

const SLATE_900 = '#0f172a';
const SLATE_700 = '#334155';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';
const WHITE = '#ffffff';
const SITED_BLUE = '#3b82f6';
const TAB_COLOR = '#dbeafe';
const TAB_BORDER = '#93c5fd';

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

// ─── PDF Generation (elbow connectors, 4-level) ───────────────────────────────

export function generateSitemapPDF(sitemap: ProjectSitemap) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const sections = sitemap.sections;

  if (!sections.length) { toast.error('No sections to generate'); return; }

  sections.forEach((section, sIdx) => {
    if (sIdx > 0) doc.addPage();

    // Header
    doc.setFillColor(SLATE_900);
    doc.rect(0, 0, PW, 50, 'F');
    doc.setTextColor(WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Sited.co', ML, 33);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(section.title, PW - MR, 33, { align: 'right' });

    // Footer
    doc.setFillColor(SLATE_100);
    doc.rect(0, PH - 30, PW, 30, 'F');
    doc.setTextColor(SLATE_500);
    doc.setFontSize(8);
    doc.text('Sited · Web Design & Development', ML, PH - 12);
    doc.text(`${sIdx + 1} / ${sections.length}`, PW - MR, PH - 12, { align: 'right' });

    // Subtitle
    doc.setTextColor(SLATE_700);
    doc.setFontSize(10);
    doc.text(sitemap.name, ML, 72);

    const pages = section.pages;
    if (!pages.length) {
      doc.setTextColor(SLATE_400);
      doc.setFontSize(12);
      doc.text('No pages in this section', PW / 2, PH / 2, { align: 'center' });
      return;
    }

    const contentTop = 90;
    const contentBottom = PH - 45;
    const contentHeight = contentBottom - contentTop;

    // Check if we have children and tabs
    const hasChildren = pages.some(p => p.children?.length);
    const hasTabs = pages.some(p => p.children?.some(c => {
      const mc = migrateChild(c);
      return mc.tabs?.length;
    }));

    // Column X positions
    const rootW = 130;
    const rootH = 34;
    const rootX = ML;
    const rootCY = contentTop + contentHeight / 2;
    const rootY = rootCY - rootH / 2;

    const pageColX = rootX + rootW + 70;
    const pageW = 120;
    const pageH = 28;

    const childColX = pageColX + pageW + 60;
    const childW = 110;
    const childH = 24;

    const tabColX = childColX + childW + 50;
    const tabW = 100;
    const tabH = 20;

    // Root node
    doc.setFillColor(SLATE_900);
    doc.roundedRect(rootX, rootY, rootW, rootH, 6, 6, 'F');
    doc.setTextColor(WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(section.title, rootX + rootW / 2, rootY + rootH / 2 + 3, { align: 'center' });

    // Layout pages vertically centered
    const pageGap = Math.min(10, (contentHeight - pages.length * pageH) / Math.max(pages.length - 1, 1));
    const totalPageH = pages.length * pageH + (pages.length - 1) * pageGap;
    let pageStartY = contentTop + (contentHeight - totalPageH) / 2;
    if (pageStartY < contentTop) pageStartY = contentTop;

    const rootRightX = rootX + rootW;
    const rootMidY = rootY + rootH / 2;

    pages.forEach((page, pIdx) => {
      const pageY = pageStartY + pIdx * (pageH + pageGap);
      const pageMidY = pageY + pageH / 2;

      // Elbow: root → page
      doc.setDrawColor(SLATE_400);
      doc.setLineWidth(1.2);
      const eX = rootRightX + 35;
      doc.line(rootRightX, rootMidY, eX, rootMidY);
      doc.line(eX, rootMidY, eX, pageMidY);
      doc.line(eX, pageMidY, pageColX, pageMidY);

      // Page node
      doc.setFillColor(SITED_BLUE);
      doc.roundedRect(pageColX, pageY, pageW, pageH, 5, 5, 'F');
      doc.setTextColor(WHITE);
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

          // Elbow: page → child
          doc.setDrawColor(SLATE_200);
          doc.setLineWidth(1);
          doc.line(pageRightX, pageMidY, childElbowX, pageMidY);
          doc.line(childElbowX, pageMidY, childElbowX, childMidY);
          doc.line(childElbowX, childMidY, childColX, childMidY);

          // Child node
          doc.setFillColor(SLATE_100);
          doc.setDrawColor(SLATE_200);
          doc.roundedRect(childColX, childY, childW, childH, 4, 4, 'FD');
          doc.setTextColor(SLATE_700);
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

              // Elbow: child → tab
              doc.setDrawColor(TAB_BORDER);
              doc.setLineWidth(0.8);
              doc.line(childRightX, childMidY, tabElbowX, childMidY);
              doc.line(tabElbowX, childMidY, tabElbowX, tabMidY);
              doc.line(tabElbowX, tabMidY, tabColX, tabMidY);

              // Tab node
              doc.setFillColor(TAB_COLOR);
              doc.setDrawColor(TAB_BORDER);
              doc.roundedRect(tabColX, tabY, tabW, tabH, 3, 3, 'FD');
              doc.setTextColor(SLATE_700);
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
                      <Button size="sm" variant="ghost" onClick={() => generateSitemapPDF(sm)}><Download className="h-4 w-4" /></Button>
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
