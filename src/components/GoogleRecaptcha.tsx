import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";

// reCAPTCHA site key - this is a publishable key
const RECAPTCHA_SITE_KEY = "6LfySkssAAAAAAEGC4rJcbcoNEF2ycS8-WmAyqgA";

interface GoogleRecaptchaProps {
  onVerify: (token: string | null) => void;
  className?: string;
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      enterprise?: {
        ready: (callback: () => void) => void;
        render: (
          container: HTMLElement,
          options: {
            sitekey: string;
            callback: (token: string) => void;
            'expired-callback': () => void;
            'error-callback': () => void;
            theme?: 'light' | 'dark';
            size?: 'compact' | 'normal';
          }
        ) => number;
        reset: (widgetId?: number) => void;
      };
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
          theme?: 'light' | 'dark';
          size?: 'compact' | 'normal';
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

export const GoogleRecaptcha = ({ onVerify, className = "" }: GoogleRecaptchaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onVerifyRef = useRef(onVerify);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  const resetRecaptcha = useCallback(() => {
    const grecaptchaApi = window.grecaptcha?.enterprise ?? window.grecaptcha;

    if (widgetIdRef.current !== null && grecaptchaApi?.reset) {
      try {
        grecaptchaApi.reset(widgetIdRef.current);
        setError(null);
        onVerifyRef.current(null);
      } catch (e) {
        console.error('Error resetting reCAPTCHA:', e);
      }
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount(prev => prev + 1);
    resetRecaptcha();
  }, [resetRecaptcha]);

  useEffect(() => {
    // Don't re-render if already rendered (unless retrying)
    if (isRendered && retryCount === 0) return;

    const renderRecaptcha = () => {
      if (!containerRef.current) return;

      const grecaptchaApi = window.grecaptcha?.enterprise ?? window.grecaptcha;
      if (!grecaptchaApi?.render) {
        setError('Security verification failed to initialize. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      // Reset widget if it exists
      if (widgetIdRef.current !== null) {
        try {
          grecaptchaApi.reset(widgetIdRef.current);
        } catch (e) {
          // Ignore reset errors
        }
        widgetIdRef.current = null;
      }

      try {
        widgetIdRef.current = grecaptchaApi.render(containerRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token: string) => {
            console.log('reCAPTCHA verified successfully');
            setError(null);
            onVerifyRef.current(token);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            onVerifyRef.current(null);
          },
          'error-callback': () => {
            const host = typeof window !== 'undefined' ? window.location.hostname : '';
            console.error('reCAPTCHA encountered an error (often key/domain mismatch). Host:', host);
            setError(`Verification unavailable for this domain (${host}). Please ensure this domain is allowed in your reCAPTCHA settings.`);
            onVerifyRef.current(null);
          },
          theme: 'light',
          size: 'normal',
        });
        setIsLoading(false);
        setIsRendered(true);
      } catch (err) {
        console.error('Error rendering reCAPTCHA:', err);
        setError('Failed to load verification. Please refresh the page.');
        setIsLoading(false);
      }
    };

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="recaptcha"]') as HTMLScriptElement | null;

    // Prefer Enterprise if present
    if (window.grecaptcha?.enterprise?.ready) {
      window.grecaptcha.enterprise.ready(renderRecaptcha);
      return;
    }

    if (window.grecaptcha?.ready) {
      window.grecaptcha.ready(renderRecaptcha);
      return;
    }

    if (existingScript) {
      // Script exists but not initialized yet
      existingScript.addEventListener('load', renderRecaptcha, { once: true });
      return;
    }

    // Load the reCAPTCHA script (fallback if not already present)
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/enterprise.js';
    script.async = true;
    script.defer = true;

    script.onload = renderRecaptcha;

    script.onerror = () => {
      setError('Failed to load security verification. Please check your connection.');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      const grecaptchaApi = window.grecaptcha?.enterprise ?? window.grecaptcha;
      if (widgetIdRef.current !== null && grecaptchaApi?.reset) {
        try {
          grecaptchaApi.reset(widgetIdRef.current);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isRendered, retryCount]);

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