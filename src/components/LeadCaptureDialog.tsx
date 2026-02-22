import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  businessName: z.string().trim().min(1, "Business name is required").max(200),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(1, "Phone number is required").max(30),
});

interface LeadCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadCaptureDialog({ open, onOpenChange }: LeadCaptureDialogProps) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const resetForm = () => {
    setName("");
    setBusinessName("");
    setEmail("");
    setPhone("");
    setErrors({});
  };

  const handleContactSubmit = async () => {
    const result = contactSchema.safeParse({ name, businessName, email, phone });
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
          phone: result.data.phone || null,
          project_type: "website",
          form_data: { contactInfoOnly: true, source: "cta_popup", business_name: result.data.businessName },
        },
      });

      await supabase.functions.invoke("send-lead-notification", {
        body: { name: result.data.name, email: result.data.email, phone: result.data.phone || null, project_type: "website" },
      });
    } catch (err) {
      console.error("Error saving partial lead:", err);
    }
    setSubmitting(false);
    toast.success("Great! Let's learn more about your business.");
    sessionStorage.setItem("lead_captured", "true");
    sessionStorage.setItem("lead_name", result.data.name);
    sessionStorage.setItem("lead_business_name", result.data.businessName);
    sessionStorage.setItem("lead_email", result.data.email);
    sessionStorage.setItem("lead_phone", result.data.phone || "");
    onOpenChange(false);
    resetForm();
    navigate("/contact/offers");
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[80%] sm:w-full sm:max-w-md p-0 gap-0 overflow-hidden rounded-3xl">
        <DialogTitle className="sr-only">Instant Quote</DialogTitle>

        <div className="p-6 sm:p-8">
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-bold text-foreground uppercase tracking-wide">Instant Quote</h3>
              <p className="text-sm text-muted-foreground mt-1">Complete this short questionnaire, get an instant offer specific to you!</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="lc-name">Name *</Label>
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
                <Label htmlFor="lc-business">Business Name *</Label>
                <Input
                  id="lc-business"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                  className="mt-1"
                />
                {errors.businessName && <p className="text-xs text-destructive mt-1">{errors.businessName}</p>}
              </div>
              <div>
                <Label htmlFor="lc-email">Email *</Label>
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
                <Label htmlFor="lc-phone">Phone *</Label>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
