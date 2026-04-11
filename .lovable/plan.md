

## Plan: Mid-Month Subscription Billing Option

### What already works
- **Credit check**: The `stripe-webhook` intercepts every subscription `invoice.created` event while it's still a draft. It calls `getAvailableCredit()` and either voids the invoice (full credit), adds a negative line item (partial credit), or lets it charge normally. This works for both auto-charge and invoice modes. No changes needed here.

### What needs to change
When creating a subscription mid-month (2nd–30th), the admin currently has no choice — billing always pushes to the 1st of the next month. You want the option to bill for the current month immediately.

### UI Change — Admin PaymentsTab
Add a toggle/radio below the billing start month selector:

```text
┌─────────────────────────────────┐
│ Billing Start Month: [2026-04]  │
│                                 │
│ ○ Bill for current month now    │
│ ○ Start billing next month      │
│   (default)                     │
└─────────────────────────────────┘
```

- Only visible when the selected month is the current month (or no month selected and it's mid-month)
- "Bill for current month now" sends `charge_current_month: true` to the edge function
- Default remains "Start billing next month"

### Backend Change — `create-membership-subscription`
When `charge_current_month` is true:

1. Set `billing_cycle_anchor` to the 1st of the **current** month (in the past) — Stripe allows past anchors
2. Actually Stripe does NOT allow past `billing_cycle_anchor` — so instead:
   - Set `billing_cycle_anchor` to the 1st of **next month** (normal behavior for future cycles)
   - Add `backdate_start_date` to the 1st of current month, OR
   - Use `add_invoice_items` to create an immediate one-time charge for the current period
   
   **Best approach**: Create the subscription anchored to the 1st of next month as normal, then immediately create a separate one-time invoice item for the current month's pro-rata (full month price since you want to bill the full month regardless of start date). This keeps the subscription cycle clean.

3. Flow when `charge_current_month: true`:
   - Create subscription anchored to 1st of next month (standard)
   - Create a one-time invoice for the current month's full membership price
   - If card on file: charge immediately via `stripe.invoices.pay()`
   - If no card: send the invoice with 7-day due date
   - Record the current-month charge as a separate transaction in the ledger

### Files Modified
- `src/components/admin/lead-profile/PaymentsTab.tsx` — Add radio toggle for current month billing
- `supabase/functions/create-membership-subscription/index.ts` — Handle `charge_current_month` flag, create immediate invoice for current period

### Technical Details
- The credit-first system will still work for the immediate charge since `invoice.created` webhook fires for one-time invoices too (when created via `stripe.invoices.create()`)
- The subscription's recurring cycle remains cleanly anchored to the 1st of each month
- The current-month charge is a standalone invoice, not part of the subscription billing cycle

