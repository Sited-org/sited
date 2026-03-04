import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileDown, Loader2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProposalGeneratorProps {
  buildFlowId: string;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BUDGET_MAP: Record<string, string> = {
  under_1k: 'Under £1,000',
  '1k_3k': '£1,000 – £3,000',
  '3k_5k': '£3,000 – £5,000',
  '5k_10k': '£5,000 – £10,000',
  '10k_plus': '£10,000+',
};

const PROJECT_TYPE_MAP: Record<string, string> = {
  brochure: 'Brochure / Information Website',
  ecommerce: 'E-Commerce Store',
  webapp: 'Web Application / SaaS / Portal',
  booking: 'Booking / Service Website',
};

export function ProposalGenerator({ buildFlowId, businessName, open, onOpenChange }: ProposalGeneratorProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from('discovery_answers')
      .select('question_key, answer_value')
      .eq('build_flow_id', buildFlowId)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach((row: any) => {
          map[row.question_key] = row.answer_value;
        });
        setAnswers(map);
        setLoading(false);
      });
  }, [open, buildFlowId]);

  const parseArray = (val: string | undefined): string[] => {
    if (!val) return [];
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
  };

  const safeSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const downloadPDF = async () => {
    setGenerating(true);
    const projectType = PROJECT_TYPE_MAP[answers.projectType] || answers.projectType || 'Website';
    const pages = parseArray(answers.selectedPages);
    const features = parseArray(answers.selectedFeatures);
    const integrations = parseArray(answers.selectedIntegrations);
    const budget = BUDGET_MAP[answers.budgetRange] || answers.budgetRange || 'TBC';
    const revisions = answers.revisionRounds || '2';
    const goal = answers.primaryGoal || '';
    const audience = answers.targetAudience || '';
    const launchDate = answers.desiredLaunchDate || 'TBC';
    const commMethod = answers.communicationMethod || 'Email';
    const existingSite = answers.existingWebsite || '';
    const competitors = answers.competitorSites || '';
    const notes = answers.notes || '';
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // Generate HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 40px 50px; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.6; }
  h1 { font-size: 28px; margin-bottom: 4px; color: #0f172a; }
  h2 { font-size: 18px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 30px; }
  h3 { font-size: 14px; color: #475569; margin-top: 16px; margin-bottom: 4px; }
  .header { margin-bottom: 30px; }
  .header p { color: #64748b; font-size: 14px; margin: 2px 0; }
  .badge { display: inline-block; background: #f1f5f9; color: #334155; padding: 3px 10px; border-radius: 4px; font-size: 12px; margin: 2px 4px 2px 0; }
  .section { margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
  .value { font-weight: 500; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; background: #f8fafc; padding: 8px 12px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #e2e8f0; color: #94a3b8; font-size: 11px; }
  .note { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 10px 14px; margin-top: 12px; font-size: 12px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Statement of Work</h1>
    <p><strong>${businessName}</strong> — ${projectType}</p>
    <p>Prepared by Sited · ${today}</p>
  </div>

  <h2>1. Project Overview</h2>
  <div class="section">
    <div class="grid">
      <div><span class="label">Client</span><br><span class="value">${businessName}</span></div>
      <div><span class="label">Project Type</span><br><span class="value">${projectType}</span></div>
      <div><span class="label">Target Launch</span><br><span class="value">${launchDate}</span></div>
      <div><span class="label">Budget Range</span><br><span class="value">${budget}</span></div>
      <div><span class="label">Revision Rounds</span><br><span class="value">${revisions}</span></div>
      <div><span class="label">Communication</span><br><span class="value">${commMethod}</span></div>
    </div>
    ${goal ? `<h3>Primary Goal</h3><p>${goal}</p>` : ''}
    ${audience ? `<h3>Target Audience</h3><p>${audience}</p>` : ''}
  </div>

  <h2>2. Scope — Pages</h2>
  <div class="section">
    <table>
      <thead><tr><th>#</th><th>Page</th></tr></thead>
      <tbody>${pages.map((p, i) => `<tr><td>${i + 1}</td><td>${p}</td></tr>`).join('')}</tbody>
    </table>
  </div>

  ${features.length > 0 ? `
  <h2>3. Features & Functionality</h2>
  <div class="section">
    ${features.map(f => `<span class="badge">${f}</span>`).join('')}
  </div>` : ''}

  ${integrations.length > 0 ? `
  <h2>4. Integrations</h2>
  <div class="section">
    ${integrations.map(i => `<span class="badge">${i}</span>`).join('')}
  </div>` : ''}

  ${existingSite || competitors || notes ? `
  <h2>5. Additional Context</h2>
  <div class="section">
    ${existingSite ? `<h3>Existing Website</h3><p>${existingSite}</p>` : ''}
    ${competitors ? `<h3>Competitor / Reference Sites</h3><p>${competitors}</p>` : ''}
    ${notes ? `<h3>Notes</h3><p>${notes}</p>` : ''}
  </div>` : ''}

  <h2>${existingSite || competitors || notes ? '6' : '5'}. Terms</h2>
  <div class="section">
    <ul>
      <li>Deposit is required before work begins. Final balance due before go-live.</li>
      <li>${revisions} rounds of revisions are included. Additional revisions will be quoted as change requests.</li>
      <li>Content and assets must be provided by the client within the agreed timeline.</li>
      <li>This proposal is valid for 30 days from the date of issue.</li>
    </ul>
  </div>

  <div class="note">
    <strong>Note:</strong> This Statement of Work is generated from the project discovery form. Final pricing and detailed timelines will be confirmed in the accompanying contract.
  </div>

  <div class="footer">
    <p>Sited · Web Design & Development · sited.co</p>
    <p>Document: ${safeSlug(businessName)}.sited.sow</p>
  </div>
</body>
</html>`;

    // Use browser print to PDF
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        // Set the document title for PDF filename
        printWindow.document.title = `${safeSlug(businessName)}.sited.sow`;
        setTimeout(() => {
          printWindow.print();
        }, 500);
      });
    }

    setGenerating(false);
    onOpenChange(false);
  };

  const pages = parseArray(answers.selectedPages);
  const features = parseArray(answers.selectedFeatures);
  const integrations = parseArray(answers.selectedIntegrations);

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
            <div className="py-8 text-center text-muted-foreground">Loading discovery data...</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold">Proposal Preview</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Project Type</span>
                    <p className="font-medium">{PROJECT_TYPE_MAP[answers.projectType] || answers.projectType || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Budget</span>
                    <p className="font-medium">{BUDGET_MAP[answers.budgetRange] || answers.budgetRange || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Launch Date</span>
                    <p className="font-medium">{answers.desiredLaunchDate || 'TBC'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Revisions</span>
                    <p className="font-medium">{answers.revisionRounds || '2'} rounds</p>
                  </div>
                </div>
                {pages.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Pages ({pages.length})</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pages.map((p, i) => <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>)}
                    </div>
                  </div>
                )}
                {features.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Features ({features.length})</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {features.map((f, i) => <Badge key={i} variant="outline" className="text-xs">{f}</Badge>)}
                    </div>
                  </div>
                )}
                {integrations.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Integrations ({integrations.length})</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {integrations.map((ig, i) => <Badge key={i} variant="outline" className="text-xs">{ig}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                The PDF will be generated as a Statement of Work based on the discovery form answers. 
                File name: <code className="bg-muted px-1 rounded">{businessName ? `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.sited.sow.pdf` : 'proposal.pdf'}</code>
              </p>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={downloadPDF} disabled={loading || generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            Download Proposal PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
