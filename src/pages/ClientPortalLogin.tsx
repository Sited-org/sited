import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EmailOTPVerify } from '@/components/auth/EmailOTPVerify';
import { usePageSEO } from '@/hooks/usePageSEO';

export default function ClientPortalLogin() {
  usePageSEO({
    title: "Members Login | Sited",
    description: "Secure client portal login for Sited members.",
  });

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check that a lead exists with this email before sending OTP
      const { data, error: invokeError } = await supabase.functions.invoke('verify-client-access', {
        body: { 
          email: email.trim().toLowerCase(), 
          skip_session: true,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Access denied');
      }

      if (data?.success || data?.valid) {
        setShowOTP(true);
      } else {
        throw new Error(data?.error || 'No account found with this email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify access');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = (sessionData: any) => {
    sessionStorage.setItem('clientPortalSession', JSON.stringify({
      lead: sessionData.lead,
      token: sessionData.sessionToken,
      email: email.trim().toLowerCase(),
      expiresAt: sessionData.expiresAt,
    }));
    const action = searchParams.get('action');
    const type = searchParams.get('type');
    const clientId = searchParams.get('clientId');
    const dashboardParams = new URLSearchParams();
    if (action) dashboardParams.set('action', action);
    if (type) dashboardParams.set('type', type);
    if (clientId) dashboardParams.set('clientId', clientId);
    const qs = dashboardParams.toString();
    navigate(`/client-portal/dashboard${qs ? `?${qs}` : ''}`);
  };

  if (showOTP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <EmailOTPVerify
          email={email}
          userType="client"
          onVerified={handleOTPVerified}
          onCancel={() => setShowOTP(false)}
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
              Enter your email to receive a verification code
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

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !email}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Verification Code
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
