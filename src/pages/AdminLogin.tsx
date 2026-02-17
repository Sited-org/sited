import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { EmailOTPVerify } from '@/components/auth/EmailOTPVerify';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOTPVerify, setShowOTPVerify] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  
  const { isAuthenticated, isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if already authenticated and OTP verified
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (!loading && isAuthenticated && isAdmin && !showOTPVerify) {
        // Check if user has completed OTP verification for this session
        const otpVerified = sessionStorage.getItem(`admin_otp_verified_${user?.id}`);
        if (otpVerified === 'true') {
          navigate('/admin');
        } else if (user?.id) {
          // User is authenticated but needs OTP verification
          setPendingUserId(user.id);
          setShowOTPVerify(true);
        }
      }
    };
    
    checkAuthAndRedirect();
  }, [isAuthenticated, isAdmin, loading, navigate, showOTPVerify, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
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
    
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Login failed",
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password'
          : error.message,
        variant: "destructive"
      });
    } else if (data.user) {
      // Successfully authenticated, now require OTP verification
      sessionStorage.removeItem(`admin_otp_verified_${data.user.id}`);
      sessionStorage.removeItem(`otp_sent_admin_${data.user.id}`);
      setPendingUserId(data.user.id);
      setShowOTPVerify(true);
    }
    
    setIsLoading(false);
  };

  const handleOTPVerified = async () => {
    // Mark this session as OTP verified
    if (pendingUserId) {
      sessionStorage.setItem(`admin_otp_verified_${pendingUserId}`, 'true');
    }
    setShowOTPVerify(false);
    
    // Check if user is a developer and redirect accordingly
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', pendingUserId!)
      .maybeSingle();
    
    if (roleData?.role === 'developer') {
      navigate('/dev');
    } else {
      navigate('/admin');
    }
  };

  const handleOTPCancel = async () => {
    // Sign out the user if they cancel OTP verification
    await supabase.auth.signOut();
    setShowOTPVerify(false);
    setPendingUserId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show OTP verification screen
  if (showOTPVerify && pendingUserId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <EmailOTPVerify
          email={email || user?.email || ''}
          userId={pendingUserId}
          userType="admin"
          onVerified={handleOTPVerified}
          onCancel={handleOTPCancel}
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
              Admin Dashboard Login
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>


          <p className="text-center text-xs text-muted-foreground mt-6">
            Access restricted to authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
