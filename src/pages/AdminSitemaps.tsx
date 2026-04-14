import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Pencil, Trash2, Package, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { generateSitemapPDF, type ProjectSitemap } from '@/lib/sitemap-pdf';
import { WebBuilderDialog } from '@/components/admin/sitemap/WebBuilderDialog';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LeadOption {
  id: string;
  name: string | null;
  business_name: string | null;
}

interface CustomWeb {
  id: string;
  name: string;
  description: string | null;
  pages: any[];
  is_preset: boolean;
}

function countNodes(pages: any[]): number {
  return pages.reduce((sum: number, p: any) => sum + 1 + (p.children ? countNodes(p.children) : 0), 0);
}

// ─── Component ─────────────────────────────────────────────────────────────────

export { generateSitemapPDF } from '@/lib/sitemap-pdf';

export default function AdminSitemaps() {
  const navigate = useNavigate();
  const [sitemaps, setSitemaps] = useState<ProjectSitemap[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Webs state
  const [customWebs, setCustomWebs] = useState<CustomWeb[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWeb, setEditingWeb] = useState<CustomWeb | null>(null);
  const [expandedWebId, setExpandedWebId] = useState<string | null>(null);

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

  const fetchWebs = useCallback(async () => {
    const { data } = await supabase.from('sitemap_webs').select('*').order('created_at', { ascending: false });
    if (data) setCustomWebs(data.map((w: any) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      pages: Array.isArray(w.pages) ? w.pages : [],
      is_preset: w.is_preset,
    })));
  }, []);

  useEffect(() => { fetchSitemaps(); fetchLeads(); fetchWebs(); }, [fetchSitemaps, fetchLeads, fetchWebs]);

  const deleteSitemap = async (id: string) => {
    if (!confirm('Delete this sitemap?')) return;
    await supabase.from('project_sitemaps').delete().eq('id', id);
    toast.success('Deleted');
    fetchSitemaps();
  };

  const deleteWeb = async (id: string) => {
    if (!confirm('Delete this web template? It will no longer be available in the sitemap builder.')) return;
    const { error } = await supabase.from('sitemap_webs').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Web deleted');
    fetchWebs();
  };

  const getLeadLabel = (leadId: string | null) => {
    if (!leadId) return '—';
    const lead = leads.find(l => l.id === leadId);
    return lead ? (lead.business_name || lead.name || lead.id.slice(0, 8)) : leadId.slice(0, 8);
  };

  const renderPreviewTree = (pages: any[], depth = 0): JSX.Element => (
    <div className={`${depth > 0 ? 'ml-4 border-l border-border pl-3' : ''} space-y-0.5`}>
      {pages.map((p: any, i: number) => (
        <div key={i}>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              p.nodeType === 'popup' ? 'bg-amber-500' :
              p.nodeType === 'tab' ? 'bg-blue-500' :
              p.nodeType === 'note' ? 'bg-muted-foreground/40' :
              'bg-primary'
            }`} />
            <span className={`text-xs text-muted-foreground ${p.nodeType === 'note' ? 'italic' : ''}`}>{p.name}</span>
            {p.nodeType !== 'page' && (
              <span className="text-[9px] text-muted-foreground/60">({p.nodeType})</span>
            )}
          </div>
          {p.children?.length > 0 && renderPreviewTree(p.children, depth + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sitemaps</h1>
          <p className="text-sm text-muted-foreground">Create visual sitemap PDFs for client projects</p>
        </div>
        <Button onClick={() => navigate('/admin/sitemaps/new')}>
          <Plus className="h-4 w-4 mr-2" />New Sitemap
        </Button>
      </div>

      {/* Sitemaps Table */}
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

      {/* Web Templates Builder */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">Web Templates</CardTitle>
                <CardDescription>Reusable sitemap structures available in the builder's Functions panel</CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={() => { setEditingWeb(null); setShowBuilder(true); }}>
              <Plus className="h-4 w-4 mr-2" />New Web
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customWebs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No web templates yet</p>
              <p className="text-xs mt-1 mb-3">Create reusable sitemap segments that can be dropped into any project sitemap.</p>
              <Button variant="outline" size="sm" onClick={() => { setEditingWeb(null); setShowBuilder(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Your First Web
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {customWebs.map(web => (
                <div key={web.id} className="border border-border rounded-lg overflow-hidden">
                  {/* Web header row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setExpandedWebId(expandedWebId === web.id ? null : web.id)}
                  >
                    {expandedWebId === web.id
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{web.name}</p>
                      {web.description && <p className="text-xs text-muted-foreground">{web.description}</p>}
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">{countNodes(web.pages)} nodes</Badge>
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => { setEditingWeb(web); setShowBuilder(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteWeb(web.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded tree preview */}
                  {expandedWebId === web.id && (
                    <div className="px-4 pb-3 border-t border-border pt-3 bg-muted/10">
                      {renderPreviewTree(web.pages)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Web Builder Dialog */}
      {showBuilder && (
        <WebBuilderDialog
          open={showBuilder}
          onOpenChange={setShowBuilder}
          editingWeb={editingWeb}
          onSaved={fetchWebs}
        />
      )}
    </div>
  );
}
