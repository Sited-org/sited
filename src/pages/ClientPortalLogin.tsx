import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, User, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type LoginMode = 'initial' | 'password' | 'first_login';

export default function ClientPortalLogin() {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<LoginMode>('initial');
  const navigate = useNavigate();

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First, check if they have a password set
      const { data, error: invokeError } = await supabase.functions.invoke('verify-client-access', {
        body: { 
          email: email.trim().toLowerCase(), 
          access_code: accessCode.trim().toUpperCase(),
          mode: 'first_login'
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Access denied');
      }

      if (data?.requiresPassword) {
        // Has password, need to enter it
        setMode('password');
      } else if (data?.requiresPasswordSetup) {
        // First time - store session and redirect to dashboard for password setup
        sessionStorage.setItem('clientPortalSession', JSON.stringify({
          lead: data.lead,
          token: data.sessionToken,
          email: email.trim().toLowerCase(),
          isFirstLogin: true,
          requiresPasswordSetup: true,
        }));
        navigate('/client-portal/dashboard');
      } else if (data?.success) {
        // Access granted
        sessionStorage.setItem('clientPortalSession', JSON.stringify({
          lead: data.lead,
          token: data.sessionToken,
          email: email.trim().toLowerCase(),
          isFirstLogin: false,
        }));
        navigate('/client-portal/dashboard');
      } else {
        throw new Error(data?.error || 'Access denied');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify access');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('verify-client-access', {
        body: { 
          email: email.trim().toLowerCase(), 
          access_code: accessCode.trim().toUpperCase(),
          password,
        },
      });

      if (invokeError || data?.error) {
        throw new Error(data?.error || invokeError?.message || 'Access denied');
      }

      // Store session in sessionStorage
      sessionStorage.setItem('clientPortalSession', JSON.stringify({
        lead: data.lead,
        token: data.sessionToken,
        email: email.trim().toLowerCase(),
        isFirstLogin: false,
      }));

      navigate('/client-portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to verify access');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setMode('initial');
    setPassword('');
    setError('');
  };

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
              {mode === 'password' ? (
                <>
                  <KeyRound className="h-5 w-5" />
                  Enter Your Password
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Secure Login
                </>
              )}
            </CardTitle>
            <CardDescription>
              {mode === 'password' 
                ? 'Enter your password to access your portal'
                : 'Enter your email and access code to continue'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'initial' ? (
              <form onSubmit={handleInitialLogin} className="space-y-4">
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
                      Continue
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium">{email}</p>
                  <p className="text-muted-foreground text-xs font-mono">Code: {accessCode}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={goBack}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={loading || !password}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Login
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Having trouble accessing your portal? Contact support.
        </p>
      </div>
    </div>
  );
}
