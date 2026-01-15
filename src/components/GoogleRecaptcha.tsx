import { useEffect, useRef, useCallback, useState } from "react";
import { Loader2 } from "lucide-react";

// reCAPTCHA site key - this is a publishable key
const RECAPTCHA_SITE_KEY = "6LcXJqMqAAAAAApg1f6hHZ2XGPFJ0CSlLZYQNlgH";

interface GoogleRecaptchaProps {
  onVerify: (token: string | null) => void;
  className?: string;
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback': () => void;
        'error-callback': () => void;
        theme?: 'light' | 'dark';
        size?: 'compact' | 'normal';
      }) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

export const GoogleRecaptcha = ({ onVerify, className = "" }: GoogleRecaptchaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const renderRecaptcha = useCallback(() => {
    if (!containerRef.current || widgetIdRef.current !== null) return;

    try {
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token: string) => {
          onVerify(token);
        },
        'expired-callback': () => {
          onVerify(null);
        },
        'error-callback': () => {
          setError('reCAPTCHA error. Please try again.');
          onVerify(null);
        },
        theme: 'light',
        size: 'normal',
      });
      setIsLoading(false);
    } catch (err) {
      console.error('Error rendering reCAPTCHA:', err);
      setError('Failed to load reCAPTCHA');
      setIsLoading(false);
    }
  }, [onVerify]);

  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="recaptcha"]');
    
    if (window.grecaptcha?.ready) {
      window.grecaptcha.ready(renderRecaptcha);
      return;
    }

    if (existingScript) {
      // Script exists but not loaded yet
      window.onRecaptchaLoad = renderRecaptcha;
      return;
    }

    // Load the reCAPTCHA script
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;
    
    window.onRecaptchaLoad = renderRecaptcha;
    
    script.onerror = () => {
      setError('Failed to load reCAPTCHA script');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [renderRecaptcha]);

  if (error) {
    return (
      <div className={`p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center ${className}`}>
        <p className="text-sm text-destructive">{error}</p>
        <button 
          type="button"
          onClick={() => window.location.reload()} 
          className="text-xs text-primary underline mt-2"
        >
          Reload page to try again
        </button>
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
