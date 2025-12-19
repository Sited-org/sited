import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, User, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function ClientPortalLogin() {
  const [email, setEmail] = useState('');
  const [leadId, setLeadId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('verify-client-access', {
        body: { email: email.trim().toLowerCase(), lead_id: leadId.trim() },
      });

      if (invokeError || data?.error) {
        throw new Error(data?.error || invokeError?.message || 'Access denied');
      }

      // Store session in sessionStorage
      sessionStorage.setItem('clientPortalSession', JSON.stringify({
        lead: data.lead,
        token: data.sessionToken,
        email: email.trim().toLowerCase(),
      }));

      navigate('/client-portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to verify access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Client Portal</h1>
          <p className="text-muted-foreground mt-2">Access your project and payment details</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Secure Login
            </CardTitle>
            <CardDescription>
              Enter your email and Lead ID to access your portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadId">Lead ID</Label>
                <Input
                  id="leadId"
                  type="text"
                  placeholder="Your Lead ID (e.g., abc12345-...)"
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your Lead ID was provided when you started your project
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !email || !leadId}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Access Portal
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Having trouble accessing your portal? Contact support.
        </p>
      </div>
    </div>
  );
}
