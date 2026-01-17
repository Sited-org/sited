import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";

// reCAPTCHA Enterprise site key
const RECAPTCHA_SITE_KEY = "6LfySkssAAAAAJ4fnEykeEgrL-7XiMzZWwYrf-VT";

interface GoogleRecaptchaProps {
  onVerify: (token: string | null) => void;
  className?: string;
  action?: string;
}

declare global {
  interface Window {
    grecaptcha: {
      enterprise: {
        ready: (callback: () => void) => void;
        render: (
          container: HTMLElement | string,
          options: {
            sitekey: string;
            action?: string;
            callback?: (token: string) => void;
            'expired-callback'?: () => void;
            'error-callback'?: () => void;
            theme?: 'light' | 'dark';
            size?: 'compact' | 'normal';
          }
        ) => number;
        reset: (widgetId?: number) => void;
      };
    };
  }
}

export const GoogleRecaptcha = ({ 
  onVerify, 
  className = "",
  action = "LOGIN"
}: GoogleRecaptchaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onVerifyRef = useRef(onVerify);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep callback ref updated
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  const handleRetry = useCallback(() => {
    setError(null);
    if (widgetIdRef.current !== null && window.grecaptcha?.enterprise?.reset) {
      try {
        window.grecaptcha.enterprise.reset(widgetIdRef.current);
      } catch (e) {
        console.error('Reset error:', e);
      }
    }
  }, []);

  useEffect(() => {
    const renderWidget = () => {
      if (!containerRef.current || widgetIdRef.current !== null) return;

      try {
        widgetIdRef.current = window.grecaptcha.enterprise.render(containerRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          action: action,
          callback: (token: string) => {
            console.log('reCAPTCHA verified');
            onVerifyRef.current(token);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            onVerifyRef.current(null);
          },
          'error-callback': () => {
            console.error('reCAPTCHA error');
            setError('Verification failed. Please try again.');
            onVerifyRef.current(null);
          },
          theme: 'light',
          size: 'normal',
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Render error:', err);
        setError('Failed to load verification.');
        setIsLoading(false);
      }
    };

    // Wait for grecaptcha.enterprise to be ready
    if (window.grecaptcha?.enterprise?.ready) {
      window.grecaptcha.enterprise.ready(renderWidget);
    } else {
      // Poll until ready
      const interval = setInterval(() => {
        if (window.grecaptcha?.enterprise?.ready) {
          clearInterval(interval);
          window.grecaptcha.enterprise.ready(renderWidget);
        }
      }, 100);

      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (widgetIdRef.current === null) {
          setError('Security verification timed out. Please refresh.');
          setIsLoading(false);
        }
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [action]);

  if (error) {
    return (
      <div className={`p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-amber-700 dark:text-amber-400">{error}</p>
          <button 
            type="button"
            onClick={handleRetry} 
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-center min-h-[78px]">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading security verification...</span>
          </div>
        )}
        <div 
          ref={containerRef}
          className={isLoading ? 'hidden' : ''}
        />
      </div>
    </div>
  );
};
