import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Mail, User, Phone, Calendar } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { TwoFactorVerify } from '@/components/auth/TwoFactorVerify';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional().or(z.literal('')),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMfaVerify, setShowMfaVerify] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [require2fa, setRequire2fa] = useState(false);
  
  const { signIn, signUp, isAuthenticated, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if 2FA is required by system settings
  useEffect(() => {
    const checkSettings = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'security')
        .maybeSingle();
      
      if (data?.setting_value) {
        const settings = data.setting_value as { require_2fa_for_team?: boolean };
        setRequire2fa(settings.require_2fa_for_team ?? false);
      }
    };
    checkSettings();
  }, []);

  useEffect(() => {
    const checkMfaAndRedirect = async () => {
      if (!loading && isAuthenticated && isAdmin && !showMfaVerify && !showMfaSetup) {
        // Check MFA status
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        
        const hasVerifiedTotp = factorsData?.totp?.some(f => f.status === 'verified') ?? false;
        
        if (aalData) {
          // If user has MFA enabled but hasn't verified this session
          if (aalData.nextLevel === 'aal2' && aalData.currentLevel === 'aal1') {
            setShowMfaVerify(true);
            return;
          }
          
          // If 2FA is required but user hasn't enrolled
          if (require2fa && !hasVerifiedTotp && aalData.currentLevel === 'aal1') {
            setShowMfaSetup(true);
            return;
          }
          
          // If user is fully authenticated (either no MFA required, or MFA verified)
          const isFullyAuthenticated = aalData.currentLevel === 'aal2' || 
            (aalData.nextLevel === 'aal1' && !require2fa);
          
          if (isFullyAuthenticated) {
            navigate('/admin');
          }
        }
      }
    };
    
    checkMfaAndRedirect();
  }, [isAuthenticated, isAdmin, loading, navigate, showMfaVerify, showMfaSetup, require2fa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (isSignUp) {
      const result = signupSchema.safeParse({ fullName, email, phone, dateOfBirth, password });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      setIsLoading(true);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: {
            full_name: fullName,
            phone: phone,
            date_of_birth: dateOfBirth,
          }
        }
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message === 'User already registered' 
            ? 'An account with this email already exists'
            : error.message,
          variant: "destructive"
        });
      } else if (data.user) {
        // Create admin profile
        await supabase.from('admin_profiles').insert({
          user_id: data.user.id,
          email: email,
          display_name: fullName,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
        });

        toast({
          title: "Account created",
          description: "Your account has been created. Please contact the owner to assign your role.",
        });
        setIsSignUp(false);
        setFullName('');
        setPhone('');
        setDateOfBirth('');
      }
    } else {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      setIsLoading(true);
      
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Login failed",
          description: error.message === 'Invalid login credentials' 
            ? 'Invalid email or password'
            : error.message,
          variant: "destructive"
        });
      } else {
        // Check if MFA is required after login
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData?.nextLevel === 'aal2' && aalData.currentLevel === 'aal1') {
          setShowMfaVerify(true);
        }
      }
    }
    
    setIsLoading(false);
  };

  const handleMfaVerified = () => {
    setShowMfaVerify(false);
    navigate('/admin');
  };

  const handleMfaSetupComplete = () => {
    setShowMfaSetup(false);
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show MFA verify screen
  if (showMfaVerify) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <TwoFactorVerify
          onVerified={handleMfaVerified}
          onCancel={async () => {
            await supabase.auth.signOut();
            setShowMfaVerify(false);
          }}
        />
      </div>
    );
  }

  // Show MFA setup screen
  if (showMfaSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <TwoFactorSetup
          onComplete={handleMfaSetupComplete}
          onSkip={require2fa ? undefined : handleMfaSetupComplete}
          required={require2fa}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              Sited<span className="text-muted-foreground">.admin</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {isSignUp ? 'Create Admin Account' : 'Admin Dashboard Login'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-destructive text-xs">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                    Date of Birth
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="text-destructive text-xs">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone (Optional)
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 234 567 890"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-destructive text-xs">{errors.phone}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sited.co"
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Access restricted to authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
