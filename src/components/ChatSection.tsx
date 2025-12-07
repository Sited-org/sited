import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { SiriOrb } from "./SiriOrb";
import { useChatStore, ProjectType } from "@/hooks/useChatStore";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-chat`;

export const ChatSection = () => {
  const { messages, addMessage, updateLastAssistant, collectedInfo, updateCollectedInfo, clearChat } = useChatStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

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
        content: "Having trouble connecting. Try again or email us at hello@sited.com" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToForm = (type: ProjectType) => {
    sessionStorage.setItem("chatbotInfo", JSON.stringify(collectedInfo));
    const routes: Record<ProjectType, string> = {
      website: "/onboarding/website",
      app: "/onboarding/app",
      ai: "/onboarding/ai",
    };
    navigate(routes[type]);
  };

  const suggestedFormType: ProjectType | null = collectedInfo.projectType || null;
  
  const formLabels: Record<ProjectType, string> = {
    website: "Website",
    app: "App", 
    ai: "AI Integration",
  };

  const hasEnoughInfo = messages.length >= 4 && (collectedInfo.name || collectedInfo.email || collectedInfo.projectType);

  // Parse message for form links
  const renderMessage = (content: string) => {
    // Check for AI form link
    if (content.includes("[Start AI Project]") || content.includes("/ai-onboarding")) {
      const parts = content.split(/\[Start AI Project\]|\/ai-onboarding/i);
      return (
        <>
          {parts[0]}
          <Button 
            size="sm" 
            variant="secondary" 
            className="mx-1 inline-flex"
            onClick={() => goToForm("ai")}
          >
            Start AI Project <ArrowRight size={14} />
          </Button>
          {parts[1] || ""}
        </>
      );
    }
    
    // Check for website form link
    if (content.includes("[Start Website Project]") || content.includes("/website-onboarding")) {
      const parts = content.split(/\[Start Website Project\]|\/website-onboarding/i);
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
          {parts[1] || ""}
        </>
      );
    }
    
    // Check for app form link
    if (content.includes("[Start App Project]") || content.includes("/app-onboarding")) {
      const parts = content.split(/\[Start App Project\]|\/app-onboarding/i);
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
          {parts[1] || ""}
        </>
      );
    }
    
    return content;
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-background to-surface-elevated py-12 sm:py-16 md:py-24 lg:py-32">
      <div className="container-tight">
        <div className="flex flex-col items-center">
          {/* Siri Orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-6 sm:mb-8"
          >
            <SiriOrb isThinking={isLoading} size="lg" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-6 sm:mb-8"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-1.5 sm:mb-2">Chat with Sited AI</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Tell us what you're building. We'll guide you.</p>
          </motion.div>

          {/* Chat Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-2xl"
          >
            {/* Messages */}
            <div className="bg-card border border-border rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="max-h-[320px] sm:max-h-[400px] overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
                <AnimatePresence mode="popLayout">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      layout
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-foreground text-background rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        {msg.role === "assistant" ? renderMessage(msg.content) : msg.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
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

              {/* Quick Action */}
              {hasEnoughInfo && suggestedFormType && (
                <div className="px-6 py-3 border-t border-border bg-surface-elevated/50">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => goToForm(suggestedFormType)}
                  >
                    Ready? Start your {formLabels[suggestedFormType]} project <ArrowRight size={16} />
                  </Button>
                </div>
              )}

              {/* Input */}
              <div className="p-3 sm:p-4 border-t border-border bg-background">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2 sm:gap-3"
                >
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground hover:text-foreground flex-shrink-0" 
                    onClick={clearChat}
                    disabled={isLoading || messages.length <= 1}
                  >
                    <RotateCcw size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </Button>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
                    disabled={isLoading}
                  />
                  <Button type="submit" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0" disabled={isLoading || !input.trim()}>
                    <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};