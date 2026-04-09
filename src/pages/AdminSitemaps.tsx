import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Pencil, Trash2, Import, X, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SitemapPage {
  name: string;
  children?: string[];
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

// A4 Landscape: 841.89 x 595.28 pt
const PW = 841.89;
const PH = 595.28;
// Margins: 2cm sides (~56.7pt), 1cm top/bottom (~28.35pt)
const ML = 57;
const MR = 57;
const MT = 28;
const MB = 28;

// ─── PDF Generation ────────────────────────────────────────────────────────────

function generateSitemapPDF(sitemap: ProjectSitemap) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const sections = sitemap.sections;

  if (!sections.length) {
    toast.error('No sections to generate');
    return;
  }

  sections.forEach((section, sIdx) => {
    if (sIdx > 0) doc.addPage();

    // ── Header ──
    doc.setFillColor(SLATE_900);
    doc.rect(0, 0, PW, 50, 'F');
    doc.setTextColor(WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Sited.co', ML, 33);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(section.title, PW - MR, 33, { align: 'right' });

    // ── Footer ──
    doc.setFillColor(SLATE_100);
    doc.rect(0, PH - 30, PW, 30, 'F');
    doc.setTextColor(SLATE_500);
    doc.setFontSize(8);
    doc.text('Sited · Web Design & Development', ML, PH - 12);
    doc.text(`${sIdx + 1} / ${sections.length}`, PW - MR, PH - 12, { align: 'right' });

    // ── Sitemap name subtitle ──
    doc.setTextColor(SLATE_700);
    doc.setFontSize(10);
    doc.text(sitemap.name, ML, 72);

    // ── Tree rendering ──
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
    const contentWidth = PW - ML - MR;

    // Root node
    const rootW = 140;
    const rootH = 36;
    const rootX = ML;
    const rootY = contentTop + contentHeight / 2 - rootH / 2;

    // Draw root node
    doc.setFillColor(SLATE_900);
    doc.roundedRect(rootX, rootY, rootW, rootH, 6, 6, 'F');
    doc.setTextColor(WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(section.title, rootX + rootW / 2, rootY + rootH / 2 + 3, { align: 'center' });

    // Calculate total child count for even spacing
    let totalLeaves = 0;
    pages.forEach(p => {
      totalLeaves += 1 + (p.children?.length || 0);
    });

    // Page nodes - Level 1
    const pageColX = rootX + rootW + 80;
    const pageW = 130;
    const pageH = 30;
    const pageGap = Math.min(12, (contentHeight - pages.length * pageH) / Math.max(pages.length - 1, 1));
    const totalPageHeight = pages.length * pageH + (pages.length - 1) * pageGap;
    let pageStartY = contentTop + (contentHeight - totalPageHeight) / 2;
    if (pageStartY < contentTop) pageStartY = contentTop;

    // Child nodes - Level 2
    const childColX = pageColX + pageW + 70;
    const childW = 120;
    const childH = 24;

    pages.forEach((page, pIdx) => {
      const pageY = pageStartY + pIdx * (pageH + pageGap);

      // Connector: root → page
      doc.setDrawColor(SLATE_400);
      doc.setLineWidth(1.2);
      const rMidY = rootY + rootH / 2;
      const pMidY = pageY + pageH / 2;
      const cx1 = rootX + rootW + 30;
      const cx2 = pageColX - 30;
      // Bezier curve
      doc.lines(
        [[cx1 - (rootX + rootW), pMidY - rMidY, cx2 - cx1, 0, pageColX - cx2, 0]],
        rootX + rootW,
        rMidY
      );

      // Draw page node
      doc.setFillColor(SITED_BLUE);
      doc.roundedRect(pageColX, pageY, pageW, pageH, 5, 5, 'F');
      doc.setTextColor(WHITE);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const truncName = page.name.length > 18 ? page.name.substring(0, 17) + '…' : page.name;
      doc.text(truncName, pageColX + pageW / 2, pageY + pageH / 2 + 3, { align: 'center' });

      // Child nodes
      if (page.children?.length) {
        const childGap = 6;
        const totalChildH = page.children.length * childH + (page.children.length - 1) * childGap;
        let childStartY = pageY + pageH / 2 - totalChildH / 2;
        if (childStartY < contentTop) childStartY = contentTop;

        page.children.forEach((child, cIdx) => {
          const childY = childStartY + cIdx * (childH + childGap);

          // Connector: page → child
          doc.setDrawColor(SLATE_200);
          doc.setLineWidth(1);
          const pEndX = pageColX + pageW;
          const cStartX = childColX;
          doc.line(pEndX, pageY + pageH / 2, pEndX + 15, pageY + pageH / 2);
          doc.line(pEndX + 15, pageY + pageH / 2, pEndX + 15, childY + childH / 2);
          doc.line(pEndX + 15, childY + childH / 2, cStartX, childY + childH / 2);

          // Draw child node
          doc.setFillColor(SLATE_100);
          doc.setDrawColor(SLATE_200);
          doc.roundedRect(childColX, childY, childW, childH, 4, 4, 'FD');
          doc.setTextColor(SLATE_700);
          doc.setFontSize(8);
          const truncChild = child.length > 16 ? child.substring(0, 15) + '…' : child;
          doc.text(truncChild, childColX + childW / 2, childY + childH / 2 + 3, { align: 'center' });
        });
      }
    });
  });

  doc.save(`${sitemap.name.replace(/\s+/g, '_')}_Sitemap.pdf`);
  toast.success('PDF downloaded');
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminSitemaps() {
  const [sitemaps, setSitemaps] = useState<ProjectSitemap[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [sections, setSections] = useState<SitemapSection[]>([{ title: 'Front-End', pages: [] }]);
  const [activeTab, setActiveTab] = useState('0');

  // ── Fetch ──

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

  // ── CRUD ──

  const resetForm = () => {
    setName('');
    setSelectedLeadId('');
    setSections([{ title: 'Front-End', pages: [] }]);
    setActiveTab('0');
    setEditingId(null);
  };

  const openNew = () => {
    resetForm();
    setSheetOpen(true);
  };

  const openEdit = (sm: ProjectSitemap) => {
    setEditingId(sm.id);
    setName(sm.name);
    setSelectedLeadId(sm.lead_id || '');
    setSections(sm.sections.length ? sm.sections : [{ title: 'Front-End', pages: [] }]);
    setActiveTab('0');
    setSheetOpen(true);
  };

  const saveSitemap = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }

    const payload: any = {
      name: name.trim(),
      lead_id: selectedLeadId || null,
      sections,
    };

    // Try to get build_flow_id if lead selected
    if (selectedLeadId) {
      const { data: bf } = await supabase
        .from('build_flows')
        .select('id')
        .eq('lead_id', selectedLeadId)
        .limit(1)
        .maybeSingle();
      payload.build_flow_id = bf?.id || null;
    }

    if (editingId) {
      const { error } = await supabase
        .from('project_sitemaps')
        .update(payload)
        .eq('id', editingId);
      if (error) { toast.error('Failed to update'); return; }
      toast.success('Sitemap updated');
    } else {
      const { error } = await supabase
        .from('project_sitemaps')
        .insert(payload);
      if (error) { toast.error('Failed to create'); return; }
      toast.success('Sitemap created');
    }

    setSheetOpen(false);
    resetForm();
    fetchSitemaps();
  };

  const deleteSitemap = async (id: string) => {
    if (!confirm('Delete this sitemap?')) return;
    await supabase.from('project_sitemaps').delete().eq('id', id);
    toast.success('Deleted');
    fetchSitemaps();
  };

  // ── Import from Discovery ──

  const importFromDiscovery = async () => {
    if (!selectedLeadId) { toast.error('Select a client first'); return; }

    const { data: bf } = await supabase
      .from('build_flows')
      .select('id')
      .eq('lead_id', selectedLeadId)
      .limit(1)
      .maybeSingle();

    if (!bf) { toast.error('No build flow found for this client'); return; }

    const { data: answers } = await supabase
      .from('discovery_answers')
      .select('question_key, answer_value')
      .eq('build_flow_id', bf.id);

    if (!answers?.length) { toast.error('No discovery answers found'); return; }

    const ansMap: Record<string, string> = {};
    answers.forEach(a => { ansMap[a.question_key] = a.answer_value; });

    const newSections: SitemapSection[] = [];

    // Parse selected portals
    const portals: string[] = safeJsonParse(ansMap['selectedPortals'], []);

    // Front-End
    if (portals.includes('front_end')) {
      const core: string[] = safeJsonParse(ansMap['frontEnd.corePages'], []);
      const marketing: string[] = safeJsonParse(ansMap['frontEnd.marketingPages'], []);
      const custom: string[] = safeJsonParse(ansMap['frontEnd.customPages'], []);
      const allPages = [...core, ...marketing, ...custom].filter(Boolean);
      newSections.push({
        title: 'Front-End',
        pages: allPages.map(p => ({ name: p })),
      });
    }

    // Admin Portal
    if (portals.includes('admin_portal')) {
      const features: string[] = safeJsonParse(ansMap['adminPortal.features'], []);
      newSections.push({
        title: 'Admin Portal',
        pages: [
          { name: 'Dashboard' },
          ...features.map(f => ({ name: f })),
        ],
      });
    }

    // Client Portal
    if (portals.includes('client_portal')) {
      const features: string[] = safeJsonParse(ansMap['clientPortal.features'], []);
      newSections.push({
        title: 'Client Portal',
        pages: [
          { name: 'Dashboard' },
          ...features.map(f => ({ name: f })),
        ],
      });
    }

    // Staff Portal
    if (portals.includes('staff_portal')) {
      const features: string[] = safeJsonParse(ansMap['staffPortal.features'], []);
      newSections.push({
        title: 'Staff Portal',
        pages: [
          { name: 'Dashboard' },
          ...features.map(f => ({ name: f })),
        ],
      });
    }

    if (!newSections.length) {
      toast.error('No portals found in discovery answers');
      return;
    }

    setSections(newSections);
    setActiveTab('0');

    // Auto-fill name from client
    const lead = leads.find(l => l.id === selectedLeadId);
    if (lead && !name) {
      setName(`${lead.business_name || lead.name || 'Client'} Sitemap`);
    }

    toast.success(`Imported ${newSections.length} section(s) from discovery`);
  };

  // ── Section helpers ──

  const addSection = () => {
    const newIdx = sections.length;
    setSections([...sections, { title: `Section ${newIdx + 1}`, pages: [] }]);
    setActiveTab(String(newIdx));
  };

  const removeSection = (idx: number) => {
    if (sections.length <= 1) return;
    const next = sections.filter((_, i) => i !== idx);
    setSections(next);
    setActiveTab('0');
  };

  const updateSectionTitle = (idx: number, title: string) => {
    const next = [...sections];
    next[idx] = { ...next[idx], title };
    setSections(next);
  };

  const addPage = (sIdx: number) => {
    const next = [...sections];
    next[sIdx] = { ...next[sIdx], pages: [...next[sIdx].pages, { name: 'New Page' }] };
    setSections(next);
  };

  const updatePageName = (sIdx: number, pIdx: number, name: string) => {
    const next = [...sections];
    const pages = [...next[sIdx].pages];
    pages[pIdx] = { ...pages[pIdx], name };
    next[sIdx] = { ...next[sIdx], pages };
    setSections(next);
  };

  const removePage = (sIdx: number, pIdx: number) => {
    const next = [...sections];
    next[sIdx] = { ...next[sIdx], pages: next[sIdx].pages.filter((_, i) => i !== pIdx) };
    setSections(next);
  };

  const addChild = (sIdx: number, pIdx: number) => {
    const next = [...sections];
    const pages = [...next[sIdx].pages];
    const children = [...(pages[pIdx].children || []), 'Sub Page'];
    pages[pIdx] = { ...pages[pIdx], children };
    next[sIdx] = { ...next[sIdx], pages };
    setSections(next);
  };

  const updateChild = (sIdx: number, pIdx: number, cIdx: number, value: string) => {
    const next = [...sections];
    const pages = [...next[sIdx].pages];
    const children = [...(pages[pIdx].children || [])];
    children[cIdx] = value;
    pages[pIdx] = { ...pages[pIdx], children };
    next[sIdx] = { ...next[sIdx], pages };
    setSections(next);
  };

  const removeChild = (sIdx: number, pIdx: number, cIdx: number) => {
    const next = [...sections];
    const pages = [...next[sIdx].pages];
    const children = (pages[pIdx].children || []).filter((_, i) => i !== cIdx);
    pages[pIdx] = { ...pages[pIdx], children: children.length ? children : undefined };
    next[sIdx] = { ...next[sIdx], pages };
    setSections(next);
  };

  // ── Render ──

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
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New Sitemap</Button>
      </div>

      {/* ── List ── */}
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
                      <Button size="sm" variant="ghost" onClick={() => openEdit(sm)}><Pencil className="h-4 w-4" /></Button>
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

      {/* ── Create/Edit Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={(o) => { if (!o) resetForm(); setSheetOpen(o); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Sitemap' : 'New Sitemap'}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Name */}
            <div className="space-y-2">
              <Label>Sitemap Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Corp Sitemap" />
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label>Link to Client (optional)</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger><SelectValue placeholder="Select a client…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.business_name || l.name || l.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedLeadId && selectedLeadId !== 'none' && (
                <Button variant="outline" size="sm" onClick={importFromDiscovery}>
                  <Import className="h-4 w-4 mr-2" />Import from Discovery
                </Button>
              )}
            </div>

            {/* Section Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Sections (1 section = 1 PDF page)</Label>
                <Button size="sm" variant="outline" onClick={addSection}><Plus className="h-3 w-3 mr-1" />Add Section</Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex flex-wrap h-auto gap-1">
                  {sections.map((s, i) => (
                    <TabsTrigger key={i} value={String(i)} className="text-xs">
                      {s.title || `Section ${i + 1}`}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {sections.map((section, sIdx) => (
                  <TabsContent key={sIdx} value={String(sIdx)} className="space-y-4">
                    {/* Section title */}
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Section Title</Label>
                        <Input
                          value={section.title}
                          onChange={e => updateSectionTitle(sIdx, e.target.value)}
                          placeholder="e.g. Front-End"
                        />
                      </div>
                      {sections.length > 1 && (
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeSection(sIdx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Pages */}
                    <div className="space-y-3">
                      {section.pages.map((page, pIdx) => (
                        <div key={pIdx} className="border rounded-lg p-3 space-y-2">
                          <div className="flex gap-2 items-center">
                            <Input
                              value={page.name}
                              onChange={e => updatePageName(sIdx, pIdx, e.target.value)}
                              className="flex-1"
                              placeholder="Page name"
                            />
                            <Button variant="outline" size="sm" onClick={() => addChild(sIdx, pIdx)}>
                              <Plus className="h-3 w-3 mr-1" />Sub
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removePage(sIdx, pIdx)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>

                          {page.children?.map((child, cIdx) => (
                            <div key={cIdx} className="flex gap-2 items-center ml-6">
                              <div className="w-4 border-l-2 border-b-2 border-muted h-4 mr-1" />
                              <Input
                                value={child}
                                onChange={e => updateChild(sIdx, pIdx, cIdx, e.target.value)}
                                className="flex-1 h-8 text-sm"
                                placeholder="Sub page name"
                              />
                              <Button variant="ghost" size="icon" className="text-destructive h-6 w-6" onClick={() => removeChild(sIdx, pIdx, cIdx)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ))}

                      <Button variant="outline" size="sm" onClick={() => addPage(sIdx)}>
                        <Plus className="h-3 w-3 mr-1" />Add Page
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={saveSitemap} className="flex-1">
                <FileText className="h-4 w-4 mr-2" />{editingId ? 'Update' : 'Save'} Sitemap
              </Button>
              {sections.some(s => s.pages.length > 0) && (
                <Button
                  variant="outline"
                  onClick={() => generateSitemapPDF({ id: '', lead_id: null, build_flow_id: null, name: name || 'Sitemap', sections, created_at: '', updated_at: '' })}
                >
                  <Download className="h-4 w-4 mr-2" />Preview PDF
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function safeJsonParse<T>(val: string | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}
