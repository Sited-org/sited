import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function TwoFactorSetup({ onComplete, onSkip }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify'>('intro');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const startEnrollment = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Sited Admin',
      });

      if (enrollError) throw enrollError;

      if (data?.totp) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep('qr');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start 2FA enrollment');
    } finally {
      setLoading(false);
    }
  };

  const verifyEnrollment = async () => {
    if (verifyCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been set up successfully.",
      });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast({
      title: "Copied",
      description: "Secret key copied to clipboard",
    });
  };

  if (step === 'intro') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Secure Your Account</CardTitle>
          <CardDescription>
            Add an extra layer of security with two-factor authentication (2FA)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Two-factor authentication adds an extra layer of security by requiring:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Your password</li>
              <li>A code from your authenticator app</li>
            </ul>
          </div>
          
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button onClick={startEnrollment} className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Set Up 2FA
              </>
            )}
          </Button>
          
          {onSkip && (
            <Button variant="ghost" onClick={onSkip} className="w-full">
              Skip for now
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === 'qr') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Use your authenticator app to scan this QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Or enter this secret manually:
            </Label>
            <div className="flex gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                {secret}
              </code>
              <Button variant="outline" size="icon" onClick={copySecret}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button onClick={() => setStep('verify')} className="w-full">
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Verify Setup</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="code">Verification Code</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
            className="text-center text-2xl tracking-widest font-mono"
          />
        </div>

        <Button onClick={verifyEnrollment} className="w-full" disabled={loading || verifyCode.length !== 6}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify & Enable 2FA
            </>
          )}
        </Button>

        <Button variant="ghost" onClick={() => setStep('qr')} className="w-full">
          Back to QR Code
        </Button>
      </CardContent>
    </Card>
  );
}
