

# Payment Flow Audit - Issues Found

## Critical Bug: `isFutureStart` is undefined

**File:** `supabase/functions/create-membership-subscription/index.ts` (line 271)

The variable `isFutureStart` is referenced but **never declared** anywhere in the function. This means:
- It evaluates as `undefined` (falsy), so `invoice_status` always gets set to `'processing'`
- This is a **runtime bug** that silently produces incorrect data rather than crashing, making it hard to detect
- For future-dated subscriptions, the invoice_status should be `'not_sent'` but will incorrectly be `'processing'`

**Fix:** Add the variable declaration before the transaction insert:
```typescript
const isFutureStart = start_date && new Date(start_date) > new Date();
```

## Issue 2: Cancel-subscription updates ALL recurring transactions for a lead

**File:** `supabase/functions/cancel-subscription/index.ts` (lines 89-94)

The cancellation query filters by `lead_id + is_recurring=true + recurring_end_date IS NULL` but does **not** filter by the specific Stripe subscription ID. If a client has multiple active memberships, cancelling one will cancel **all** of them locally.

**Fix:** Add a filter matching the subscription ID in the transaction notes:
```typescript
.ilike('notes', `%Stripe Subscription: ${subscription_id}%`)
```

## Issue 3: CORS headers missing required Supabase client headers

**Files:** `create-membership-subscription/index.ts`, `cancel-subscription/index.ts`, `send-invoice/index.ts`

These functions use a minimal CORS `Access-Control-Allow-Headers` that omits the headers the Supabase JS client sends (`x-supabase-client-platform`, etc.). This can cause CORS preflight failures in some browsers.

**Fix:** Update all three to use the full CORS headers:
```
authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

## Issue 4: `cancelRecurring` in `useTransactions.ts` — regex only matches first subscription

**File:** `src/hooks/useTransactions.ts`

The regex `transaction?.notes?.match(/Stripe Subscription:\s*(sub_\w+)/)` works correctly for single subscriptions, but if a note contains multiple subscription IDs (unlikely but possible from appended notes), only the first is matched. This is minor but worth noting.

No change needed here — current logic is adequate.

## Issue 5: Webhook `customer.subscription.deleted` doesn't set `is_recurring = false`

**File:** `supabase/functions/stripe-webhook/index.ts` (lines 478-487)

When Stripe fires `customer.subscription.deleted`, the webhook only sets `recurring_end_date` but does NOT set `is_recurring = false`. This means the transaction row still appears as a "recurring definition" in the UI and may confuse the billing engine.

**Fix:** Add `is_recurring: false` to the update.

## Summary of Changes

| # | File | Issue | Severity |
|---|------|-------|----------|
| 1 | `create-membership-subscription/index.ts` | `isFutureStart` undefined | **Critical** |
| 2 | `cancel-subscription/index.ts` | Cancels all memberships instead of targeted one | **High** |
| 3 | Three edge functions | Incomplete CORS headers | **Medium** |
| 4 | `stripe-webhook/index.ts` | Subscription deleted doesn't set `is_recurring=false` | **Medium** |

