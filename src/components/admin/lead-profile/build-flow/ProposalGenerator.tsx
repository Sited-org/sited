import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProposalGeneratorProps {
  buildFlowId: string;
  leadId: string;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProposalSent?: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  product_type: string;
}

interface PricingMap {
  page: number;
  feature: number;
  integration: number;
  portal_admin: number;
  portal_client: number;
  portal_staff: number;
}

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

// Margins: 1cm sides (~28.35pt), 1.5cm top/bottom (~42.52pt)
const ML = 28;
const MR = 28;
const MT = 43;
const MB = 50;

export function ProposalGenerator({ buildFlowId, leadId, businessName, open, onOpenChange, onProposalSent }: ProposalGeneratorProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [depositAmount, setDepositAmount] = useState(49);
  const [existingDepositPaid, setExistingDepositPaid] = useState(false);
  const [pricing, setPricing] = useState<PricingMap>({
    page: 159, feature: 300, integration: 199,
    portal_admin: 1200, portal_client: 1000, portal_staff: 800,
  });

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
        .select('id, name, price, is_active, product_type')
        .eq('is_active', true)
        .order('price', { ascending: true }),
      supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'deposit_amount')
        .maybeSingle(),
      // Check if deposit already exists for this lead
      supabase
        .from('transactions')
        .select('id, item, debit, status')
        .eq('lead_id', leadId)
        .ilike('item', '%Deposit%'),
    ]).then(([answersRes, productsRes, depositRes, existingTxRes]) => {
      const map: Record<string, string> = {};
      (answersRes.data || []).forEach((row: any) => {
        map[row.question_key] = row.answer_value;
      });
      setAnswers(map);
      const prods = (productsRes.data || []) as Product[];
      setProducts(prods);

      // Build dynamic pricing from products table
      const newPricing = { ...pricing };
      prods.forEach(p => {
        if (p.product_type && p.product_type !== 'package' && p.product_type in newPricing) {
          (newPricing as any)[p.product_type] = p.price;
        }
      });
      setPricing(newPricing);

      // Filter to only package-type products for the tier selector
      const packageProducts = prods.filter(p => p.product_type === 'package');
      if (packageProducts.length > 0 && !selectedProductId) {
        setSelectedProductId(packageProducts[0].id);
      }

      // Load deposit amount
      if (depositRes.data?.setting_value) {
        const val = depositRes.data.setting_value as any;
        setDepositAmount(val.amount ?? 49);
      }

      // Check if deposit is already paid
      const depositTxs = (existingTxRes.data || []) as any[];
      const hasPaidDeposit = depositTxs.some(
        (tx: any) => tx.status === 'completed' || tx.status === 'paid'
      );
      setExistingDepositPaid(hasPaidDeposit);

      setLoading(false);
    });
  }, [open, buildFlowId, leadId]);

  const parseArray = (val: string | undefined): string[] => {
    if (!val) return [];
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
  };

  const toSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const pages = parseArray(answers.selectedPages);
  const features = parseArray(answers.selectedFeatures);
  const integrations = parseArray(answers.selectedIntegrations || answers['integrations.selected']);
  const selectedPortals = parseArray(answers.selectedPortals);
  const revisionRounds = answers.revisionRounds || '2';

  const packageProducts = products.filter(p => p.product_type === 'package');
  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Calculate portal surcharges using dynamic pricing
  let portalTotal = 0;
  if (selectedPortals.includes('admin_portal')) portalTotal += pricing.portal_admin;
  if (selectedPortals.includes('client_portal')) portalTotal += pricing.portal_client;
  if (selectedPortals.includes('staff_portal')) portalTotal += pricing.portal_staff;

  const totalItemized = (pages.length * pricing.page) + (features.length * pricing.feature) + (integrations.length * pricing.integration) + portalTotal;
  const actualPrice = selectedProduct?.price || 0;
  const savings = totalItemized - actualPrice;
  const fileSlug = toSlug(businessName);
  const fileName = `${fileSlug}.sited.sow.pdf`;

  const projectType = PROJECT_TYPE_MAP[answers.projectType] || answers.projectType || 'Website';
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  const allItems: { desc: string; price: string; isFree: boolean }[] = [];
  if (selectedPortals.includes('admin_portal')) {
    allItems.push({ desc: 'Admin Portal', price: `$${pricing.portal_admin}`, isFree: false });
  }
  if (selectedPortals.includes('client_portal')) {
    allItems.push({ desc: 'Client Portal', price: `$${pricing.portal_client}`, isFree: false });
  }
  if (selectedPortals.includes('staff_portal')) {
    allItems.push({ desc: 'Staff Portal', price: `$${pricing.portal_staff}`, isFree: false });
  }
  pages.forEach(p => allItems.push({ desc: `Page — ${p}`, price: `$${pricing.page}`, isFree: false }));
  features.forEach(f => allItems.push({ desc: `Feature — ${f}`, price: `$${pricing.feature}`, isFree: false }));
  integrations.forEach(ig => allItems.push({ desc: `Integration — ${ig}`, price: `$${pricing.integration}`, isFree: false }));
  allItems.push({ desc: 'SEO Optimisation', price: 'FREE', isFree: true });
  allItems.push({ desc: 'Device Design Optimisation', price: 'FREE', isFree: true });
  allItems.push({ desc: `${revisionRounds} Revision Round${revisionRounds === '1' ? '' : 's'} Included`, price: 'FREE', isFree: true });

  const generatePdfBlob = useCallback(async (): Promise<Blob | null> => {
    const { jsPDF } = await import('jspdf');

    const W = 595.28;
    const H = 841.89;
    const CW = W - ML - MR;

    const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    let y = MT;

    const checkPage = (needed: number) => {
      if (y + needed > H - MB) {
        drawFooter(pdf, W, H);
        pdf.addPage();
        y = MT;
      }
    };

    const drawFooter = (doc: any, w: number, h: number) => {
      doc.setDrawColor(SLATE_200);
      doc.setLineWidth(0.5);
      doc.line(ML, h - 36, w - MR, h - 36);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(SLATE_400);
      doc.text('Sited · Web Design & Development', ML, h - 24);
      doc.text(`${fileSlug}.sited.sow`, w - MR, h - 24, { align: 'right' });
    };

    // ─── HEADER ───
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(SLATE_900);
    pdf.text('Sited.', ML, y + 20);
    const sitedWidth = pdf.getTextWidth('Sited.');
    pdf.setTextColor(SITED_BLUE);
    pdf.text('co', ML + sitedWidth, y + 20);

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
    const gradSteps = 8;
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
    const rowH = 28;
    const headerH = 30;
    const colNum = 40;

    const drawTableHeader = () => {
      pdf.setFillColor(SLATE_900);
      pdf.roundedRect(ML, y, CW, headerH, 4, 4, 'F');
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
      if (y === MT) drawTableHeader();

      const bgColor = i % 2 === 1 ? SLATE_50 : WHITE;
      pdf.setFillColor(bgColor);
      pdf.rect(ML, y, CW, rowH, 'F');
      pdf.setDrawColor(SLATE_100);
      pdf.setLineWidth(0.3);
      pdf.line(ML, y + rowH, ML + CW, y + rowH);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(SLATE_400);
      pdf.text(String(i + 1).padStart(2, '0'), ML + 14, y + 17);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(SLATE_900);
      pdf.text(item.desc, ML + colNum + 14, y + 17);

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

    pdf.setFillColor(SLATE_50);
    pdf.roundedRect(ML, y, CW, 36, 6, 6, 'F');
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
    pdf.setDrawColor(SLATE_400);
    pdf.setLineWidth(0.8);
    pdf.line(W - MR - 20 - itW, y + 19, W - MR - 20, y + 19);
    y += 36;

    pdf.setFillColor(GREEN_50);
    pdf.rect(ML, y, CW, 36, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(GREEN_600);
    pdf.text('You Save', ML + 20, y + 22);
    pdf.setFontSize(12);
    pdf.text(`$${savings.toLocaleString()}`, W - MR - 20, y + 22, { align: 'right' });
    y += 36;

    pdf.setFillColor(SLATE_900);
    pdf.roundedRect(ML, y, CW, 48, 6, 6, 'F');
    pdf.rect(ML, y, CW, 6, 'F');

    // Package badge — positioned to the left
    if (selectedProduct) {
      const productName = selectedProduct.name.replace(/\s*package\s*/i, '');
      const badgeText = `${productName} Package`.toUpperCase();
      pdf.setFontSize(7);
      const bw = pdf.getTextWidth(badgeText) + 14;
      const bx = ML + 120;
      pdf.setFillColor(SLATE_700);
      pdf.roundedRect(bx, y + 7, bw, 16, 3, 3, 'F');
      pdf.setTextColor(SLATE_200);
      pdf.text(badgeText, bx + 7, y + 18);
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(SLATE_400);
    pdf.text('Your Price', ML + 20, y + 30);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(WHITE);
    pdf.text(`$${actualPrice.toLocaleString()}`, W - MR - 20, y + 32, { align: 'right' });
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

    // ─── FOOTER ───
    drawFooter(pdf, W, H);

    return pdf.output('blob');
  }, [allItems, businessName, projectType, today, fileSlug, totalItemized, savings, actualPrice, selectedProduct]);

  const handleSendProposal = async () => {
    setGenerating(true);
    try {
      const blob = await generatePdfBlob();
      if (!blob) {
        toast.error('Failed to generate PDF');
        return;
      }

      // Convert blob to base64
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const pdfBase64 = btoa(binary);

      // Send via edge function
      const { error } = await supabase.functions.invoke('send-proposal-email', {
        body: { leadId, pdfBase64, fileName, buildFlowId },
      });

      if (error) {
        toast.error('Failed to send proposal: ' + error.message);
        return;
      }

      // Auto-generate billing: deposit-aware split
      if (selectedProduct && actualPrice > 0) {
        const transactions: any[] = [];

        if (existingDepositPaid) {
          // Deposit already paid — only assign the remaining balance
          const remaining = actualPrice - Math.min(depositAmount, actualPrice);
          if (remaining > 0) {
            transactions.push({
              lead_id: leadId,
              item: `${selectedProduct.name.replace(/\s*package\s*/i, '')} Package — ${businessName}`,
              debit: remaining,
              credit: 0,
              status: 'completed',
              invoice_status: 'not_sent',
              payment_method: 'pending',
              notes: `Package balance (deposit already paid). From proposal: ${fileName}`,
            });
          }
        } else {
          // No deposit paid — create both deposit and balance
          const deposit = Math.min(depositAmount, actualPrice);
          const remaining = actualPrice - deposit;

          if (deposit > 0) {
            transactions.push({
              lead_id: leadId,
              item: `Deposit — ${businessName}`,
              debit: deposit,
              credit: 0,
              status: 'completed',
              invoice_status: 'not_sent',
              payment_method: 'pending',
              notes: `Auto-generated deposit from proposal (${fileName})`,
            });
          }
          if (remaining > 0) {
            transactions.push({
              lead_id: leadId,
              item: `${selectedProduct.name.replace(/\s*package\s*/i, '')} Package — ${businessName}`,
              debit: remaining,
              credit: 0,
              status: 'completed',
              invoice_status: 'not_sent',
              payment_method: 'pending',
              notes: `Auto-generated balance from proposal (${fileName})`,
            });
          }
        }

        if (transactions.length > 0) {
          const { error: txError } = await supabase.from('transactions').insert(transactions);
          if (txError) {
            console.error('Failed to create billing entries:', txError);
          } else {
            toast.success(existingDepositPaid
              ? 'Package charge added (deposit already paid)'
              : 'Deposit & package charges added to client account'
            );
          }
        }
      }

      toast.success('Proposal sent to client!');
      onProposalSent?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Send proposal failed:', err);
      toast.error('Failed to send proposal');
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
            Generate & Send Proposal — {businessName}
          </DialogTitle>
        </DialogHeader>

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
                    {packageProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — ${p.price.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {existingDepositPaid && (
                <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    ✓ Deposit already paid — only the package balance will be charged.
                  </p>
                </div>
              )}

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold">Scope of Works</h4>
                {pages.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Pages ({pages.length} × ${pricing.page})</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pages.map((p, i) => <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>)}
                    </div>
                  </div>
                )}
                {features.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Features ({features.length} × ${pricing.feature})</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {features.map((f, i) => <Badge key={i} variant="outline" className="text-xs">{f}</Badge>)}
                    </div>
                  </div>
                )}
                {integrations.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Integrations ({integrations.length} × ${pricing.integration})</span>
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
                <div className="border-t pt-3 mt-3 space-y-1">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Itemised Total</span>
                    <span className="line-through">${totalItemized.toLocaleString()}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Savings</span>
                      <span>${savings.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-1">
                    <span>
                      Package Price
                      {selectedProduct && (
                        <span className="text-xs font-normal text-muted-foreground ml-2">
                          {selectedProduct.name.replace(/\s*package\s*/i, '')} Package
                        </span>
                      )}
                    </span>
                    <span>{selectedProduct ? `$${actualPrice.toLocaleString()}` : '—'}</span>
                  </div>
                  {!existingDepositPaid && actualPrice > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
                      <span>Deposit</span>
                      <span>${Math.min(depositAmount, actualPrice).toLocaleString()}</span>
                    </div>
                  )}
                  {actualPrice > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Balance Due</span>
                      <span>
                        ${(existingDepositPaid
                          ? actualPrice - Math.min(depositAmount, actualPrice)
                          : actualPrice - Math.min(depositAmount, actualPrice)
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
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
          <Button onClick={handleSendProposal} disabled={loading || !selectedProductId || generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send Proposal to Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
