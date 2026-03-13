

## Plan: Fix March Billing for 4 Accounts + Prevent Future Misses

### Summary of Findings

**Dan (Daniel Verwoert)**: Already billed correctly for March via his Stripe subscription. $60 charged and paid on March 1. No action needed.

**3 accounts missed March billing** (the `process-recurring-invoices` function either ran with the old code or failed silently):

| Client | Amount | Stripe Customer | Payment Method | Action |
|--------|--------|----------------|----------------|--------|
| Ben Brown | $60 | Yes (`cus_Tqbt9...`) | Yes (`pm_1Sw9m...`) | Create invoice, auto-charge |
| Belinda Dean | $60 | Yes (`cus_TjDJT...`) | No | Create invoice, email (7-day due) |
| Jake Fennelly | $120 | No | No | Create Stripe customer, then create + email invoice |

All three have $0 available credit — all need Stripe invoices.

### Part 1: Fix the 3 Missed March Accounts (Using Stripe tools, no code changes)

**Step 1 — Jake Fennelly**: Create a Stripe customer for `jake@wetrpressurecleaning.com` (business: WETR), then update the `leads` table with the new `stripe_customer_id`.

**Step 2 — Create Stripe invoices for all 3**:
- **Ben Brown**: Invoice for $60 AUD, `collection_method: charge_automatically`, `default_payment_method: pm_1Sw9mzKEOhx2BLuXpZNtGjXX`. Item: "Website Maintenance (50% Off)".
- **Belinda Dean**: Invoice for $60 AUD, `collection_method: send_invoice`, `days_until_due: 7`. Item: "Website Maintenance (50% Off)".
- **Jake Fennelly**: Invoice for $120 AUD, `collection_method: send_invoice`, `days_until_due: 7`. Item: "Blue".

**Step 3 — Finalize all 3 invoices** (triggers auto-charge for Ben, sends email for Belinda and Jake).

**Step 4 — Insert matching debit transactions** in the `transactions` table for each, with the `stripe_invoice_id` linked, `invoice_status` set to `processing` (Ben) or `sent` (Belinda, Jake).

### Part 2: Prevent This Next Month (Code change)

The current `shouldBill` logic for monthly intervals only fires when `today.getDate() === sameDay`. If the cron job misses that exact day (or the function errors/times out), the charge is lost forever.

**Fix in `process-recurring-invoices/index.ts`**: Change the monthly billing check from exact-day matching to a "has at least 1 month elapsed since the definition date AND no billing exists this month" check. The "no billing this month" guard already exists — so we just need to loosen the date trigger:

```typescript
// BEFORE (only fires on exact day match)
case 'monthly':
  const sameDay = txDate.getDate();
  shouldBill = today.getDate() === sameDay || (today.getDate() === 1 && monthsElapsed >= 1);
  break;

// AFTER (fires any day in the month, relies on existing duplicate guard)
case 'monthly':
  shouldBill = monthsElapsed >= 1;
  break;
```

Same fix for `default` case and `yearly` (check month elapsed, not exact day). The existing `existingBilling` check on lines 361-369 already prevents double-billing within the same month, so this is safe.

### Files to Modify
1. `supabase/functions/process-recurring-invoices/index.ts` — Loosen `shouldBill` date logic for monthly/yearly/default intervals

### Stripe Tool Calls (no code)
1. `create_customer` — Jake Fennelly
2. `create_invoice` × 3
3. `create_invoice_item` × 3
4. `finalize_invoice` × 3
5. Database inserts for 3 debit transactions + 1 leads update (Jake's `stripe_customer_id`)

