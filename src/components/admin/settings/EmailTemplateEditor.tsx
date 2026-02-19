import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Eye, EyeOff, Info, Link2, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplateEditorProps {
  subject: string;
  bodyHtml: string;
  templateType: string;
  onSubjectChange: (value: string) => void;
  onBodyHtmlChange: (value: string) => void;
}

const VARIABLE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  onboarding: {
    '{{name}}': 'Client\'s full name',
    '{{email}}': 'Client\'s email address',
    '{{business_name}}': 'Client\'s business name',
    '{{project_type}}': 'Type of project',
    '{{phone}}': 'Client\'s phone number',
  },
  payment_receipt: {
    '{{name}}': 'Client\'s full name',
    '{{email}}': 'Client\'s email address',
    '{{business_name}}': 'Client\'s business name',
    '{{amount}}': 'Payment amount',
    '{{invoice_id}}': 'Invoice reference number',
    '{{date}}': 'Payment date',
    '{{description}}': 'Payment description',
  },
  monthly_report: {
    '{{name}}': 'Client\'s full name',
    '{{business_name}}': 'Client\'s business name',
    '{{month}}': 'Report month',
    '{{metrics_summary}}': 'AI-generated metrics',
    '{{ai_recommendations}}': 'AI suggestions',
  },
  milestone_progress: {
    '{{name}}': 'Client\'s full name',
    '{{business_name}}': 'Client\'s business name',
    '{{progress}}': 'Completion percentage',
    '{{milestone_message}}': 'Milestone details',
  },
  recurring_invoices: {
    '{{name}}': 'Client\'s full name',
    '{{business_name}}': 'Client\'s business name',
  },
  staff_invitation: {
    '{{name}}': 'Staff member\'s name',
    '{{email}}': 'Staff email',
    '{{role}}': 'Assigned role',
    '{{password}}': 'Temp password',
    '{{login_url}}': 'Login page URL',
  },
};

interface ParsedEmail {
  greeting: string;
  bodyParagraphs: string[];
  ctaText: string;
  ctaUrl: string;
  hasCta: boolean;
}

function parseHtmlToStructured(html: string): ParsedEmail {
  const result: ParsedEmail = { greeting: '', bodyParagraphs: [''], ctaText: '', ctaUrl: '', hasCta: false };
  if (!html) return result;

  const ctaMatch = html.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/i);
  if (ctaMatch) { result.ctaUrl = ctaMatch[1]; result.ctaText = ctaMatch[2]; result.hasCta = true; }

  let bodyContent = html
    .replace(/<a[^>]*>[^<]*<\/a>/gi, '')
    .replace(/<p[^>]*>\s*<\/p>/gi, '')
    .replace(/<div[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  const paragraphs = bodyContent
    .split(/<\/?p[^>]*>|<br\s*\/?>/)
    .map(p => p.replace(/<[^>]*>/g, '').trim())
    .filter(p => p.length > 0);

  if (paragraphs.length > 0) {
    const first = paragraphs[0];
    if (/^(hi|hey|hello|dear)/i.test(first)) {
      result.greeting = first;
      result.bodyParagraphs = paragraphs.slice(1);
    } else {
      result.bodyParagraphs = paragraphs;
    }
  }
  if (result.bodyParagraphs.length === 0) result.bodyParagraphs = [''];
  return result;
}

function structuredToHtml(parsed: ParsedEmail): string {
  let html = '';
  if (parsed.greeting) html += `<p>${parsed.greeting}</p>`;
  for (const p of parsed.bodyParagraphs) { if (p.trim()) html += `<p>${p}</p>`; }
  if (parsed.hasCta && parsed.ctaText) {
    html += `<div style="text-align: center; margin: 24px 0;"><a href="${parsed.ctaUrl || '#'}" style="background-color: #141414; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">${parsed.ctaText}</a></div>`;
  }
  return html;
}

function renderPreviewHtml(subject: string, parsed: ParsedEmail): string {
  const bodyHtml = (() => {
    let h = '';
    if (parsed.greeting) h += `<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">${parsed.greeting}</p>`;
    for (const p of parsed.bodyParagraphs) {
      if (p.trim()) h += `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#374151;">${p}</p>`;
    }
    if (parsed.hasCta && parsed.ctaText) {
      h += `<div style="text-align:center;margin:28px 0 12px;"><a href="${parsed.ctaUrl || '#'}" style="background-color:#141414;color:#ffffff;padding:13px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;display:inline-block;">${parsed.ctaText}</a></div>`;
    }
    return h;
  })();

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;padding:0;">
      <!-- Gmail-style header -->
      <div style="background:#ffffff;border-bottom:1px solid #e5e7eb;padding:12px 16px;display:flex;align-items:center;gap:8px;">
        <div style="display:flex;gap:6px;">
          <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ef4444;opacity:0.7;"></span>
          <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#f59e0b;opacity:0.7;"></span>
          <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#22c55e;opacity:0.7;"></span>
        </div>
        <span style="margin-left:12px;font-size:12px;color:#6b7280;">Gmail</span>
      </div>
      
      <!-- Email chrome -->
      <div style="background:#ffffff;margin:0;">
        <!-- Subject bar -->
        <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;">
          <div style="font-size:16px;font-weight:600;color:#111827;margin-bottom:4px;">${subject || 'No subject'}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;">
              <span style="color:white;font-weight:700;font-size:13px;">S</span>
            </div>
            <div>
              <div style="font-size:13px;color:#111827;font-weight:500;">Sited <span style="font-weight:400;color:#6b7280;">&lt;hello@sited.com.au&gt;</span></div>
              <div style="font-size:11px;color:#9ca3af;">to me</div>
            </div>
          </div>
        </div>
        
        <!-- Email body -->
        <div style="padding:24px 20px;">
          <!-- Branded email wrapper -->
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <!-- Brand header -->
            <div style="background:#141414;padding:24px 28px;text-align:center;">
              <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:1px;">SITED</span>
            </div>
            <!-- Content -->
            <div style="padding:28px;">
              ${bodyHtml}
            </div>
            <!-- Footer -->
            <div style="border-top:1px solid #f3f4f6;padding:18px 28px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.5;">
                © ${new Date().getFullYear()} Sited · <a href="#" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export default function EmailTemplateEditor({
  subject, bodyHtml, templateType, onSubjectChange, onBodyHtmlChange,
}: EmailTemplateEditorProps) {
  const { toast } = useToast();
  const [parsed, setParsed] = useState<ParsedEmail>(() => parseHtmlToStructured(bodyHtml));
  const [showPreview, setShowPreview] = useState(false);
  const variables = VARIABLE_DESCRIPTIONS[templateType] || {};

  useEffect(() => {
    const html = structuredToHtml(parsed);
    onBodyHtmlChange(html);
  }, [parsed]);

  useEffect(() => {
    setParsed(parseHtmlToStructured(bodyHtml));
  }, []);

  const updateParagraph = (index: number, value: string) => {
    setParsed(prev => ({ ...prev, bodyParagraphs: prev.bodyParagraphs.map((p, i) => i === index ? value : p) }));
  };

  const addParagraph = () => setParsed(prev => ({ ...prev, bodyParagraphs: [...prev.bodyParagraphs, ''] }));

  const removeParagraph = (index: number) => {
    if (parsed.bodyParagraphs.length <= 1) return;
    setParsed(prev => ({ ...prev, bodyParagraphs: prev.bodyParagraphs.filter((_, i) => i !== index) }));
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast({ title: 'Copied', description: `${variable} copied to clipboard` });
  };

  return (
    <div className="space-y-6">
      {/* Variable Reference */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Dynamic Variables</span>
            <span className="text-xs text-muted-foreground">— Click to copy</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(variables).map(([variable, description]) => (
              <TooltipProvider key={variable}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => copyVariable(variable)}
                      className="flex items-center gap-2 text-left px-3 py-1.5 rounded-md bg-background border hover:bg-accent/30 transition-colors group"
                    >
                      <code className="text-xs font-mono text-primary">{variable}</code>
                      <span className="text-xs text-muted-foreground truncate flex-1">{description}</span>
                      <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Click to copy</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subject Line */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Type className="h-4 w-4" />Subject Line</Label>
        <Input value={subject} onChange={e => onSubjectChange(e.target.value)} placeholder="e.g. Welcome to Sited, {{name}}!" className="text-base" />
      </div>

      <Separator />

      {/* Greeting */}
      <div className="space-y-2">
        <Label>Greeting</Label>
        <Input value={parsed.greeting} onChange={e => setParsed(prev => ({ ...prev, greeting: e.target.value }))} placeholder="e.g. Hi {{name}}," />
      </div>

      {/* Body Paragraphs */}
      <div className="space-y-3">
        <Label>Email Body</Label>
        {parsed.bodyParagraphs.map((paragraph, index) => (
          <div key={index} className="flex gap-2">
            <Textarea
              value={paragraph}
              onChange={e => updateParagraph(index, e.target.value)}
              placeholder={index === 0 ? "Write the main message..." : "Add another paragraph..."}
              rows={3}
              className="flex-1"
            />
            {parsed.bodyParagraphs.length > 1 && (
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeParagraph(index)}>×</Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addParagraph}>+ Add Paragraph</Button>
      </div>

      <Separator />

      {/* CTA Button */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2"><Link2 className="h-4 w-4" />Call-to-Action Button</Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="cta-toggle" className="text-sm text-muted-foreground">{parsed.hasCta ? 'Enabled' : 'Disabled'}</Label>
            <Switch id="cta-toggle" checked={parsed.hasCta} onCheckedChange={checked => setParsed(prev => ({ ...prev, hasCta: checked }))} />
          </div>
        </div>
        {parsed.hasCta && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg border bg-muted/20">
            <div className="space-y-1.5">
              <Label className="text-xs">Button Label</Label>
              <Input value={parsed.ctaText} onChange={e => setParsed(prev => ({ ...prev, ctaText: e.target.value }))} placeholder="e.g. View Your Dashboard" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Button Link (URL)</Label>
              <Input value={parsed.ctaUrl} onChange={e => setParsed(prev => ({ ...prev, ctaUrl: e.target.value }))} placeholder="e.g. https://sited.lovable.app/client-portal" />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Gmail-style Preview */}
      <div>
        <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-2">
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? 'Hide Preview' : 'Preview as Gmail'}
        </Button>

        {showPreview && (
          <div className="mt-3 rounded-xl overflow-hidden border border-border shadow-elevated">
            <iframe
              srcDoc={renderPreviewHtml(subject, parsed)}
              className="w-full border-0"
              style={{ height: '520px' }}
              title="Email Preview"
              sandbox=""
            />
          </div>
        )}
      </div>
    </div>
  );
}
