import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileDown, Loader2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProposalGeneratorProps {
  buildFlowId: string;
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

export function ProposalGenerator({ buildFlowId, businessName, open, onOpenChange }: ProposalGeneratorProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
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

  const safeSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const pages = parseArray(answers.selectedPages);
  const features = parseArray(answers.selectedFeatures);
  const integrations = parseArray(answers.selectedIntegrations);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const totalItemized = (pages.length * PAGE_PRICE) + (features.length * FEATURE_PRICE) + (integrations.length * INTEGRATION_PRICE);
  const actualPrice = selectedProduct?.price || 0;

  const downloadPDF = async () => {
    if (!selectedProduct) return;
    setGenerating(true);

    const projectType = PROJECT_TYPE_MAP[answers.projectType] || answers.projectType || 'Website';
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const slug = safeSlug(businessName);

    const pageRows = pages.map((p, i) => `
      <tr>
        <td class="item-num">${i + 1}</td>
        <td class="item-desc">Page — "${p}"</td>
        <td class="item-price">$${PAGE_PRICE.toLocaleString()}</td>
      </tr>`).join('');

    const featureRows = features.map((f, i) => `
      <tr>
        <td class="item-num">${pages.length + i + 1}</td>
        <td class="item-desc">Feature — "${f}"</td>
        <td class="item-price">$${FEATURE_PRICE.toLocaleString()}</td>
      </tr>`).join('');

    const integrationRows = integrations.map((ig, i) => `
      <tr>
        <td class="item-num">${pages.length + features.length + i + 1}</td>
        <td class="item-desc">Integration — "${ig}"</td>
        <td class="item-price">$${INTEGRATION_PRICE.toLocaleString()}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 40px 50px; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.6; }

  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 3px solid #0f172a; margin-bottom: 30px; }
  .logo-area { display: flex; align-items: center; gap: 12px; }
  .logo-mark { width: 48px; height: 48px; background: #0f172a; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 20px; letter-spacing: -1px; }
  .logo-text { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -1px; }
  .header-meta { text-align: right; color: #64748b; font-size: 12px; }
  .header-meta strong { color: #0f172a; display: block; font-size: 14px; }

  h1 { font-size: 22px; color: #0f172a; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 14px; margin-bottom: 28px; }

  .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 30px; }
  .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
  .summary-card .label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  .summary-card .value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 2px; }

  h2 { font-size: 16px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 32px; margin-bottom: 12px; }

  table.sow { width: 100%; border-collapse: collapse; margin-top: 8px; }
  table.sow th { text-align: left; background: #0f172a; color: white; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  table.sow th:last-child { text-align: right; }
  table.sow td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  table.sow td.item-num { width: 40px; color: #94a3b8; font-weight: 600; }
  table.sow td.item-price { text-align: right; font-weight: 600; color: #334155; }
  table.sow td.item-desc { font-weight: 500; }
  table.sow tr:nth-child(even) { background: #fafbfc; }

  .totals { margin-top: 20px; text-align: right; }
  .total-line { font-size: 16px; font-weight: 600; color: #94a3b8; text-decoration: line-through; margin-bottom: 6px; }
  .actual-line { display: flex; align-items: baseline; justify-content: flex-end; gap: 12px; }
  .actual-label { font-size: 14px; color: #0f172a; font-weight: 600; }
  .actual-price { font-size: 28px; font-weight: 800; color: #0f172a; }
  .product-badge { display: inline-block; background: #0f172a; color: white; padding: 4px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-top: 8px; letter-spacing: 0.03em; }

  .disclaimer { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; margin-top: 30px; font-size: 12px; line-height: 1.7; color: #78350f; border-radius: 0 8px 8px 0; }

  .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #e2e8f0; color: #94a3b8; font-size: 11px; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <div class="logo-mark">S</div>
      <span class="logo-text">Sited</span>
    </div>
    <div class="header-meta">
      <strong>Statement of Work</strong>
      ${today}
    </div>
  </div>

  <h1>Proposal — ${businessName}</h1>
  <p class="subtitle">${projectType} · Prepared by Sited</p>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Pages</div>
      <div class="value">${pages.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Features</div>
      <div class="value">${features.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Integrations</div>
      <div class="value">${integrations.length}</div>
    </div>
  </div>

  <h2>Scope of Works</h2>
  <table class="sow">
    <thead>
      <tr>
        <th>#</th>
        <th>Item</th>
        <th>Price</th>
      </tr>
    </thead>
    <tbody>
      ${pageRows}
      ${featureRows}
      ${integrationRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-line">Total: $${totalItemized.toLocaleString()}</div>
    <div class="actual-line">
      <span class="actual-label">Your Price:</span>
      <span class="actual-price">$${actualPrice.toLocaleString()}</span>
    </div>
    <div class="product-badge">${selectedProduct?.name || ''} Package</div>
  </div>

  <div class="disclaimer">
    All pages, features, and integrations listed above &amp; as discussed in our discovery call will be completed into what we build for you, using your personalised design preferences, and requests — Additional features may come at an additional cost, unless you are covered with the "Sited Care Plan" for all changes.
  </div>

  <div class="footer">
    <span>Sited · Web Design &amp; Development · sited.co</span>
    <span>${slug}.sited.sow</span>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.document.title = `${slug}.sited.sow`;
        setTimeout(() => printWindow.print(), 500);
      });
    }

    setGenerating(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Proposal — {businessName}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[55vh] pr-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading data…</div>
          ) : (
            <div className="space-y-4">
              {/* Product Tier Selection */}
              <div className="space-y-2">
                <Label>Package Tier</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — ${p.price.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Itemised Preview */}
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

                <div className="border-t pt-3 mt-3 text-right space-y-1">
                  <p className="text-sm text-muted-foreground line-through">Total: ${totalItemized.toLocaleString()}</p>
                  <p className="text-lg font-bold">
                    {selectedProduct ? `$${actualPrice.toLocaleString()}` : '—'}
                    {selectedProduct && <span className="text-xs font-normal text-muted-foreground ml-2">{selectedProduct.name} Package</span>}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Download: <code className="bg-muted px-1 rounded">{slug(businessName)}.sited.sow.pdf</code>
              </p>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={downloadPDF} disabled={loading || generating || !selectedProductId}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            Download Proposal PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  function slug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}
