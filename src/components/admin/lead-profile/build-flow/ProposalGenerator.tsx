import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Eye, ArrowLeft, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProposalGeneratorProps {
  buildFlowId: string;
  leadId: string;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
}

const PAGE_PRICE = 159;
const FEATURE_PRICE = 300;
const INTEGRATION_PRICE = 199;

const PROJECT_TYPE_MAP: Record<string, string> = {
  brochure: 'Brochure / Information Website',
  ecommerce: 'E-Commerce Store',
  webapp: 'Web Application / SaaS / Portal',
  booking: 'Booking / Service Website',
};

export function ProposalGenerator({ buildFlowId, leadId, businessName, open, onOpenChange }: ProposalGeneratorProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const renderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setShowPreview(false);
      return;
    }
    setLoading(true);
    Promise.all([
      supabase
        .from('discovery_answers')
        .select('question_key, answer_value')
        .eq('build_flow_id', buildFlowId),
      supabase
        .from('products')
        .select('id, name, price, is_active')
        .eq('is_active', true)
        .order('price', { ascending: true }),
    ]).then(([answersRes, productsRes]) => {
      const map: Record<string, string> = {};
      (answersRes.data || []).forEach((row: any) => {
        map[row.question_key] = row.answer_value;
      });
      setAnswers(map);
      const prods = (productsRes.data || []) as Product[];
      setProducts(prods);
      if (prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id);
      }
      setLoading(false);
    });
  }, [open, buildFlowId]);

  const parseArray = (val: string | undefined): string[] => {
    if (!val) return [];
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
  };

  const toSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const pages = parseArray(answers.selectedPages);
  const features = parseArray(answers.selectedFeatures);
  const integrations = parseArray(answers.selectedIntegrations);
  const revisionRounds = answers.revisionRounds || '2';

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const totalItemized = (pages.length * PAGE_PRICE) + (features.length * FEATURE_PRICE) + (integrations.length * INTEGRATION_PRICE);
  const actualPrice = selectedProduct?.price || 0;
  const savings = totalItemized - actualPrice;
  const fileSlug = toSlug(businessName);
  const fileName = `${fileSlug}.sited.sow.pdf`;

  const projectType = PROJECT_TYPE_MAP[answers.projectType] || answers.projectType || 'Website';
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Build all row items
  const allItems: { desc: string; price: string; isFree: boolean }[] = [];
  pages.forEach(p => allItems.push({ desc: `Page — ${p}`, price: `$${PAGE_PRICE}`, isFree: false }));
  features.forEach(f => allItems.push({ desc: `Feature — ${f}`, price: `$${FEATURE_PRICE}`, isFree: false }));
  integrations.forEach(ig => allItems.push({ desc: `Integration — ${ig}`, price: `$${INTEGRATION_PRICE}`, isFree: false }));
  allItems.push({ desc: 'SEO Optimisation', price: 'FREE', isFree: true });
  allItems.push({ desc: 'Device Design Optimisation', price: 'FREE', isFree: true });
  allItems.push({ desc: `${revisionRounds} Revision Round${revisionRounds === '1' ? '' : 's'} Included`, price: 'FREE', isFree: true });

  const generatePdfBlob = useCallback(async (): Promise<Blob | null> => {
    const el = renderRef.current;
    if (!el) return null;

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
    });

    const pdf = new jsPDF('p', 'px', [794, 1123]);
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 794;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 1123;

    while (heightLeft > 0) {
      position -= 1123;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 1123;
    }

    return pdf.output('blob');
  }, []);

  const handleSaveToGoogleDrive = async () => {
    setGenerating(true);
    try {
      const blob = await generatePdfBlob();
      if (!blob) {
        toast.error('Failed to generate PDF');
        return;
      }

      // Create a temporary object URL and open Google Drive upload
      const url = URL.createObjectURL(blob);

      // First, trigger a local download so the user has the file
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Then open Google Drive upload page
      setTimeout(() => {
        window.open('https://drive.google.com/drive/my-drive', '_blank');
        URL.revokeObjectURL(url);
        toast.success('PDF downloaded! Upload it to the Google Drive window that just opened.');
      }, 500);
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {showPreview ? 'Proposal Preview' : 'Generate Proposal'} — {businessName}
          </DialogTitle>
        </DialogHeader>

        {showPreview ? (
          <>
            {/* Scrollable preview of the rendered proposal */}
            <ScrollArea className="flex-1 max-h-[62vh] border rounded-lg bg-white">
              <div
                ref={renderRef}
                style={{
                  width: 794,
                  padding: '48px 52px',
                  fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
                  color: '#1e293b',
                  fontSize: '12.5px',
                  lineHeight: 1.5,
                  background: '#ffffff',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44,
                      background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                      borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 800, fontSize: 20,
                    }}>S</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>Sited</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: '#64748b', lineHeight: 1.7 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                      Statement of Work
                    </div>
                    Ref: SOW-{fileSlug.toUpperCase().slice(0, 8)}<br />{today}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 3, background: 'linear-gradient(90deg, #0f172a 0%, #64748b 50%, #e2e8f0 100%)', borderRadius: 2, marginBottom: 36 }} />

                {/* Title */}
                <div style={{ marginBottom: 32 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{businessName}</h1>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    {projectType} <span style={{ margin: '0 6px', color: '#cbd5e1' }}>·</span> Prepared by Sited <span style={{ margin: '0 6px', color: '#cbd5e1' }}>·</span> {today}
                  </div>
                </div>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 36 }}>
                  {[
                    { num: pages.length, label: 'Pages' },
                    { num: features.length, label: 'Features' },
                    { num: integrations.length, label: 'Integrations' },
                  ].map((s, i) => (
                    <div key={i} style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '16px 18px', textAlign: 'center', background: '#f8fafc' }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{s.num}</div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Section Title */}
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', marginBottom: 14 }}>
                  Scope of Works
                </div>

                {/* Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#0f172a', color: '#f8fafc', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, padding: '12px 18px', fontWeight: 600, textAlign: 'left', width: 50 }}>#</th>
                      <th style={{ background: '#0f172a', color: '#f8fafc', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, padding: '12px 18px', fontWeight: 600, textAlign: 'left' }}>Item Description</th>
                      <th style={{ background: '#0f172a', color: '#f8fafc', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allItems.map((item, i) => (
                      <tr key={i} style={{ background: i % 2 === 1 ? '#fafbfd' : '#ffffff' }}>
                        <td style={{ padding: '11px 18px', fontSize: 11, color: '#94a3b8', fontWeight: 700, width: 50, borderBottom: '1px solid #f1f5f9' }}>
                          {String(i + 1).padStart(2, '0')}
                        </td>
                        <td style={{ padding: '11px 18px', fontSize: 12.5, fontWeight: 500, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                          {item.desc}
                        </td>
                        <td style={{
                          padding: '11px 18px', textAlign: 'right', fontWeight: item.isFree ? 700 : 600,
                          color: item.isFree ? '#16a34a' : '#334155', fontSize: item.isFree ? 11 : 12.5,
                          letterSpacing: item.isFree ? 0.5 : 0, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap',
                        }}>
                          {item.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', background: '#fafbfd', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>Itemised Total</span>
                    <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: 15, fontWeight: 600 }}>${totalItemized.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', background: '#f0fdf4', borderBottom: '1px solid #dcfce7' }}>
                    <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 600 }}>You Save</span>
                    <span style={{ color: '#16a34a', fontSize: 15, fontWeight: 700 }}>${savings.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', background: '#0f172a' }}>
                    <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Your Price</span>
                    <span style={{ color: '#ffffff', fontSize: 26, fontWeight: 800 }}>
                      ${actualPrice.toLocaleString()}
                      <span style={{
                        display: 'inline-block', background: 'rgba(255,255,255,0.15)', color: '#e2e8f0',
                        fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 4,
                        letterSpacing: 0.5, textTransform: 'uppercase', marginLeft: 12, verticalAlign: 'middle',
                      }}>{selectedProduct?.name} Package</span>
                    </span>
                  </div>
                </div>

                {/* Disclaimer */}
                <div style={{
                  border: '1.5px solid #fde68a', borderRadius: 10, background: '#fffbeb',
                  padding: '18px 22px', fontSize: 11.5, color: '#92400e', lineHeight: 1.7, marginBottom: 40,
                }}>
                  All pages, features, and integrations listed above &amp; as discussed in our discovery call will be completed into what we build for you, using your personalised design preferences, and requests — Additional features may come at an additional cost, unless you are covered with the "Sited Care Plan" for all changes.
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                  <span>Sited · Web Design &amp; Development</span>
                  <span>{fileSlug}.sited.sow</span>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleSaveToGoogleDrive} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Save to Google Drive
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <ScrollArea className="max-h-[55vh] pr-4">
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">Loading data…</div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Package Tier</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — ${p.price.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-lg border p-4 space-y-3">
                    <h4 className="text-sm font-semibold">Scope of Works</h4>
                    {pages.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Pages ({pages.length} × ${PAGE_PRICE})</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pages.map((p, i) => <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>)}
                        </div>
                      </div>
                    )}
                    {features.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Features ({features.length} × ${FEATURE_PRICE})</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {features.map((f, i) => <Badge key={i} variant="outline" className="text-xs">{f}</Badge>)}
                        </div>
                      </div>
                    )}
                    {integrations.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Integrations ({integrations.length} × ${INTEGRATION_PRICE})</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {integrations.map((ig, i) => <Badge key={i} variant="outline" className="text-xs">{ig}</Badge>)}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-muted-foreground">Included at no extra cost</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">SEO Optimisation — FREE</Badge>
                        <Badge variant="secondary" className="text-xs">Device Design Optimisation — FREE</Badge>
                        <Badge variant="secondary" className="text-xs">{revisionRounds} Revision Round{revisionRounds === '1' ? '' : 's'} — FREE</Badge>
                      </div>
                    </div>
                    <div className="border-t pt-3 mt-3 text-right space-y-1">
                      <p className="text-sm text-muted-foreground line-through">Total: ${totalItemized.toLocaleString()}</p>
                      <p className="text-lg font-bold">
                        {selectedProduct ? `$${actualPrice.toLocaleString()}` : '—'}
                        {selectedProduct && <span className="text-xs font-normal text-muted-foreground ml-2">{selectedProduct.name} Package</span>}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    File: <code className="bg-muted px-1 rounded">{fileName}</code>
                  </p>
                </div>
              )}
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => setShowPreview(true)} disabled={loading || !selectedProductId}>
                <Eye className="h-4 w-4 mr-2" />
                Generate Proposal
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
