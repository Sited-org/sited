import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { SiriOrb } from "./SiriOrb";
import { useChatStore } from "@/hooks/useChatStore";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-chat`;

export const GlobalChatButton = () => {
  const { messages, addMessage, updateLastAssistant, collectedInfo, updateCollectedInfo, isOpen, setIsOpen } = useChatStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const extractInfo = (text: string) => {
    const updated = { ...collectedInfo };
    
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) updated.email = emailMatch[0];
    
    const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
    if (phoneMatch) updated.phone = phoneMatch[0];
    
    const nameMatch = text.match(/(?:i'm|i am|my name is|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (nameMatch) updated.name = nameMatch[1];
    
    const businessMatch = text.match(/(?:company|business|we're|we are|our company is|at)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s*[,.]|\s+and|\s+is|\s+we|$)/i);
    if (businessMatch) updated.businessName = businessMatch[1].trim();
    
    const lowerText = text.toLowerCase();
    if (lowerText.includes("website") || lowerText.includes("web site") || lowerText.includes("landing page")) {
      updated.projectType = "website";
    } else if (lowerText.includes("app") || lowerText.includes("mobile") || lowerText.includes("ios") || lowerText.includes("android")) {
      updated.projectType = "app";
    } else if (lowerText.includes("ai") || lowerText.includes("chatbot") || lowerText.includes("automation")) {
      updated.projectType = "ai";
    }
    
    return updated;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput("");
    
    const newInfo = extractInfo(userMessage);
    updateCollectedInfo(newInfo);
    
    addMessage({ role: "user", content: userMessage });
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
          collectedInfo: newInfo,
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
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              if (!hasAddedAssistant) {
                addMessage({ role: "assistant", content: assistantContent });
                hasAddedAssistant = true;
              } else {
                updateLastAssistant(assistantContent);
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      addMessage({ 
        role: "assistant", 
        content: "Connection issue. Try again or email hello@sited.com" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToForm = (type: "website" | "app") => {
    sessionStorage.setItem("chatbotInfo", JSON.stringify(collectedInfo));
    setIsOpen(false);
    navigate(type === "website" ? "/website-onboarding" : "/app-onboarding");
  };

  const suggestedFormType = collectedInfo.projectType === "website" || collectedInfo.projectType === "ai" 
    ? "website" 
    : collectedInfo.projectType === "app" 
    ? "app" 
    : null;

  const hasEnoughInfo = messages.length >= 4 && (collectedInfo.name || collectedInfo.email || collectedInfo.projectType);

  const renderMessage = (content: string) => {
    const websiteFormPattern = /\[Start Website Project\]|\/website-onboarding/gi;
    const appFormPattern = /\[Start App Project\]|\/app-onboarding/gi;
    
    if (websiteFormPattern.test(content)) {
      const parts = content.split(websiteFormPattern);
      return (
        <>
          {parts[0]}
          <Button 
            size="sm" 
            variant="secondary" 
            className="mx-1 inline-flex"
            onClick={() => goToForm("website")}
          >
            Start Website Project <ArrowRight size={14} />
          </Button>
          {parts[1]}
        </>
      );
    }
    
    if (appFormPattern.test(content)) {
      const parts = content.split(appFormPattern);
      return (
        <>
          {parts[0]}
          <Button 
            size="sm" 
            variant="secondary" 
            className="mx-1 inline-flex"
            onClick={() => goToForm("app")}
          >
            Start App Project <ArrowRight size={14} />
          </Button>
          {parts[1]}
        </>
      );
    }
    
    return content;
  };

  return (
    <>
      {/* Floating Orb Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <SiriOrb size="sm" onClick={() => setIsOpen(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-6rem)] bg-card border border-border rounded-2xl shadow-elevated flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-surface-elevated flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10">
                  <SiriOrb size="sm" isThinking={isLoading} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Sited AI</h3>
                  <p className="text-xs text-muted-foreground">Let's build something great</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

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
                    {msg.role === "assistant" ? renderMessage(msg.content) : msg.content}
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

            {/* Quick Actions */}
            {hasEnoughInfo && suggestedFormType && (
              <div className="px-4 py-2 border-t border-border bg-surface-elevated/50">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => goToForm(suggestedFormType)}
                >
                  Start {suggestedFormType === "website" ? "Website" : "App"} Project <ArrowRight size={16} />
                </Button>
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
                  placeholder="Type your message..."
                  className="flex-1 h-11"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" className="h-11 w-11" disabled={isLoading || !input.trim()}>
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};