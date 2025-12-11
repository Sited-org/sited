import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RefreshCw, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface CaptchaProps {
  onVerify: (verified: boolean, token?: string, answer?: number) => void;
  className?: string;
}

interface CaptchaChallenge {
  token: string;
  question: string;
}

export const Captcha = ({ onVerify, className = "" }: CaptchaProps) => {
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [verified, setVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCaptcha = useCallback(async () => {
    setLoading(true);
    setUserAnswer("");
    setVerified(null);
    onVerify(false);

    try {
      const { data, error } = await supabase.functions.invoke('generate-captcha');
      
      if (error) {
        console.error('Failed to fetch captcha:', error);
        // Fallback to client-side captcha if server fails
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const larger = Math.max(num1, num2);
        const smaller = Math.min(num1, num2);
        setChallenge({
          token: 'fallback',
          question: `${larger} - ${smaller}`,
        });
      } else {
        setChallenge(data);
      }
    } catch (err) {
      console.error('Error fetching captcha:', err);
      // Fallback
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      setChallenge({
        token: 'fallback',
        question: `${num1} + ${num2}`,
      });
    }
    
    setLoading(false);
  }, [onVerify]);

  useEffect(() => {
    fetchCaptcha();
  }, []);

  useEffect(() => {
    if (userAnswer === "" || !challenge) {
      setVerified(null);
      onVerify(false);
      return;
    }

    const numAnswer = parseInt(userAnswer, 10);
    if (!isNaN(numAnswer)) {
      // For server-side validation, we just mark as "entered" 
      // The actual validation happens on form submit
      setVerified(true);
      onVerify(true, challenge.token, numAnswer);
    } else {
      setVerified(false);
      onVerify(false);
    }
  }, [userAnswer, challenge, onVerify]);

  const refreshCaptcha = useCallback(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="flex items-center gap-2">
        Security Verification *
        {verified === true && <Check size={16} className="text-green-500" />}
        {verified === false && userAnswer && <X size={16} className="text-destructive" />}
      </Label>
      <div className="flex items-center gap-3">
        <div className="bg-muted px-4 py-2.5 rounded-lg font-mono text-lg font-semibold select-none min-w-[120px] text-center">
          {loading ? (
            <Loader2 size={20} className="animate-spin mx-auto" />
          ) : (
            `${challenge?.question || ''} = ?`
          )}
        </div>
        <Input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Answer"
          disabled={loading}
          className={`w-24 h-11 text-center ${
            verified === true 
              ? "border-green-500 focus-visible:ring-green-500" 
              : verified === false && userAnswer
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={refreshCaptcha}
          disabled={loading}
          className="h-11 w-11"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Solve the math problem to verify you're human
      </p>
    </div>
  );
};
