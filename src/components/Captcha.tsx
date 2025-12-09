import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RefreshCw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaptchaProps {
  onVerify: (verified: boolean) => void;
  className?: string;
}

const generateCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operators = ["+", "-"] as const;
  const operator = operators[Math.floor(Math.random() * operators.length)];
  
  let answer: number;
  if (operator === "+") {
    answer = num1 + num2;
  } else {
    // Ensure we don't get negative answers
    const larger = Math.max(num1, num2);
    const smaller = Math.min(num1, num2);
    answer = larger - smaller;
    return { question: `${larger} ${operator} ${smaller}`, answer };
  }
  
  return { question: `${num1} ${operator} ${num2}`, answer };
};

export const Captcha = ({ onVerify, className = "" }: CaptchaProps) => {
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [userAnswer, setUserAnswer] = useState("");
  const [verified, setVerified] = useState<boolean | null>(null);

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setUserAnswer("");
    setVerified(null);
    onVerify(false);
  }, [onVerify]);

  useEffect(() => {
    if (userAnswer === "") {
      setVerified(null);
      onVerify(false);
      return;
    }

    const numAnswer = parseInt(userAnswer, 10);
    if (!isNaN(numAnswer)) {
      const isCorrect = numAnswer === captcha.answer;
      setVerified(isCorrect);
      onVerify(isCorrect);
    } else {
      setVerified(false);
      onVerify(false);
    }
  }, [userAnswer, captcha.answer, onVerify]);

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="flex items-center gap-2">
        Security Verification *
        {verified === true && <Check size={16} className="text-green-500" />}
        {verified === false && userAnswer && <X size={16} className="text-destructive" />}
      </Label>
      <div className="flex items-center gap-3">
        <div className="bg-muted px-4 py-2.5 rounded-lg font-mono text-lg font-semibold select-none">
          {captcha.question} = ?
        </div>
        <Input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Answer"
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
          className="h-11 w-11"
        >
          <RefreshCw size={18} />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Solve the math problem to verify you're human
      </p>
    </div>
  );
};
