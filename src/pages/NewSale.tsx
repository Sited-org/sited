import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Building, MapPin, Globe, Sparkles, Copy, Check, ArrowLeft, Briefcase, Loader2, Search, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Step = 'details' | 'generating' | 'prompt';

export default function NewSale() {
  const [step, setStep] = useState<Step>('details');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [details, setDetails] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [researchInsights, setResearchInsights] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const wordCount = details.trim().split(/\s+/).filter(Boolean).length;
  const maxWords = 200;

  const handleDetailsChange = (value: string) => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) {
      setDetails(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !location.trim() || !industry.trim()) {
      toast.error('Please fill in business name, location, and industry');
      return;
    }

    setStep('generating');
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-sales-prompt', {
        body: { businessName, location, industry, website, details },
      });

      if (error) throw error;

      setGeneratedPrompt(data.prompt);
      setResearchInsights(data.research || '');
      setStep('prompt');
      toast.success('Prompt generated with AI research!');
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error('Failed to generate prompt. Please try again.');
      setStep('details');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      toast.success('Prompt copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleReset = () => {
    setStep('details');
    setBusinessName('');
    setLocation('');
    setIndustry('');
    setWebsite('');
    setDetails('');
    setGeneratedPrompt('');
    setResearchInsights('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Face-to-Face Sale</h1>
          <p className="text-muted-foreground">Generate a website demo for your prospect</p>
        </div>
      </div>

      {step === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Details
            </CardTitle>
            <CardDescription>
              Enter the prospect's business information - AI will research and create a tailored prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  Business Name *
                </Label>
                <Input
                  id="businessName"
                  placeholder="e.g., Joe's Plumbing Services"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="text-lg"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Location *
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Brisbane, QLD"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Industry *
                </Label>
                <Input
                  id="industry"
                  placeholder="e.g., Plumbing, Real Estate, Cafe"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Current Website (optional)
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  If they have an existing website, AI will analyze it for improvements
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Additional Details (optional)
                </Label>
                <Textarea
                  id="details"
                  placeholder="Add any specific notes to personalise the website... e.g., 'They specialise in emergency callouts', 'Family-owned for 30 years', 'Want a modern dark theme'"
                  value={details}
                  onChange={(e) => handleDetailsChange(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <p className={`text-xs ${wordCount >= maxWords ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {wordCount}/{maxWords} words
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg">
                <Search className="h-4 w-4 mr-2" />
                Research & Generate Prompt
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 'generating' && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <Search className="h-5 w-5 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Researching {businessName}...</h3>
                <p className="text-muted-foreground max-w-md">
                  AI is gathering insights about the {industry} industry in {location} to create a highly targeted website prompt
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>This usually takes 10-20 seconds</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'prompt' && (
        <div className="space-y-6">
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Generated Lovable Prompt
              </CardTitle>
              <CardDescription>
                Created using research on {industry} businesses in {location}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  value={generatedPrompt}
                  readOnly
                  className="min-h-[400px] font-mono text-sm resize-none bg-muted/50"
                />
                <Button
                  onClick={handleCopy}
                  className="absolute top-3 right-3"
                  size="sm"
                  variant={copied ? "default" : "secondary"}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">Next Steps:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open <a href="https://lovable.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lovable.dev</a> in a new tab</li>
                  <li>Start a new project</li>
                  <li>Paste the copied prompt</li>
                  <li>Let Lovable generate the website</li>
                  <li>Publish to a subdomain and present to client</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
                <Button asChild className="flex-1">
                  <a href="https://lovable.dev" target="_blank" rel="noopener noreferrer">
                    Open Lovable.dev
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Research Insights Card */}
          {researchInsights && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Research Insights
                </CardTitle>
                <CardDescription>
                  AI-gathered information used to create the prompt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-background/50 p-4 rounded-lg">
                    {researchInsights}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Card */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Business Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Business</dt>
                  <dd className="font-medium">{businessName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Industry</dt>
                  <dd className="font-medium">{industry}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="font-medium">{location}</dd>
                </div>
                {website && (
                  <div>
                    <dt className="text-muted-foreground">Reference Website</dt>
                    <dd className="font-medium text-primary">{website}</dd>
                  </div>
                )}
                {details && (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Additional Details</dt>
                    <dd className="font-medium">{details}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}