

# Add Missing Webhooks & Fix Billing Anchor Logic

## 1. Add `invoice.voided` and `invoice.marked_uncollectible` webhook handlers

**File:** `supabase/functions/stripe-webhook/index.ts`

Add two new cases before the `default` case (before line 541):

- **`invoice.voided`** — Find matching transaction by `stripe_invoice_id`, set `invoice_status: 'voided'`, `status: 'voided'`
- **`invoice.marked_uncollectible`** — Find matching transaction by `stripe_invoice_id`, set `invoice_status: 'uncollectible'`

Both are simple lookups on `transactions.stripe_invoice_id` and status updates.

## 2. Fix billing anchor logic — full charge on start date, then 1st of following month

**File:** `supabase/functions/create-membership-subscription/index.ts` (lines 199-274)

Replace the entire anchor/subscription creation block with this logic:

**If start_date is on the 1st of a month (or no start_date):**
- Anchor = that 1st (or 1st of next month if no start_date)
- Create subscription with `proration_behavior: 'none'` — single standard flow, first charge on anchor date

**If start_date is mid-month (not the 1st):**
1. Create a **one-off invoice** for the full membership amount, dated on the start_date — this is the immediate mid-month charge
2. Create the **subscription** anchored to the 1st of the following month with `proration_behavior: 'none'` — recurring charges start from the 1st onward
3. Record **two** transaction rows: one for the immediate charge, one for the recurring definition

The one-off invoice uses `stripe.invoiceItems.create()` + `stripe.invoices.create()` + `stripe.invoices.finalizeInvoice()` against the customer. If a saved payment method exists, it auto-charges; otherwise it sends the invoice with 7-day terms.

This ensures: March 15 start → full charge March 15 + full charge April 1 + monthly on the 1st thereafter. No proration, no missed months.

## Summary

| Change | File | Lines |
|--------|------|-------|
| Add `invoice.voided` handler | `stripe-webhook/index.ts` | Before line 541 |
| Add `invoice.marked_uncollectible` handler | `stripe-webhook/index.ts` | Before line 541 |
| Replace anchor logic with mid-month one-off + 1st-of-month subscription | `create-membership-subscription/index.ts` | Lines 199-274 |

