import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Check } from "lucide-react";
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
  currentFormData: Record<string, any>;
  projectType: "website" | "app" | "ai";
}

export function OnboardingAIAssistant({
  isOpen,
  onClose,
  onDataCollected,
  currentFormData,
  projectType,
}: OnboardingAIAssistantProps) {
  // Generate personalized initial message based on collected form data
  const getInitialMessage = (): string => {
    const name = currentFormData?.fullName?.split(' ')[0]; // Get first name
    if (name) {
      return `Hey ${name}! 👋 Great to meet you. I'm here to help you fill out this form faster — just chat with me naturally and I'll gather everything we need. So tell me, what does your business do and who are your ideal customers?`;
    }
    return "Hey! 👋 I'm here to help you fill out this form faster. Just chat with me naturally and I'll gather all the info we need. What's your name and what kind of project are you working on?";
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: getInitialMessage(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
          currentFormData,
          collectedData,
          projectType,
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
            
            // Check for extracted data in tool calls
            if (parsed.extracted_data) {
              setCollectedData((prev) => ({ ...prev, ...parsed.extracted_data }));
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

      // Check for complete marker in the final response
      if (assistantContent.includes("[FORM_COMPLETE]")) {
        // Extract the JSON data
        const match = assistantContent.match(/\[FORM_DATA\]([\s\S]*?)\[\/FORM_DATA\]/);
        if (match) {
          try {
            const extractedData = JSON.parse(match[1]);
            setCollectedData((prev) => ({ ...prev, ...extractedData }));
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

  const handleApplyData = () => {
    onDataCollected(collectedData);
    onClose();
  };

  const hasCollectedData = Object.keys(collectedData).length > 0;

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
              Let's fill this out together
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

        {/* Collected Data Preview */}
        {hasCollectedData && (
          <div className="px-4 py-2 border-t border-border bg-green-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                <Check size={14} className="inline mr-1 text-green-500" />
                {Object.keys(collectedData).length} fields collected
              </span>
              <Button size="sm" variant="default" onClick={handleApplyData}>
                Apply to Form
              </Button>
            </div>
          </div>
        )}

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
