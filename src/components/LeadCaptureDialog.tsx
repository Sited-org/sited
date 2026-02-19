import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(1, "Phone is required").max(30),
});

type Step = "contact" | "q1" | "q2" | "q3" | "submitted";

interface LeadCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadCaptureDialog({ open, onOpenChange }: LeadCaptureDialogProps) {
  const [step, setStep] = useState<Step>("contact");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Contact info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Questionnaire
  const [businessType, setBusinessType] = useState<"service" | "retail" | null>(null);
  const [q2Answer, setQ2Answer] = useState<string | null>(null);
  const [q3Answer, setQ3Answer] = useState<string | null>(null);

  const resetForm = () => {
    setStep("contact");
    setName("");
    setEmail("");
    setPhone("");
    setBusinessType(null);
    setQ2Answer(null);
    setQ3Answer(null);
    setErrors({});
  };

  const handleContactSubmit = async () => {
    const result = contactSchema.safeParse({ name, email, phone });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    // Save partial lead
    setSubmitting(true);
    try {
      await supabase.functions.invoke("save-partial-lead", {
        body: {
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone,
          project_type: "website",
          form_data: { contactInfoOnly: true, source: "cta_popup" },
        },
      });
    } catch (err) {
      console.error("Error saving partial lead:", err);
    }
    setSubmitting(false);
    setStep("q1");
  };

  const handleQ1 = (type: "service" | "retail") => {
    setBusinessType(type);
    setStep("q2");
  };

  const handleQ2 = (answer: string) => {
    setQ2Answer(answer);
    setStep("q3");
  };

  const handleQ3 = async (answer: string) => {
    setQ3Answer(answer);
    setSubmitting(true);

    try {
      await supabase.functions.invoke("save-partial-lead", {
        body: {
          email,
          name,
          phone,
          project_type: "website",
          form_data: {
            source: "cta_popup",
            partial: false,
            business_type: businessType,
            q2_answer: q2Answer,
            q3_answer: answer,
          },
        },
      });

      // Send notification
      await supabase.functions.invoke("send-lead-notification", {
        body: { name, email, phone, project_type: "website", form_data: { business_type: businessType } },
      });
    } catch (err) {
      console.error("Error finalizing lead:", err);
    }

    setSubmitting(false);
    setStep("submitted");
    toast.success("Thanks! We'll be in touch shortly.");
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  // Q2 options based on business type
  const q2Options =
    businessType === "retail"
      ? { question: "How many locations do you have?", options: ["1", "2-4", "5+"] }
      : { question: "How many areas do you service?", options: ["1-3", "3-7", "8+"] };

  // Q3 options based on business type
  const q3Options =
    businessType === "retail"
      ? { question: "How do you currently get most of your customers?", options: ["Walk ins / Direct", "Ads", "Word of mouth", "Returning Customers"] }
      : { question: "How many services do you offer?", options: ["1-3", "3-5", "6+"] };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Get Started</DialogTitle>

        {/* Progress bar */}
        {step !== "submitted" && (
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-sited-blue transition-all duration-500"
              style={{
                width:
                  step === "contact" ? "25%" : step === "q1" ? "50%" : step === "q2" ? "75%" : "100%",
              }}
            />
          </div>
        )}

        <div className="p-6 sm:p-8">
          {/* Step: Contact Info */}
          {step === "contact" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-foreground">Let's get started</h3>
                <p className="text-sm text-muted-foreground mt-1">Quick details so we can get back to you.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="lc-name">Name</Label>
                  <Input
                    id="lc-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="mt-1"
                  />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="lc-email">Email</Label>
                  <Input
                    id="lc-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@business.com"
                    className="mt-1"
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="lc-phone">Phone</Label>
                  <Input
                    id="lc-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="04XX XXX XXX"
                    className="mt-1"
                  />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>
              </div>
              <Button
                onClick={handleContactSubmit}
                disabled={submitting}
                className="w-full bg-sited-blue hover:bg-sited-blue-hover text-white"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step: Q1 - Business Type */}
          {step === "q1" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-foreground">What type of business?</h3>
                <p className="text-sm text-muted-foreground mt-1">Helps us tailor the right approach.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleQ1("service")}
                  className="p-5 rounded-xl border-2 border-border hover:border-sited-blue text-center transition-colors"
                >
                  <span className="text-2xl block mb-2">🔧</span>
                  <span className="font-semibold text-sm text-foreground">Service Based</span>
                </button>
                <button
                  onClick={() => handleQ1("retail")}
                  className="p-5 rounded-xl border-2 border-border hover:border-sited-blue text-center transition-colors"
                >
                  <span className="text-2xl block mb-2">🏪</span>
                  <span className="font-semibold text-sm text-foreground">Retail Based</span>
                </button>
              </div>
            </div>
          )}

          {/* Step: Q2 */}
          {step === "q2" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-foreground">{q2Options.question}</h3>
              </div>
              <div className="space-y-2">
                {q2Options.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleQ2(opt)}
                    className="w-full p-4 rounded-xl border-2 border-border hover:border-sited-blue text-left transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-sm text-foreground">{opt}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Q3 */}
          {step === "q3" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-foreground">{q3Options.question}</h3>
              </div>
              <div className="space-y-2">
                {q3Options.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleQ3(opt)}
                    disabled={submitting}
                    className="w-full p-4 rounded-xl border-2 border-border hover:border-sited-blue text-left transition-colors flex items-center justify-between disabled:opacity-50"
                  >
                    <span className="font-medium text-sm text-foreground">{opt}</span>
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Submitted */}
          {step === "submitted" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-sited-blue/10 flex items-center justify-center mx-auto">
                <Check className="h-7 w-7 text-sited-blue" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">You're all set, {name.split(" ")[0]}!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  We'll review your details and get back to you within 24 hours with a clear next step.
                </p>
              </div>
              <Button variant="outline" onClick={() => handleClose(false)} className="mt-2">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
