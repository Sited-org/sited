

# Plan: Standardize All Subscriptions to 1st-of-Month Billing

## Current State

| Client | Subscription | Amount | Status | Card on File | Anchor | Paid for April? |
|--------|-------------|--------|--------|-------------|--------|-----------------|
| Dan Verwoert | sub_1SpqgD… | $60/mo | Active | Yes | ~29th | Yes (paid) |
| Ben Brown | sub_1TAJhM… | $60/mo | Active | Yes | ~10th (ad-hoc price) | Yes (paid at creation) |
| Jake Fennelly | sub_1TAJhR… | $120/mo | Past Due | No | ~10th (ad-hoc price) | No — open invoice unpaid |

## Stripe Actions (Manual via tools)

### 1. Dan Verwoert — Already paid, realign only
- Cancel current subscription at period end (don't refund)
- Create new subscription using canonical price `price_1SpqgCKEOhx2BLuXsg4dudMG` ($60 Maintenance), anchored to May 1st, no proration
- Has card on file — auto-charge going forward

### 2. Ben Brown — Already paid, realign only
- Cancel current subscription immediately (uses ad-hoc price, not canonical)
- Void the open manual invoice (`in_1TAJXPKEOhx2BLuX8cT9ZM40`, $60 outstanding)
- Create new subscription using canonical price `price_1SpqgCKEOhx2BLuXsg4dudMG` ($60 Maintenance), anchored to May 1st, no proration
- Has card on file — auto-charge going forward
- No April bill needed (already paid at subscription creation)

### 3. Jake Fennelly — Unpaid, needs April invoice
- Cancel current past_due subscription
- The existing open invoice (`in_1TAJhRKEOhx2BLuXaw1iLpMn`, $120) serves as April's bill — leave it open
- Create new subscription using canonical price `price_1TGqUjKEOhx2BLuXq1GvYlEF` ($120 Blue), anchored to May 1st, `collection_method: send_invoice`, `days_until_due: 7`
- No card on file — invoices sent each month

## Code Change: Simplify `create-membership-subscription`

Remove all mid-month proration logic. The function should:
- Always set `billing_cycle_anchor` to the 1st of the next month
- Never create one-off "initial charge" invoices
- No proration (`proration_behavior: 'none'`)
- If no card on file: `collection_method: 'send_invoice'`, `days_until_due: 7`
- If card on file: `default_payment_method` set, `payment_behavior: 'error_if_incomplete'`

### Files modified
- `supabase/functions/create-membership-subscription/index.ts` — Remove lines 174-230 (mid-month anchor logic + one-off invoice) and replace with simple "anchor to 1st of next month"

