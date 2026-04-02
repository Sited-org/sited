

# Audit & Cleanup: Stripe Subscription Integrity

## Summary

The `create-membership-subscription` edge function **already creates a real Stripe customer and subscription** every time a membership is assigned. No code change is needed for that capability — it's been working correctly since the recent refactor.

However, there is a **data hygiene issue**: each of the 3 current clients has **two open recurring transaction records** — one referencing the old (now cancelled) subscription and one referencing the new active subscription. This inflates balances.

## Current State

| Client | Active Stripe Sub | Old DB Transaction (cancelled sub) | New DB Transaction (active sub) |
|--------|-------------------|-------------------------------------|----------------------------------|
| Dan Verwoert | sub_1THsyU…53jP (✅ active, May 1 anchor) | ecf35f44… → sub_1SpqgD… (cancelled) | f6016d1b… → sub_1THsyU…53jP |
| Ben Brown | sub_1THsyU…1CFN (✅ active, May 1 anchor) | 7afeefab… → sub_1TAJhM… (cancelled) | d47c50e3… → sub_1THsyU…1CFN |
| Jake Fennelly | sub_1THsyV…urQD (✅ active, May 1 anchor) | 8298f8ef… → sub_1TAJhR… (cancelled) | 47df9aca… → sub_1THsyV…urQD |

## Plan

### Step 1 — Close stale recurring transactions (DB migration)

Set `recurring_end_date = now()` on the 3 old transaction records whose Stripe subscriptions are cancelled. This stops the internal billing engine from double-counting them while preserving audit history.

Affected rows:
- `ecf35f44…` (Dan, old sub_1SpqgD…)
- `7afeefab…` (Ben, old sub_1TAJhM…)
- `8298f8ef…` (Jake, old sub_1TAJhR…)

### Step 2 — No code changes needed

The edge function `create-membership-subscription` already:
- Gets or creates a Stripe customer (`stripe.customers.create`)
- Saves `stripe_customer_id` to the lead record
- Creates a Stripe subscription with canonical pricing and 1st-of-month anchoring
- Falls back to `send_invoice` mode when no card is on file
- Records a transaction with the Stripe subscription ID

**This means every future subscription assignment from the admin UI will automatically create a proper Stripe customer and subscription.** No code changes required.

### Technical details

**Migration SQL:**
```sql
UPDATE transactions SET recurring_end_date = now()
WHERE id IN (
  'ecf35f44-6d23-4d3c-a706-71c4b943ad65',
  '7afeefab-1ed0-4976-b717-e2b8f151d041',
  '8298f8ef-84d6-4118-9994-71125d8213db'
);
```

**Files modified:** None — only a database migration to clean up stale records.

