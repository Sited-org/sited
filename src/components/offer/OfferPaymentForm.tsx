import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2, Lock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OfferPaymentFormProps {
  tier: string;
  tierName: string;
  onSuccess: (info: { name: string; email: string; phone: string }) => void;
  onCancel: () => void;
}

const OfferPaymentForm = ({ tier, tierName, onSuccess, onCancel }: OfferPaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in your name and email.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setProcessing(true);

    try {
      // 1. Create PaymentIntent
      const { data: intentData, error: intentError } = await supabase.functions.invoke(
        "create-offer-payment-intent",
        { body: { tier, name: name.trim(), email: email.trim(), phone: phone.trim() || null } }
      );

      if (intentError || !intentData?.clientSecret) {
        throw new Error(intentError?.message || intentData?.error || "Failed to create payment");
      }

      // 2. Confirm payment with card details
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim() || undefined,
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent?.status === "succeeded") {
        // 3. Confirm on backend — create/update lead as sold
        const { error: confirmBackendError } = await supabase.functions.invoke(
          "confirm-offer-payment",
          {
            body: {
              paymentIntentId: paymentIntent.id,
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim() || null,
              tier,
            },
          }
        );

        if (confirmBackendError) {
          console.error("Backend confirmation error (payment still succeeded):", confirmBackendError);
        }

        toast.success("Payment received! Welcome aboard.");
        onSuccess({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      } else {
        throw new Error("Payment was not completed. Please try again.");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Lock size={14} className="text-sited-blue" />
          Secure Payment — {tierName}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="offer-name" className="text-xs">Full Name *</Label>
          <Input
            id="offer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            required
            disabled={processing}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="offer-email" className="text-xs">Email *</Label>
          <Input
            id="offer-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@business.com"
            required
            disabled={processing}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="offer-phone" className="text-xs">Phone (optional)</Label>
        <Input
          id="offer-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0412 345 678"
          disabled={processing}
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Card Details *</Label>
        <div className="rounded-md border border-input bg-background px-3 py-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "hsl(var(--foreground))",
                  "::placeholder": { color: "hsl(var(--muted-foreground))" },
                },
                invalid: { color: "hsl(var(--destructive))" },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-sited-blue hover:bg-sited-blue-hover text-white font-black text-sm uppercase tracking-wider transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock size={14} />
            Secure My Website — Pay $49
          </>
        )}
      </button>

      <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
        <p className="text-sm font-bold text-foreground">
          🛡️ 100% Money-Back Guarantee
        </p>
        <p className="text-[12px] text-muted-foreground mt-1">
          Not happy? Your $49 deposit is <span className="font-bold text-foreground">fully refunded</span> — no questions asked.
        </p>
      </div>

      <p className="text-[11px] text-center text-muted-foreground mt-3">
        Secure checkout powered by Stripe.
      </p>
    </form>
  );
};

export default OfferPaymentForm;
