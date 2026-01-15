import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, User, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ClientTwoFactorVerify } from '@/components/auth/ClientTwoFactorVerify';

export default function ClientPortalLogin() {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First verify access code is valid before proceeding to 2FA
      const { data, error: invokeError } = await supabase.functions.invoke('verify-client-access', {
        body: { 
          email: email.trim().toLowerCase(), 
          access_code: accessCode.trim().toUpperCase(),
          skip_session: true, // Just validate, don't create session yet
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Access denied');
      }

      if (data?.success || data?.valid) {
        // Credentials are valid, proceed to 2FA
        setShowTwoFactor(true);
      } else {
        throw new Error(data?.error || 'Access denied');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify access');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorVerified = (sessionData: any) => {
    sessionStorage.setItem('clientPortalSession', JSON.stringify({
      lead: sessionData.lead,
      token: sessionData.sessionToken,
      email: email.trim().toLowerCase(),
      expiresAt: sessionData.expiresAt,
    }));
    navigate('/client-portal/dashboard');
  };

  // Show 2FA verification
  if (showTwoFactor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <ClientTwoFactorVerify
          email={email}
          accessCode={accessCode}
          onVerified={handleTwoFactorVerified}
          onCancel={() => setShowTwoFactor(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Client Portal</h1>
          <p className="text-muted-foreground mt-2">
            Your project hub for updates, payments, and progress
          </p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Secure Login
            </CardTitle>
            <CardDescription>
              Enter your email and access code to continue
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
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="e.g. A1B2C3D4"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  required
                  className="font-mono tracking-wider uppercase"
                  maxLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Your access code was provided when you started your project
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !email || !accessCode}
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
