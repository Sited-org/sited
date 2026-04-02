

# Deposit Collection: Critical Bug Found

## The Problem

The `send-deposit-link` function creates a **Stripe Checkout Session** (line 118). When a client pays through a Checkout Session, Stripe fires a `checkout.session.completed` event — **not** a direct `payment_intent.succeeded` event.

The webhook (`stripe-webhook/index.ts`) has **no handler for `checkout.session.completed`**. It falls through to the `default` case at line 699, which just logs "Unhandled event type" and does nothing.

This means when a client pays via the emailed deposit link:

1. **No transaction is recorded** in the database
2. **No card is saved** to the lead record
3. **The deposit build step is not auto-completed**
4. The payment succeeds in Stripe but the system is completely unaware of it

### Why the `payment_intent.succeeded` handler doesn't fire

When a PaymentIntent is created *through* a Checkout Session, Stripe may fire `payment_intent.succeeded` as well — but critically, at line 528 the handler checks `if (!paymentIntent.invoice)`. Since Checkout Sessions can attach invoice-like behavior, the flow is unreliable. More importantly, the `payment_intent.succeeded` event from a Checkout Session may not always fire depending on the payment method and Stripe's event ordering.

### The `admin-charge-deposit` path works differently

The "Pay Now" button in the admin UI uses `admin-charge-deposit`, which creates a **direct PaymentIntent** (not a Checkout Session). This PaymentIntent fires `payment_intent.succeeded` directly, which *does* hit the handler at line 522. So the admin card-entry path works; the emailed link path does not.

## The Fix

Add a `checkout.session.completed` handler to the webhook that:

1. Retrieves the session's `payment_intent` from Stripe
2. Reads `lead_id` and `type` from the session metadata (already set at lines 138-141 of `send-deposit-link`)
3. Creates a credit transaction in the database
4. Saves the payment method to the lead
5. If `type === 'deposit'`, auto-completes the `deposit_received` build step (reusing the same logic currently at lines 577-651)

### Files to modify

| File | Change |
|------|--------|
| `supabase/functions/stripe-webhook/index.ts` | Add `checkout.session.completed` case before the `default` case. Extract the deposit auto-complete logic into a shared helper to avoid duplication. |

### No other files need changes

The `send-deposit-link` function already sets the correct metadata on both the session and the `payment_intent_data`. The webhook just needs to read it.

