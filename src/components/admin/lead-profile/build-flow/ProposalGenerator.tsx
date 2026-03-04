import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileDown, Loader2, FileText, Eye, ArrowLeft } from 'lucide-react';
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
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setPreviewHtml(null);
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
  const fileSlug = toSlug(businessName);
  const fileName = `${fileSlug}.sited.sow.pdf`;

  const buildHtml = () => {
    if (!selectedProduct) return '';
    const projectType = PROJECT_TYPE_MAP[answers.projectType] || answers.projectType || 'Website';
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    let rowNum = 0;
    const makeRow = (desc: string, price: string, isFree = false) => {
      rowNum++;
      const priceClass = isFree ? 'free-price' : 'price';
      return `<tr>
        <td class="num-cell">${String(rowNum).padStart(2, '0')}</td>
        <td class="desc-cell">${desc}</td>
        <td class="price-cell ${priceClass}">${price}</td>
      </tr>`;
    };

    const pageRows = pages.map(p => makeRow(`Page — ${p}`, `$${PAGE_PRICE}`)).join('');
    const featureRows = features.map(f => makeRow(`Feature — ${f}`, `$${FEATURE_PRICE}`)).join('');
    const integrationRows = integrations.map(ig => makeRow(`Integration — ${ig}`, `$${INTEGRATION_PRICE}`)).join('');
    const freeRows = [
      makeRow('SEO Optimisation', 'FREE', true),
      makeRow('Device Design Optimisation', 'FREE', true),
      makeRow(`${revisionRounds} Revision Round${revisionRounds === '1' ? '' : 's'} Included`, 'FREE', true),
    ].join('');

    const savings = totalItemized - actualPrice;

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #1e293b;
    font-size: 12.5px;
    line-height: 1.5;
    background: #ffffff;
    padding: 0;
  }

  .page {
    max-width: 794px;
    margin: 0 auto;
    padding: 48px 52px;
  }

  /* ── Header ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .brand-icon {
    width: 44px; height: 44px;
    background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 800;
    font-size: 20px;
  }
  .brand-name {
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
  }
  .doc-meta {
    text-align: right;
    font-size: 11px;
    color: #64748b;
    line-height: 1.7;
  }
  .doc-meta .doc-type {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  /* ── Divider ── */
  .divider {
    height: 3px;
    background: linear-gradient(90deg, #0f172a 0%, #64748b 50%, #e2e8f0 100%);
    border-radius: 2px;
    margin-bottom: 36px;
  }

  /* ── Title Block ── */
  .title-block {
    margin-bottom: 32px;
  }
  .title-block h1 {
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 6px;
  }
  .title-block .sub {
    font-size: 13px;
    color: #64748b;
  }
  .title-block .sub span {
    display: inline-block;
    margin: 0 6px;
    color: #cbd5e1;
  }

  /* ── Stat Cards ── */
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 14px;
    margin-bottom: 36px;
  }
  .stat-card {
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px 18px;
    text-align: center;
    background: #f8fafc;
  }
  .stat-card .stat-num {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
  }
  .stat-card .stat-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94a3b8;
    margin-top: 2px;
  }

  /* ── Section Title ── */
  .section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #94a3b8;
    margin-bottom: 14px;
  }

  /* ── Table ── */
  .sow-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 24px;
  }
  .sow-table thead th {
    background: #0f172a;
    color: #f8fafc;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 12px 18px;
    font-weight: 600;
    text-align: left;
  }
  .sow-table thead th:first-child { width: 50px; }
  .sow-table thead th:last-child { text-align: right; }

  .sow-table tbody tr { border-bottom: 1px solid #f1f5f9; }
  .sow-table tbody tr:last-child td { border-bottom: none; }
  .sow-table tbody tr:nth-child(even) { background: #fafbfd; }

  .sow-table td {
    padding: 11px 18px;
    font-size: 12.5px;
    border-bottom: 1px solid #f1f5f9;
  }
  .sow-table .num-cell {
    color: #94a3b8;
    font-weight: 700;
    font-size: 11px;
    width: 50px;
  }
  .sow-table .desc-cell { font-weight: 500; color: #1e293b; }
  .sow-table .price-cell { text-align: right; font-weight: 600; color: #334155; white-space: nowrap; }
  .sow-table .price-cell.free-price {
    color: #16a34a;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.5px;
  }

  /* ── Totals ── */
  .totals-box {
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 32px;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 24px;
  }
  .totals-row.strikethrough {
    background: #fafbfd;
    border-bottom: 1px solid #f1f5f9;
  }
  .totals-row.strikethrough .val {
    text-decoration: line-through;
    color: #94a3b8;
    font-size: 15px;
    font-weight: 600;
  }
  .totals-row.strikethrough .lbl { color: #94a3b8; font-size: 12px; }

  .totals-row.savings {
    background: #f0fdf4;
    border-bottom: 1px solid #dcfce7;
  }
  .totals-row.savings .lbl { color: #16a34a; font-size: 12px; font-weight: 600; }
  .totals-row.savings .val { color: #16a34a; font-size: 15px; font-weight: 700; }

  .totals-row.final {
    background: #0f172a;
    padding: 18px 24px;
  }
  .totals-row.final .lbl { color: #94a3b8; font-size: 13px; font-weight: 600; }
  .totals-row.final .val { color: #ffffff; font-size: 26px; font-weight: 800; }
  .totals-row.final .pkg-badge {
    display: inline-block;
    background: rgba(255,255,255,0.15);
    color: #e2e8f0;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 4px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-left: 12px;
    vertical-align: middle;
  }

  /* ── Disclaimer ── */
  .disclaimer {
    border: 1.5px solid #fde68a;
    border-radius: 10px;
    background: #fffbeb;
    padding: 18px 22px;
    font-size: 11.5px;
    color: #92400e;
    line-height: 1.7;
    margin-bottom: 40px;
  }

  /* ── Footer ── */
  .footer {
    border-top: 1.5px solid #e2e8f0;
    padding-top: 16px;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #94a3b8;
  }
  .footer a { color: #64748b; text-decoration: none; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">
      <div class="brand-icon">S</div>
      <div class="brand-name">Sited</div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">Statement of Work</div>
      Ref: SOW-${fileSlug.toUpperCase().slice(0, 8)}<br/>
      ${today}
    </div>
  </div>

  <div class="divider"></div>

  <div class="title-block">
    <h1>${businessName}</h1>
    <div class="sub">${projectType}<span>·</span>Prepared by Sited<span>·</span>${today}</div>
  </div>

  <div class="stats">
    <div class="stat-card"><div class="stat-num">${pages.length}</div><div class="stat-label">Pages</div></div>
    <div class="stat-card"><div class="stat-num">${features.length}</div><div class="stat-label">Features</div></div>
    <div class="stat-card"><div class="stat-num">${integrations.length}</div><div class="stat-label">Integrations</div></div>
  </div>

  <div class="section-title">Scope of Works</div>
  <table class="sow-table">
    <thead><tr><th>#</th><th>Item Description</th><th>Price</th></tr></thead>
    <tbody>
      ${pageRows}
      ${featureRows}
      ${integrationRows}
      ${freeRows}
    </tbody>
  </table>

  <div class="totals-box">
    <div class="totals-row strikethrough">
      <span class="lbl">Itemised Total</span>
      <span class="val">$${totalItemized.toLocaleString()}</span>
    </div>
    <div class="totals-row savings">
      <span class="lbl">You Save</span>
      <span class="val">$${savings.toLocaleString()}</span>
    </div>
    <div class="totals-row final">
      <span class="lbl">Your Price</span>
      <span class="val">$${actualPrice.toLocaleString()}<span class="pkg-badge">${selectedProduct?.name} Package</span></span>
    </div>
  </div>

  <div class="disclaimer">
    All pages, features, and integrations listed above &amp; as discussed in our discovery call will be completed into what we build for you, using your personalised design preferences, and requests — Additional features may come at an additional cost, unless you are covered with the "Sited Care Plan" for all changes.
  </div>

  <div class="footer">
    <span>Sited · Web Design &amp; Development</span>
    <span>${fileSlug}.sited.sow</span>
  </div>
</div>
</body></html>`;
  };

  const handlePreview = () => {
    const html = buildHtml();
    if (html) setPreviewHtml(html);
  };

  const handleDownload = async () => {
    if (!previewHtml) return;
    setDownloading(true);

    try {
      const html2pdf = (await import('html2pdf.js')).default;

      // Create an offscreen container with the HTML
      const container = document.createElement('div');
      container.innerHTML = previewHtml;
      // Extract just the body content
      const bodyMatch = previewHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const styleMatch = previewHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);

      const renderDiv = document.createElement('div');
      renderDiv.style.position = 'fixed';
      renderDiv.style.left = '-9999px';
      renderDiv.style.top = '0';
      renderDiv.style.width = '794px';
      renderDiv.style.background = '#ffffff';

      if (styleMatch) {
        const styleEl = document.createElement('style');
        styleEl.textContent = styleMatch[1];
        renderDiv.appendChild(styleEl);
      }
      if (bodyMatch) {
        const bodyDiv = document.createElement('div');
        bodyDiv.innerHTML = bodyMatch[1];
        renderDiv.appendChild(bodyDiv);
      }

      document.body.appendChild(renderDiv);

      await html2pdf()
        .set({
          margin: 0,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, width: 794 },
          jsPDF: { unit: 'px', format: [794, 1123], hotfixes: ['px_scaling'] },
        })
        .from(renderDiv)
        .save();

      document.body.removeChild(renderDiv);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {previewHtml ? 'Proposal Preview' : 'Generate Proposal'} — {businessName}
          </DialogTitle>
        </DialogHeader>

        {previewHtml ? (
          <>
            <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-white">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[62vh] border-0"
                title="Proposal Preview"
              />
            </div>
            <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
              <Button variant="outline" onClick={() => setPreviewHtml(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleDownload} disabled={downloading}>
                {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                Download PDF
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
              <Button onClick={handlePreview} disabled={loading || !selectedProductId}>
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
