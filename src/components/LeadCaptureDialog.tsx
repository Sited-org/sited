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

type Step = "contact" | "submitted";

interface LeadCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadCaptureDialog({ open, onOpenChange }: LeadCaptureDialogProps) {
  const [step, setStep] = useState<Step>("contact");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const resetForm = () => {
    setStep("contact");
    setName("");
    setEmail("");
    setPhone("");
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

      await supabase.functions.invoke("send-lead-notification", {
        body: { name: result.data.name, email: result.data.email, phone: result.data.phone, project_type: "website" },
      });
    } catch (err) {
      console.error("Error saving partial lead:", err);
    }
    setSubmitting(false);
    setStep("submitted");
    toast.success("Thanks! We'll be in touch shortly.");
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Get Started</DialogTitle>

        <div className="p-6 sm:p-8">
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
                Submit <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

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
