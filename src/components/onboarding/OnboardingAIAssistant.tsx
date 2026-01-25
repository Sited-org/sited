import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiriOrb } from "@/components/SiriOrb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding-assistant`;

type Message = { role: "user" | "assistant"; content: string };

interface OnboardingAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onDataCollected: (data: Record<string, any>) => void;
  onStepComplete?: (step: number) => void;
  onFormComplete?: () => void;
  currentFormData: Record<string, any>;
  currentStep?: number;
  projectType: "website" | "app" | "ai";
}

export function OnboardingAIAssistant({
  isOpen,
  onClose,
  onDataCollected,
  onStepComplete,
  onFormComplete,
  currentFormData,
  currentStep = 1,
  projectType,
}: OnboardingAIAssistantProps) {
  // Build a context-aware greeting based on ALL known form data
  const getInitialMessage = useCallback((): string => {
    const name = currentFormData?.fullName?.split(' ')[0];
    const businessName = currentFormData?.businessName;
    const industry = currentFormData?.industry;
    const budget = currentFormData?.budget;
    const timeline = currentFormData?.timeline;
    const primaryGoal = currentFormData?.primaryGoal;
    
    // Build acknowledgment of what we know
    const knownBits: string[] = [];
    
    if (businessName) knownBits.push(`working on ${businessName}'s website`);
    else if (industry) knownBits.push(`in the ${industry} space`);
    
    if (primaryGoal) knownBits.push(`focused on ${primaryGoal.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ')}`);
    if (budget) knownBits.push(`with a ${budget.replace(/_/g, ' ').replace(/-/g, ' ')} budget`);
    if (timeline) knownBits.push(`looking at a ${timeline.replace(/_/g, ' ').replace(/-/g, ' ')} timeline`);
    
    // Determine what to ask next based on current step
    let greeting = name ? `Hey ${name}! 👋` : "Hey there! 👋";
    
    if (knownBits.length > 0) {
      greeting += ` I see you're ${knownBits.slice(0, 2).join(' and ')}.`;
    }
    
    // Step-specific prompts
    switch (currentStep) {
      case 1:
        if (!currentFormData?.email) {
          greeting += " What's your email so we can keep you updated?";
        } else {
          greeting += " I've got your contact info — let's move on to your business!";
        }
        break;
      case 2:
        if (!businessName) {
          greeting += " Tell me about your business — what's it called and what do you do?";
        } else if (!currentFormData?.targetAudience) {
          greeting += " Who are your ideal customers?";
        } else {
          greeting += " Great business details! What's the main goal for your website?";
        }
        break;
      case 3:
        if (!primaryGoal) {
          greeting += " What's the main goal for the website — leads, sales, bookings?";
        } else {
          greeting += " Perfect goals! Any design preferences in mind?";
        }
        break;
      case 4:
        if (!currentFormData?.designStyle) {
          greeting += " What design style are you going for — modern, bold, elegant?";
        } else {
          greeting += " Love the design direction! Do you have a current website or domain?";
        }
        break;
      case 5:
        if (!currentFormData?.domainOwned) {
          greeting += " Do you already own a domain name?";
        } else {
          greeting += " Great! Last couple of questions — timeline and budget?";
        }
        break;
      case 6:
        if (!timeline) {
          greeting += " What's your timeline looking like?";
        } else if (!budget) {
          greeting += " And what budget are you working with?";
        } else {
          greeting += " We're all set! Submit the form when ready, and we'll be in touch within 24 hours. 🚀";
        }
        break;
      default:
        greeting += " How can I help you with the form?";
    }
    
    return greeting;
  }, [currentFormData, currentStep]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const [appliedFields, setAppliedFields] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset messages with personalized greeting when dialog opens or step changes
  useEffect(() => {
    if (isOpen) {
      setMessages([{ role: "assistant", content: getInitialMessage() }]);
      setCollectedData({});
      setAppliedFields([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentStep, getInitialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-apply collected data to form immediately
  const applyExtractedData = useCallback((data: Record<string, any>) => {
    const { stepComplete, formComplete, ...formFields } = data;
    
    // Filter out empty values
    const validFields = Object.entries(formFields)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, any>);
    
    if (Object.keys(validFields).length > 0) {
      // Update local tracking
      setCollectedData(prev => ({ ...prev, ...validFields }));
      setAppliedFields(prev => [...new Set([...prev, ...Object.keys(validFields)])]);
      
      // Apply to parent form immediately
      onDataCollected(validFields);
    }
    
    // Handle step completion
    if (stepComplete && onStepComplete) {
      setTimeout(() => {
        onStepComplete(stepComplete);
      }, 1000); // Small delay so user sees the response first
    }
    
    // Handle form completion
    if (formComplete && onFormComplete) {
      setTimeout(() => {
        onFormComplete();
      }, 1500);
    }
  }, [onDataCollected, onStepComplete, onFormComplete]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          currentFormData: { ...currentFormData, ...collectedData },
          collectedData,
          projectType,
          currentStep,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let hasAddedAssistant = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            
            // Check for extracted data from tool calls
            if (parsed.extracted_data) {
              applyExtractedData(parsed.extracted_data);
            }
            
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              if (!hasAddedAssistant) {
                setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
                hasAddedAssistant = true;
              } else {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                  return updated;
                });
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Fallback: Parse message for legacy markers
      if (assistantContent.includes("[FORM_DATA]")) {
        const match = assistantContent.match(/\[FORM_DATA\]([\s\S]*?)\[\/FORM_DATA\]/);
        if (match) {
          try {
            const extractedData = JSON.parse(match[1]);
            applyExtractedData(extractedData);
          } catch (e) {
            console.error("Failed to parse extracted data", e);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Oops, hit a snag there. Let's try that again — what were you saying?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasAppliedFields = appliedFields.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] h-[600px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border bg-surface-elevated flex-row items-center gap-3">
          <div className="w-10 h-10">
            <SiriOrb size="sm" isThinking={isLoading} />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-base">Sited AI Assistant</DialogTitle>
            <p className="text-xs text-muted-foreground">
              {hasAppliedFields 
                ? `Filling out your form (${appliedFields.length} fields added)` 
                : "Let's fill this out together"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-foreground text-background rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {msg.content.replace(/\[FORM_COMPLETE\]|\[FORM_DATA\][\s\S]*?\[\/FORM_DATA\]/g, "")}
              </div>
            </motion.div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-muted-foreground"
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Applied Fields Indicator */}
        <AnimatePresence>
          {hasAppliedFields && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2 border-t border-border bg-green-500/5"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check size={14} className="text-green-500" />
                <span>Auto-filled: {appliedFields.slice(0, 3).join(', ')}{appliedFields.length > 3 ? ` +${appliedFields.length - 3} more` : ''}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me about your project..."
              className="flex-1 h-11"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="h-11 w-11" disabled={isLoading || !input.trim()}>
              <Send size={18} />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
