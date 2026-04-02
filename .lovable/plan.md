

# Plan: Add Invoice to Deposit Checkout + Fix Duplicate Transactions

## Problem 1: No Invoice on Deposit Payments

The `send-deposit-link` Checkout Session (line 118) uses `mode: "payment"` without invoice creation. The webhook `checkout.session.completed` handler (line 711) inserts a transaction with **no `stripe_invoice_id`**. There's no Stripe Invoice in the client's profile.

## Problem 2: Duplicate Transactions

Both webhook events fire for the same payment:
- `checkout.session.completed` (line 678) — inserts a credit transaction
- `payment_intent.succeeded` (line 599) — checks `!paymentIntent.invoice` (line 603), which is true because no invoice exists, so it **also** processes the deposit and calls `autoCompleteDepositStep` again (saved by the idempotency guard, but the transaction insert at line 711 has no such guard)

## Fix

### 1. `send-deposit-link/index.ts` — Enable automatic invoice creation

Add `invoice_creation: { enabled: true }` to the Checkout Session config. This tells Stripe to generate an invoice for the one-time payment. The resulting invoice will carry the session metadata.

```typescript
// Add to stripe.checkout.sessions.create():
invoice_creation: {
  enabled: true,
  invoice_data: {
    metadata: {
      lead_id,
      type: "deposit",
    },
  },
},
```

### 2. `stripe-webhook/index.ts` — Remove `checkout.session.completed` transaction insert, let `invoice.paid` handle it

When `invoice_creation` is enabled, Stripe fires `invoice.paid` for the checkout payment. The existing `invoice.paid` handler (line 190) already:
- Records the credit transaction with `stripe_invoice_id`
- Saves payment method
- Updates transaction statuses

Changes:
- **`checkout.session.completed` handler (line 678)**: Remove the transaction insert (lines 711-722). Keep only the `autoCompleteDepositStep` call and payment method save — OR remove the entire handler body and let `invoice.paid` + `payment_intent.succeeded` handle everything.
- **`payment_intent.succeeded` handler (line 599)**: The check `!paymentIntent.invoice` (line 603) will now be **false** (because an invoice exists), so it will naturally skip — no duplicate. No change needed here.

The flow becomes:
1. Client pays via Checkout → Stripe creates Invoice automatically
2. `invoice.paid` fires → records transaction with `stripe_invoice_id`, saves card
3. `payment_intent.succeeded` fires → sees `paymentIntent.invoice` is set → skips (line 603)
4. `checkout.session.completed` fires → only triggers `autoCompleteDepositStep`

### Files modified

| File | Change |
|------|--------|
| `supabase/functions/send-deposit-link/index.ts` | Add `invoice_creation: { enabled: true, invoice_data: { metadata } }` to Checkout Session |
| `supabase/functions/stripe-webhook/index.ts` | Strip transaction insert from `checkout.session.completed`; keep only deposit step auto-complete + PM save as fallback |

