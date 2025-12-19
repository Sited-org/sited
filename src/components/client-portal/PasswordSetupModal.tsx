import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PasswordSetupModalProps {
  open: boolean;
  onComplete: () => void;
  leadId: string;
  email: string;
}

export function PasswordSetupModal({ open, onComplete, leadId, email }: PasswordSetupModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const passwordRequirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
  ];

  const allRequirementsMet = passwordRequirements.every(r => r.met);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('verify-client-access', {
        body: { 
          email: email.toLowerCase().trim(),
          lead_id: leadId,
          new_password: password,
          mode: 'set_password'
        },
      });

      if (invokeError || data?.error) {
        throw new Error(data?.error || invokeError?.message || 'Failed to set password');
      }

      // Update session storage to mark password as set
      const session = sessionStorage.getItem('clientPortalSession');
      if (session) {
        const parsed = JSON.parse(session);
        parsed.isFirstLogin = false;
        parsed.requiresPasswordSetup = false;
        sessionStorage.setItem('clientPortalSession', JSON.stringify(parsed));
      }

      toast.success('Password created successfully!');
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Create Your Password
          </DialogTitle>
          <DialogDescription>
            Set up a password for future logins. You'll use your email and password to access your portal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password">Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            {confirmPassword && (
              <p className={`text-xs flex items-center gap-1 ${passwordsMatch ? 'text-green-600' : 'text-destructive'}`}>
                {passwordsMatch ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
            {passwordRequirements.map((req, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs ${req.met ? 'text-green-600' : 'text-muted-foreground'}`}>
                {req.met ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                {req.text}
              </div>
            ))}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !allRequirementsMet || !passwordsMatch}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating password...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Create Password
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
