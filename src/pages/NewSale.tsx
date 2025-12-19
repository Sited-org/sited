import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Building, MapPin, Globe, Sparkles, Copy, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

type Step = 'details' | 'prompt';

export default function NewSale() {
  const [step, setStep] = useState<Step>('details');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [copied, setCopied] = useState(false);

  const generatedPrompt = `Create a professional, modern website for "${businessName}", a business located in ${location}.

BUSINESS DETAILS:
- Business Name: ${businessName}
- Location: ${location}
${website ? `- Current Website (for reference): ${website}` : '- No existing website'}

WEBSITE REQUIREMENTS:
1. Create a single-page landing website with the following sections:
   - Hero section with business name, tagline, and call-to-action
   - About/Services section highlighting what the business offers
   - Contact section with location (${location}) and contact form
   - Footer with business information

2. Design Style:
   - Modern, clean, and professional aesthetic
   - Mobile-responsive design
   - Fast loading and optimized
   - Use appropriate color scheme for the industry

3. Content:
   - Generate professional placeholder content based on the business name
   - Include compelling headlines and descriptions
   - Add appropriate imagery placeholders

4. Call-to-Actions:
   - Primary CTA: "Get in Touch" or "Contact Us"
   - Secondary CTA: "Learn More"

Please create this website now. Make it look professional and ready to present to the client.`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !location.trim()) {
      toast.error('Please fill in business name and location');
      return;
    }
    setStep('prompt');
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
    setWebsite('');
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
              Enter the prospect's business information to generate a Lovable prompt
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
                  If they have an existing website, we'll use it for reference
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Generate Lovable Prompt
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 'prompt' && (
        <div className="space-y-6">
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Lovable Prompt Ready
              </CardTitle>
              <CardDescription>
                Copy this prompt and paste it into Lovable.dev to create the website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  value={generatedPrompt}
                  readOnly
                  className="min-h-[300px] font-mono text-sm resize-none bg-muted/50"
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

          {/* Preview Card */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Website Preview Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Business</dt>
                  <dd className="font-medium">{businessName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="font-medium">{location}</dd>
                </div>
                {website && (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Reference Website</dt>
                    <dd className="font-medium text-primary">{website}</dd>
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