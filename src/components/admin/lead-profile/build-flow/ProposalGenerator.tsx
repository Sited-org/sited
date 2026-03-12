import { useState, useEffect, useCallback } from 'react';
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

// Brand colours
const SLATE_900 = '#0f172a';
const SLATE_700 = '#334155';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';
const SLATE_50 = '#f8fafc';
const GREEN_600 = '#16a34a';
const GREEN_50 = '#f0fdf4';
const AMBER_100 = '#fde68a';
const AMBER_50 = '#fffbeb';
const AMBER_800 = '#92400e';
const SITED_BLUE = '#3b82f6';
const WHITE = '#ffffff';

export function ProposalGenerator({ buildFlowId, leadId, businessName, open, onOpenChange }: ProposalGeneratorProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);

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
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  const allItems: { desc: string; price: string; isFree: boolean }[] = [];
  pages.forEach(p => allItems.push({ desc: `Page — ${p}`, price: `$${PAGE_PRICE}`, isFree: false }));
  features.forEach(f => allItems.push({ desc: `Feature — ${f}`, price: `$${FEATURE_PRICE}`, isFree: false }));
  integrations.forEach(ig => allItems.push({ desc: `Integration — ${ig}`, price: `$${INTEGRATION_PRICE}`, isFree: false }));
  allItems.push({ desc: 'SEO Optimisation', price: 'FREE', isFree: true });
  allItems.push({ desc: 'Device Design Optimisation', price: 'FREE', isFree: true });
  allItems.push({ desc: `${revisionRounds} Revision Round${revisionRounds === '1' ? '' : 's'} Included`, price: 'FREE', isFree: true });

  const generatePdfBlob = useCallback(async (): Promise<Blob | null> => {
    const { jsPDF } = await import('jspdf');

    const W = 595.28; // A4 width in pt
    const H = 841.89; // A4 height in pt
    const ML = 48; // margin left
    const MR = 48;
    const MT = 48;
    const MB = 60;
    const CW = W - ML - MR; // content width

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = MT;

    const checkPage = (needed: number) => {
      if (y + needed > H - MB) {
        // Footer on current page
        drawFooter(pdf, W, H);
        pdf.addPage();
        y = MT;
      }
    };

    const drawFooter = (doc: any, w: number, h: number) => {
      doc.setDrawColor(SLATE_200);
      doc.setLineWidth(0.5);
      doc.line(ML, h - 40, w - MR, h - 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(SLATE_400);
      doc.text('Sited · Web Design & Development', ML, h - 28);
      doc.text(`${fileSlug}.sited.sow`, w - MR, h - 28, { align: 'right' });
    };

    // ─── HEADER ───
    // Logo: "Sited." in black, ".co" in blue
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(SLATE_900);
    pdf.text('Sited.', ML, y + 20);
    const sitedWidth = pdf.getTextWidth('Sited.');
    pdf.setTextColor(SITED_BLUE);
    pdf.text('co', ML + sitedWidth, y + 20);

    // Right side: SOW ref
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(SLATE_900);
    pdf.text('STATEMENT OF WORK', W - MR, y + 8, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(SLATE_500);
    pdf.text(`Ref: SOW-${fileSlug.toUpperCase().slice(0, 8)}`, W - MR, y + 20, { align: 'right' });
    pdf.text(today, W - MR, y + 31, { align: 'right' });

    y += 44;

    // Gradient divider
    const gradSteps = 60;
    for (let i = 0; i < gradSteps; i++) {
      const ratio = i / gradSteps;
      const r = Math.round(15 + ratio * (226 - 15));
      const g = Math.round(23 + ratio * (232 - 23));
      const b = Math.round(42 + ratio * (240 - 42));
      pdf.setDrawColor(r, g, b);
      pdf.setLineWidth(2.5);
      const segW = CW / gradSteps;
      pdf.line(ML + i * segW, y, ML + (i + 1) * segW, y);
    }
    y += 20;

    // ─── CLIENT NAME & PROJECT TYPE ───
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(SLATE_900);
    pdf.text(businessName, ML, y + 16);
    y += 26;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(SLATE_500);
    pdf.text(`${projectType}  ·  Prepared by Sited  ·  ${today}`, ML, y + 8);
    y += 28;

    // ─── STAT CARDS ───
    const cardW = (CW - 16) / 3;
    const stats = [
      { num: String(pages.length), label: 'PAGES' },
      { num: String(features.length), label: 'FEATURES' },
      { num: String(integrations.length), label: 'INTEGRATIONS' },
    ];
    stats.forEach((s, i) => {
      const x = ML + i * (cardW + 8);
      pdf.setDrawColor(SLATE_200);
      pdf.setFillColor(SLATE_50);
      pdf.roundedRect(x, y, cardW, 52, 6, 6, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(SLATE_900);
      pdf.text(s.num, x + cardW / 2, y + 26, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(SLATE_400);
      pdf.text(s.label, x + cardW / 2, y + 40, { align: 'center' });
    });
    y += 68;

    // ─── SCOPE SECTION TITLE ───
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(SLATE_400);
    pdf.text('SCOPE OF WORKS', ML, y + 8);
    y += 20;

    // ─── TABLE HEADER ───
    const colNum = 40;
    const colPrice = 70;
    const colDesc = CW - colNum - colPrice;
    const rowH = 28;
    const headerH = 30;

    const drawTableHeader = () => {
      pdf.setFillColor(SLATE_900);
      pdf.roundedRect(ML, y, CW, headerH, 4, 4, 'F');
      // Cover bottom corners
      pdf.rect(ML, y + headerH - 4, CW, 4, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(WHITE);
      pdf.text('#', ML + 14, y + 18);
      pdf.text('ITEM DESCRIPTION', ML + colNum + 14, y + 18);
      pdf.text('PRICE', W - MR - 14, y + 18, { align: 'right' });
      y += headerH;
    };

    drawTableHeader();

    // ─── TABLE ROWS ───
    allItems.forEach((item, i) => {
      checkPage(rowH);

      // If we're at top of a new page, re-draw the header
      if (y === MT) {
        drawTableHeader();
      }

      const bgColor = i % 2 === 1 ? SLATE_50 : WHITE;
      pdf.setFillColor(bgColor);
      pdf.rect(ML, y, CW, rowH, 'F');

      // Bottom border
      pdf.setDrawColor(SLATE_100);
      pdf.setLineWidth(0.3);
      pdf.line(ML, y + rowH, ML + CW, y + rowH);

      // Row number
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(SLATE_400);
      pdf.text(String(i + 1).padStart(2, '0'), ML + 14, y + 17);

      // Description
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(SLATE_900);
      pdf.text(item.desc, ML + colNum + 14, y + 17);

      // Price
      if (item.isFree) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(GREEN_600);
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(SLATE_700);
      }
      pdf.text(item.price, W - MR - 14, y + 17, { align: 'right' });

      y += rowH;
    });

    y += 12;

    // ─── TOTALS SECTION ───
    checkPage(110);

    // Itemised total (struck through)
    pdf.setFillColor(SLATE_50);
    pdf.roundedRect(ML, y, CW, 36, 6, 6, 'F');
    // Cover bottom corners for middle join
    pdf.rect(ML, y + 30, CW, 6, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(SLATE_400);
    pdf.text('Itemised Total', ML + 20, y + 22);
    const itemTotalStr = `$${totalItemized.toLocaleString()}`;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    const itW = pdf.getTextWidth(itemTotalStr);
    pdf.text(itemTotalStr, W - MR - 20, y + 22, { align: 'right' });
    // Strikethrough line
    pdf.setDrawColor(SLATE_400);
    pdf.setLineWidth(0.8);
    pdf.line(W - MR - 20 - itW, y + 19, W - MR - 20, y + 19);
    y += 36;

    // You Save
    pdf.setFillColor(GREEN_50);
    pdf.rect(ML, y, CW, 36, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(GREEN_600);
    pdf.text('You Save', ML + 20, y + 22);
    pdf.setFontSize(12);
    pdf.text(`$${savings.toLocaleString()}`, W - MR - 20, y + 22, { align: 'right' });
    y += 36;

    // Your Price (dark bar)
    pdf.setFillColor(SLATE_900);
    pdf.roundedRect(ML, y, CW, 48, 6, 6, 'F');
    // Cover top corners
    pdf.rect(ML, y, CW, 6, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(SLATE_400);
    pdf.text('Your Price', ML + 20, y + 30);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(WHITE);
    const priceStr = `$${actualPrice.toLocaleString()}`;
    pdf.text(priceStr, W - MR - 20, y + 32, { align: 'right' });
    // Package badge
    if (selectedProduct) {
      const badgeText = `${selectedProduct.name} Package`.toUpperCase();
      pdf.setFontSize(7);
      const bw = pdf.getTextWidth(badgeText) + 14;
      const bx = W - MR - 20 - pdf.getTextWidth(priceStr) - bw - 12;
      pdf.setFillColor(SLATE_700);
      pdf.roundedRect(bx, y + 21, bw, 16, 3, 3, 'F');
      pdf.setTextColor(SLATE_200);
      pdf.text(badgeText, bx + 7, y + 32);
    }
    y += 62;

    // ─── DISCLAIMER ───
    checkPage(70);
    pdf.setDrawColor(AMBER_100);
    pdf.setFillColor(AMBER_50);
    pdf.roundedRect(ML, y, CW, 56, 6, 6, 'FD');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(AMBER_800);
    const disclaimerText = 'All pages, features, and integrations listed above & as discussed in our discovery call will be completed into what we build for you, using your personalised design preferences, and requests — Additional features may come at an additional cost, unless you are covered with the "Sited Care Plan" for all changes.';
    const splitDisclaimer = pdf.splitTextToSize(disclaimerText, CW - 36);
    pdf.text(splitDisclaimer, ML + 18, y + 18);
    y += 70;

    // ─── FOOTER ───
    drawFooter(pdf, W, H);

    return pdf.output('blob');
  }, [allItems, businessName, projectType, today, fileSlug, totalItemized, savings, actualPrice, selectedProduct]);

  const handleSaveToGoogleDrive = async () => {
    setGenerating(true);
    try {
      const blob = await generatePdfBlob();
      if (!blob) {
        toast.error('Failed to generate PDF');
        return;
      }

      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Auto-generate billing charge for the proposal amount
      if (selectedProduct && actualPrice > 0) {
        const { error: txError } = await supabase.from('transactions').insert({
          lead_id: leadId,
          item: `${selectedProduct.name} Package — ${businessName}`,
          debit: actualPrice,
          credit: 0,
          status: 'completed',
          invoice_status: 'not_sent',
          payment_method: 'pending',
          notes: `Auto-generated from proposal (${fileName})`,
        });
        if (txError) {
          console.error('Failed to create billing entry:', txError);
          toast.error('Proposal saved but billing entry failed');
        } else {
          toast.success('Billing charge added to client account');
        }
      }

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
            <div className="flex-1 max-h-[62vh] border rounded-lg bg-muted/30 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">PDF Ready to Generate</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    A4 professional SOW document for <strong>{businessName}</strong>
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                  <div className="rounded-lg border bg-card p-3 text-center">
                    <p className="text-xl font-bold">{pages.length}</p>
                    <p className="text-xs text-muted-foreground">Pages</p>
                  </div>
                  <div className="rounded-lg border bg-card p-3 text-center">
                    <p className="text-xl font-bold">{features.length}</p>
                    <p className="text-xs text-muted-foreground">Features</p>
                  </div>
                  <div className="rounded-lg border bg-card p-3 text-center">
                    <p className="text-xl font-bold">{integrations.length}</p>
                    <p className="text-xs text-muted-foreground">Integrations</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-muted-foreground line-through">${totalItemized.toLocaleString()}</span>
                  <span className="font-bold text-lg">${actualPrice.toLocaleString()}</span>
                  <Badge variant="secondary">{selectedProduct?.name}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded">{fileName}</code>
                </p>
              </div>
            </div>

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
