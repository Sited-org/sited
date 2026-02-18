import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    '{{project_type}}': 'Type of project (e.g. Website, E-commerce)',
    '{{phone}}': 'Client\'s phone number',
  },
  payment_receipt: {
    '{{name}}': 'Client\'s full name',
    '{{email}}': 'Client\'s email address',
    '{{business_name}}': 'Client\'s business name',
    '{{amount}}': 'Payment amount (e.g. $500.00)',
    '{{invoice_id}}': 'Invoice reference number',
    '{{date}}': 'Payment date',
    '{{description}}': 'Payment description',
  },
  monthly_report: {
    '{{name}}': 'Client\'s full name',
    '{{email}}': 'Client\'s email address',
    '{{business_name}}': 'Client\'s business name',
    '{{month}}': 'Report month (e.g. January 2025)',
    '{{metrics_summary}}': 'AI-generated metrics overview',
    '{{ai_recommendations}}': 'AI-generated strategic suggestions',
  },
  milestone_progress: {
    '{{name}}': 'Client\'s full name',
    '{{email}}': 'Client\'s email address',
    '{{business_name}}': 'Client\'s business name',
    '{{progress}}': 'Completion percentage (e.g. 50%)',
    '{{milestone_message}}': 'Milestone details message',
  },
  recurring_invoices: {
    '{{name}}': 'Client\'s full name',
    '{{email}}': 'Client\'s email address',
    '{{business_name}}': 'Client\'s business name',
  },
  staff_invitation: {
    '{{name}}': 'Staff member\'s display name',
    '{{email}}': 'Staff member\'s email address',
    '{{role}}': 'Assigned role (Developer, Admin, etc.)',
    '{{password}}': 'Generated temporary password',
    '{{login_url}}': 'Login page URL',
    '{{dashboard_path}}': 'Dashboard redirect path (/dev or /admin)',
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
  const result: ParsedEmail = {
    greeting: '',
    bodyParagraphs: [''],
    ctaText: '',
    ctaUrl: '',
    hasCta: false,
  };

  if (!html) return result;

  // Extract CTA button
  const ctaMatch = html.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/i);
  if (ctaMatch) {
    result.ctaUrl = ctaMatch[1];
    result.ctaText = ctaMatch[2];
    result.hasCta = true;
  }

  // Remove CTA and surrounding tags to get body
  let bodyContent = html
    .replace(/<a[^>]*>[^<]*<\/a>/gi, '')
    .replace(/<p[^>]*>\s*<\/p>/gi, '')
    .replace(/<div[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  // Split by <p> tags or <br> to get paragraphs
  const paragraphs = bodyContent
    .split(/<\/?p[^>]*>|<br\s*\/?>/)
    .map(p => p.replace(/<[^>]*>/g, '').trim())
    .filter(p => p.length > 0);

  if (paragraphs.length > 0) {
    // First paragraph is usually greeting
    const firstPara = paragraphs[0];
    if (firstPara.toLowerCase().startsWith('hi') || firstPara.toLowerCase().startsWith('hey') || firstPara.toLowerCase().startsWith('hello') || firstPara.toLowerCase().startsWith('dear')) {
      result.greeting = firstPara;
      result.bodyParagraphs = paragraphs.slice(1);
    } else {
      result.greeting = '';
      result.bodyParagraphs = paragraphs;
    }
  }

  if (result.bodyParagraphs.length === 0) {
    result.bodyParagraphs = [''];
  }

  return result;
}

function structuredToHtml(parsed: ParsedEmail): string {
  let html = '';

  if (parsed.greeting) {
    html += `<p>${parsed.greeting}</p>`;
  }

  for (const paragraph of parsed.bodyParagraphs) {
    if (paragraph.trim()) {
      html += `<p>${paragraph}</p>`;
    }
  }

  if (parsed.hasCta && parsed.ctaText) {
    html += `<div style="text-align: center; margin: 24px 0;"><a href="${parsed.ctaUrl || '#'}" style="background-color: #141414; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">${parsed.ctaText}</a></div>`;
  }

  return html;
}

export default function EmailTemplateEditor({
  subject,
  bodyHtml,
  templateType,
  onSubjectChange,
  onBodyHtmlChange,
}: EmailTemplateEditorProps) {
  const { toast } = useToast();
  const [parsed, setParsed] = useState<ParsedEmail>(() => parseHtmlToStructured(bodyHtml));
  const [showPreview, setShowPreview] = useState(false);

  const variables = VARIABLE_DESCRIPTIONS[templateType] || {};

  // Sync parsed state back to HTML whenever it changes
  useEffect(() => {
    const html = structuredToHtml(parsed);
    onBodyHtmlChange(html);
  }, [parsed]);

  // Re-parse when bodyHtml prop changes externally
  useEffect(() => {
    const newParsed = parseHtmlToStructured(bodyHtml);
    setParsed(newParsed);
  }, []);

  const updateParagraph = (index: number, value: string) => {
    setParsed(prev => {
      const newParagraphs = [...prev.bodyParagraphs];
      newParagraphs[index] = value;
      return { ...prev, bodyParagraphs: newParagraphs };
    });
  };

  const addParagraph = () => {
    setParsed(prev => ({
      ...prev,
      bodyParagraphs: [...prev.bodyParagraphs, ''],
    }));
  };

  const removeParagraph = (index: number) => {
    if (parsed.bodyParagraphs.length <= 1) return;
    setParsed(prev => ({
      ...prev,
      bodyParagraphs: prev.bodyParagraphs.filter((_, i) => i !== index),
    }));
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
            <span className="text-xs text-muted-foreground">— Click to copy, paste anywhere in your email</span>
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
        <Label className="flex items-center gap-2">
          <Type className="h-4 w-4" />
          Subject Line
        </Label>
        <Input
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="e.g. Welcome to Sited, {{name}}!"
          className="text-base"
        />
        <p className="text-xs text-muted-foreground">
          Use variables like <code className="bg-muted px-1 rounded">{'{{name}}'}</code> to personalise
        </p>
      </div>

      <Separator />

      {/* Greeting */}
      <div className="space-y-2">
        <Label>Greeting</Label>
        <Input
          value={parsed.greeting}
          onChange={(e) => setParsed(prev => ({ ...prev, greeting: e.target.value }))}
          placeholder="e.g. Hi {{name}},"
        />
        <p className="text-xs text-muted-foreground">
          Tip: Use <code className="bg-muted px-1 rounded">{'{{name}}'}</code> to address the client by name
        </p>
      </div>

      {/* Body Paragraphs */}
      <div className="space-y-3">
        <Label>Email Body</Label>
        {parsed.bodyParagraphs.map((paragraph, index) => (
          <div key={index} className="flex gap-2">
            <Textarea
              value={paragraph}
              onChange={(e) => updateParagraph(index, e.target.value)}
              placeholder={index === 0 ? "Write the main message to your client..." : "Add another paragraph..."}
              rows={3}
              className="flex-1"
            />
            {parsed.bodyParagraphs.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeParagraph(index)}
              >
                ×
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addParagraph}>
          + Add Paragraph
        </Button>
      </div>

      <Separator />

      {/* CTA Button */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Call-to-Action Button
          </Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="cta-toggle" className="text-sm text-muted-foreground">
              {parsed.hasCta ? 'Enabled' : 'Disabled'}
            </Label>
            <Switch
              id="cta-toggle"
              checked={parsed.hasCta}
              onCheckedChange={(checked) => setParsed(prev => ({ ...prev, hasCta: checked }))}
            />
          </div>
        </div>
        {parsed.hasCta && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg border bg-muted/20">
            <div className="space-y-1.5">
              <Label className="text-xs">Button Label</Label>
              <Input
                value={parsed.ctaText}
                onChange={(e) => setParsed(prev => ({ ...prev, ctaText: e.target.value }))}
                placeholder="e.g. View Your Dashboard"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Button Link (URL)</Label>
              <Input
                value={parsed.ctaUrl}
                onChange={(e) => setParsed(prev => ({ ...prev, ctaUrl: e.target.value }))}
                placeholder="e.g. https://sited.lovable.app/client-portal"
              />
            </div>
            {/* Preview of CTA */}
            <div className="col-span-full flex justify-center pt-2">
              <div
                className="px-7 py-3 rounded-lg font-semibold text-sm text-primary-foreground bg-primary inline-block"
              >
                {parsed.ctaText || 'Button Text'}
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Live Preview Toggle */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? 'Hide Preview' : 'Show Email Preview'}
        </Button>

        {showPreview && (
          <Card className="mt-3 overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b">
              <p className="text-xs text-muted-foreground">Subject: <span className="font-medium text-foreground">{subject}</span></p>
            </div>
            <CardContent className="p-6">
              <div
                className="prose prose-sm max-w-none [&_a]:text-primary [&_a]:font-semibold"
                dangerouslySetInnerHTML={{ __html: structuredToHtml(parsed) }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
