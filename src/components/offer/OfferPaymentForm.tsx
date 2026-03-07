import { useState, useEffect } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { PaymentRequest } from "@stripe/stripe-js";
import { Loader2, Lock, X, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OfferPaymentFormProps {
  tier: string;
  tierName: string;
  onSuccess: (info: { name: string; email: string; phone: string }) => void;
  onCancel: () => void;
  prefillName?: string;
  prefillEmail?: string;
  prefillPhone?: string;
}

const elementStyle = {
  base: {
    fontSize: "16px",
    color: "#141414",
    fontFamily: "system-ui, -apple-system, sans-serif",
    "::placeholder": { color: "#737373" },
  },
  invalid: { color: "#ef4444" },
};

const OfferPaymentForm = ({ tier, tierName, onSuccess, onCancel, prefillName, prefillEmail, prefillPhone }: OfferPaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardName, setCardName] = useState(prefillName || "");
  const [name, setName] = useState(prefillName || "");
  const [email, setEmail] = useState(prefillEmail || "");
  const [phone, setPhone] = useState(prefillPhone || "");
  const [processing, setProcessing] = useState(false);
  const hasPrefill = !!(prefillName && prefillEmail);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canApplePay, setCanApplePay] = useState(false);

  // Setup Apple Pay / Google Pay payment request
  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: "AU",
      currency: "aud",
      total: { label: "Website Deposit", amount: 4900 },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setCanApplePay(true);
      }
    });

    pr.on("paymentmethod", async (ev) => {
      try {
        const payerName = ev.payerName || prefillName || "";
        const payerEmail = ev.payerEmail || prefillEmail || "";

        const { data: intentData, error: intentError } = await supabase.functions.invoke(
          "create-offer-payment-intent",
          { body: { tier, name: payerName, email: payerEmail, phone: prefillPhone || null } }
        );

        if (intentError || !intentData?.clientSecret) {
          ev.complete("fail");
          return;
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          intentData.clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          ev.complete("fail");
          return;
        }

        ev.complete("success");

        if (paymentIntent?.status === "succeeded") {
          await supabase.functions.invoke("confirm-offer-payment", {
            body: { paymentIntentId: paymentIntent.id, name: payerName, email: payerEmail, phone: prefillPhone || null, tier },
          });
          toast.success("Payment received! Welcome aboard.");
          onSuccess({ name: payerName, email: payerEmail, phone: prefillPhone || "" });
        }
      } catch {
        ev.complete("fail");
      }
    });
  }, [stripe, tier, prefillName, prefillEmail, prefillPhone, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const finalName = hasPrefill ? name : name;
    const finalEmail = hasPrefill ? email : email;

    if (!finalName.trim() || !finalEmail.trim()) {
      toast.error("Please fill in your name and email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(finalEmail.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!cardName.trim()) {
      toast.error("Please enter the name on your card.");
      return;
    }

    setProcessing(true);

    try {
      const { data: intentData, error: intentError } = await supabase.functions.invoke(
        "create-offer-payment-intent",
        { body: { tier, name: finalName.trim(), email: finalEmail.trim(), phone: phone.trim() || null } }
      );

      if (intentError || !intentData?.clientSecret) {
        throw new Error(intentError?.message || intentData?.error || "Failed to create payment");
      }

      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) throw new Error("Card element not found");

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              name: cardName.trim(),
              email: finalEmail.trim(),
              phone: phone.trim() || undefined,
            },
          },
        }
      );

      if (confirmError) throw new Error(confirmError.message);

      if (paymentIntent?.status === "succeeded") {
        const { error: confirmBackendError } = await supabase.functions.invoke(
          "confirm-offer-payment",
          { body: { paymentIntentId: paymentIntent.id, name: finalName.trim(), email: finalEmail.trim(), phone: phone.trim() || null, tier } }
        );
        if (confirmBackendError) console.error("Backend confirmation error:", confirmBackendError);

        toast.success("Payment received! Welcome aboard.");
        onSuccess({ name: finalName.trim(), email: finalEmail.trim(), phone: phone.trim() });
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
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "#141414" }}>
          <Lock size={14} style={{ color: "hsl(202, 74%, 69%)" }} />
          Secure Payment
        </div>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-700 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Apple Pay / Google Pay */}
      {canApplePay && paymentRequest && (
        <div className="space-y-3">
          <PaymentRequestButtonElement
            options={{ paymentRequest, style: { paymentRequestButton: { type: "default", theme: "dark", height: "48px" } } }}
          />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or pay with card</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>
      )}

      {/* Contact fields (only if not prefilled) */}
      {!hasPrefill && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="offer-name" className="text-xs" style={{ color: "#141414" }}>Full Name *</Label>
              <Input id="offer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" required disabled={processing} className="h-11 bg-white border-gray-200 text-gray-900" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-email" className="text-xs" style={{ color: "#141414" }}>Email *</Label>
              <Input id="offer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@business.com" required disabled={processing} className="h-11 bg-white border-gray-200 text-gray-900" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="offer-phone" className="text-xs" style={{ color: "#141414" }}>Phone (optional)</Label>
            <Input id="offer-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0412 345 678" disabled={processing} className="h-11 bg-white border-gray-200 text-gray-900" />
          </div>
        </>
      )}

      {/* Card fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="card-name" className="text-xs" style={{ color: "#141414" }}>Name on Card *</Label>
          <Input
            id="card-name"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="John Smith"
            required
            disabled={processing}
            className="h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs" style={{ color: "#141414" }}>Card Number *</Label>
          <div className="rounded-md border border-gray-200 bg-white px-3 py-3 flex items-center gap-2">
            <CreditCard size={16} className="text-gray-400 shrink-0" />
            <div className="flex-1">
              <CardNumberElement options={{ style: elementStyle, placeholder: "1234 5678 9012 3456" }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ color: "#141414" }}>Expiry *</Label>
            <div className="rounded-md border border-gray-200 bg-white px-3 py-3">
              <CardExpiryElement options={{ style: elementStyle }} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ color: "#141414" }}>CVV *</Label>
            <div className="rounded-md border border-gray-200 bg-white px-3 py-3">
              <CardCvcElement options={{ style: elementStyle }} />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-white"
        style={{ backgroundColor: "hsl(202, 74%, 69%)" }}
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

      <p className="text-[11px] text-center text-gray-400 mt-2">
        🔒 Secure checkout powered by Stripe. Your card details never touch our servers.
      </p>
    </form>
  );
};

export default OfferPaymentForm;
