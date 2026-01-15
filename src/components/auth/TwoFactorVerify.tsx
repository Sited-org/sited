import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2, AlertCircle } from 'lucide-react';

interface TwoFactorVerifyProps {
  onVerified: () => void;
  onCancel?: () => void;
}

export function TwoFactorVerify({ onVerified, onCancel }: TwoFactorVerifyProps) {
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) throw factorsError;

      const totpFactor = factorsData.totp[0];
      
      if (!totpFactor) {
        throw new Error('No 2FA factor found');
      }

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      onVerified();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
      setVerifyCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verifyCode.length === 6) {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
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
            onKeyDown={handleKeyDown}
            className="text-center text-2xl tracking-widest font-mono"
            autoFocus
          />
        </div>

        <Button 
          onClick={handleVerify} 
          className="w-full" 
          disabled={loading || verifyCode.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </Button>

        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
