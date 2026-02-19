import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePageSEO } from "@/hooks/usePageSEO";

type Step = "q1" | "q2" | "q3" | "complete";

const ContactOffers = () => {
  usePageSEO({
    title: "Tell Us About Your Business | Sited",
    description: "Answer a few quick questions so we can match you with the right solution.",
  });

  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("q1");
  const [submitting, setSubmitting] = useState(false);

  const [businessType, setBusinessType] = useState<"service" | "retail" | null>(null);
  const [q2Answer, setQ2Answer] = useState<string | null>(null);

  const stepNumber = step === "q1" ? 1 : step === "q2" ? 2 : step === "q3" ? 3 : 3;

  const handleQ1 = (type: "service" | "retail") => {
    setBusinessType(type);
    setStep("q2");
  };

  const handleQ2 = (answer: string) => {
    setQ2Answer(answer);
    setStep("q3");
  };

  const handleQ3 = async (answer: string) => {
    setSubmitting(true);
    try {
      await supabase.functions.invoke("save-partial-lead", {
        body: {
          project_type: "website",
          form_data: {
            source: "offers_flow",
            partial: false,
            business_type: businessType,
            q2_answer: q2Answer,
            q3_answer: answer,
          },
        },
      });
    } catch (err) {
      console.error("Error saving questionnaire:", err);
    }
    setSubmitting(false);
    setStep("complete");
    toast.success("Thanks! We'll match you with the right solution.");
  };

  const q2Options =
    businessType === "retail"
      ? { question: "How many locations do you have?", options: ["1", "2-4", "5+"] }
      : { question: "How many areas do you service?", options: ["1-3", "3-7", "8+"] };

  const q3Options =
    businessType === "retail"
      ? { question: "How do you currently get most of your customers?", options: ["Walk ins / Direct", "Ads", "Word of mouth", "Returning Customers"] }
      : { question: "How many services do you offer?", options: ["1-3", "3-5", "6+"] };

  const goBack = () => {
    if (step === "q2") setStep("q1");
    else if (step === "q3") setStep("q2");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <motion.div
          className="h-full bg-sited-blue"
          animate={{ width: `${(stepNumber / 3) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5">
        {step !== "q1" && step !== "complete" ? (
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
        ) : (
          <div />
        )}
        <span className="text-xs text-muted-foreground font-medium">
          {step !== "complete" ? `Step ${stepNumber} of 3` : ""}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {step === "q1" && (
              <motion.div
                key="q1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">What type of business?</h1>
                  <p className="text-muted-foreground mt-2">Helps us tailor the right approach.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleQ1("service")}
                    className="p-8 rounded-2xl border-2 border-border hover:border-sited-blue text-center transition-all hover:shadow-soft group"
                  >
                    <span className="text-4xl block mb-3">🔧</span>
                    <span className="font-semibold text-foreground group-hover:text-sited-blue transition-colors">Service Based</span>
                  </button>
                  <button
                    onClick={() => handleQ1("retail")}
                    className="p-8 rounded-2xl border-2 border-border hover:border-sited-blue text-center transition-all hover:shadow-soft group"
                  >
                    <span className="text-4xl block mb-3">🏪</span>
                    <span className="font-semibold text-foreground group-hover:text-sited-blue transition-colors">Retail Based</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === "q2" && (
              <motion.div
                key="q2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{q2Options.question}</h1>
                </div>
                <div className="space-y-3">
                  {q2Options.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleQ2(opt)}
                      className="w-full p-5 rounded-2xl border-2 border-border hover:border-sited-blue text-left transition-all hover:shadow-soft flex items-center justify-between group"
                    >
                      <span className="font-medium text-foreground">{opt}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-sited-blue transition-colors" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "q3" && (
              <motion.div
                key="q3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{q3Options.question}</h1>
                </div>
                <div className="space-y-3">
                  {q3Options.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleQ3(opt)}
                      disabled={submitting}
                      className="w-full p-5 rounded-2xl border-2 border-border hover:border-sited-blue text-left transition-all hover:shadow-soft flex items-center justify-between group disabled:opacity-50"
                    >
                      <span className="font-medium text-foreground">{opt}</span>
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-sited-blue transition-colors" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-sited-blue/10 flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-sited-blue" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">You're all set!</h1>
                  <p className="text-muted-foreground mt-3 max-w-sm mx-auto">
                    We'll review your answers and match you with the right solution. You'll hear from us within 24 hours.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sited-blue text-white font-semibold hover:bg-sited-blue-hover transition-colors"
                >
                  Back to Home <ArrowRight size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ContactOffers;
