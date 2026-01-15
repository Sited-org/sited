import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmailOTPVerifyProps {
  email: string;
  userId?: string; // For admin users
  accessCode?: string; // For client users
  userType: 'admin' | 'client';
  onVerified: (data?: any) => void;
  onCancel: () => void;
}

export function EmailOTPVerify({ 
  email, 
  userId,
  accessCode,
  userType,
  onVerified, 
  onCancel 
}: EmailOTPVerifyProps) {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Create a unique session key for this OTP request to prevent duplicates
  const sessionKey = userType === 'admin' 
    ? `otp_sent_admin_${userId}` 
    : `otp_sent_client_${email}`;
  
  // Use ref to track if we've initiated sending in this component instance
  const isSendingRef = useRef(false);

  useEffect(() => {
    // Check if we've already sent a code recently (within last 30 seconds)
    const lastSentTime = sessionStorage.getItem(sessionKey);
    const now = Date.now();
    
    if (lastSentTime && now - parseInt(lastSentTime) < 30000) {
      // Code was sent recently, don't send again
      setCodeSent(true);
      const elapsed = Math.floor((now - parseInt(lastSentTime)) / 1000);
      setCountdown(Math.max(0, 60 - elapsed));
      return;
    }
    
    // Only send if we haven't started sending yet
    if (!isSendingRef.current) {
      isSendingRef.current = true;
      sendVerificationCode();
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendVerificationCode = async (isResend = false) => {
    // Prevent duplicate sends
    if (sendingCode) return;
    
    setSendingCode(true);
    setError('');

    try {
      const functionName = userType === 'admin' ? 'send-admin-otp' : 'send-client-otp';
      const body = userType === 'admin' 
        ? { user_id: userId }
        : { email: email.trim().toLowerCase() };

      const { data, error: invokeError } = await supabase.functions.invoke(functionName, {
        body,
      });

      if (invokeError) throw new Error(invokeError.message);
      if (data?.error) throw new Error(data.error);

      // Mark that we've sent a code with timestamp
      sessionStorage.setItem(sessionKey, Date.now().toString());
      
      setCodeSent(true);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      // Clear the sending flag so user can retry
      isSendingRef.current = false;
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (userType === 'admin') {
        const { data, error: invokeError } = await supabase.functions.invoke('verify-admin-otp', {
          body: { 
            user_id: userId,
            otp_code: otpCode,
          },
        });

        if (invokeError) throw new Error(invokeError.message);
        if (!data?.success) throw new Error(data?.error || 'Invalid verification code');

        onVerified();
      } else {
        // Client verification with session creation
        const { data, error: invokeError } = await supabase.functions.invoke('verify-client-otp', {
          body: { 
            email: email.trim().toLowerCase(),
            access_code: accessCode?.trim().toUpperCase(),
            otp_code: otpCode,
          },
        });

        if (invokeError) throw new Error(invokeError.message);
        if (!data?.success) throw new Error(data?.error || 'Invalid verification code');

        onVerified(data);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otpCode.length === 6) {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Enter Verification Code</CardTitle>
        <CardDescription>
          {codeSent 
            ? (userType === 'admin' ? 'We sent a 6-digit code to your email on file' : `We sent a 6-digit code to ${email}`)
            : 'Sending verification code to your email...'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {sendingCode && !codeSent ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={handleKeyDown}
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
            </div>

            <Button 
              onClick={handleVerify} 
              className="w-full" 
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Didn't receive a code?</span>
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => sendVerificationCode(true)}
                disabled={countdown > 0 || sendingCode}
                className="p-0 h-auto"
              >
                {countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : sendingCode ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Resend
                  </>
                )}
              </Button>
            </div>

            <Button variant="ghost" onClick={onCancel} className="w-full">
              Cancel
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
