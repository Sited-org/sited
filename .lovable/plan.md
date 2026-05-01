
## Findings

### Dan (Hunter Insight Property)
- Has **$60 credit** on file. Was charged $60 on May 1 without credit being applied (because `invoice.created` webhook wasn't enabled at that time).
- **No refund** — credit stays on file and will be applied automatically next billing cycle (June 1) now that `invoice.created` is enabled.
- The `invoice.created` webhook handler already has the correct credit logic. Just needs verification logging.

### WETR
- **Orphaned open invoice** `in_1TAJhRKEOhx2BLuXaw1iLpMn` ($120) from a canceled subscription (`sub_1TAJhRKEOhx2BLuX3BTj4nMD`). This invoice was created when the sub was set up, the sub was later canceled, but the invoice was never voided. **This is the "April 3" charge.**
- The May 1 invoice `in_1TS5f9KEOhx2BLuXKikP8gQ9` ($120) is **legitimate** — from the active subscription.
- There is **no "May 3 scheduled"** for WETR. What you may be seeing is Ingle & Brown's upcoming charge (their sub bills on the 2nd UTC = 3rd AEST).

### Ingle & Brown
- Subscription `sub_1THsyUKEOhx2BLuX1CFNpgbV` is anchored to **April 2** (not the 1st) because `sync-memberships-to-stripe` doesn't set `billing_cycle_anchor`.
- Draft invoice `in_1TS6gdKEOhx2BLuXc7MP7Ae6` is queued for May 2 (appears as May 3 AEST). **Needs anchor fixed to 1st.**

### Comms Tab
- Currently shows: email logs + admin-initiated client requests.
- **Does NOT show**: invoices sent via Stripe (neither manual `send-invoice` nor subscription invoices).

---

## Plan

### Step 1: Void WETR's orphaned invoice
- Void Stripe invoice `in_1TAJhRKEOhx2BLuXaw1iLpMn` via Stripe API (it's from a canceled subscription and should never be collected).

### Step 2: Fix Ingle & Brown billing anchor
- The current sub's billing cycle just ended (period was Apr 2 – May 1). A new draft invoice `in_1TS6gdKEOhx2BLuXc7MP7Ae6` exists for the next period starting May 2.
- **Delete the draft invoice**, cancel the current subscription, and recreate it with `billing_cycle_anchor` set to June 1 (1st of next month). This permanently fixes the billing date.
- Stripe doesn't allow updating `billing_cycle_anchor` on existing subscriptions, so cancel+recreate is the only option.

### Step 3: Fix `sync-memberships-to-stripe` code
- Add `billing_cycle_anchor` set to the 1st of the next month when creating subscriptions, matching the logic already in `create-membership-subscription`. Prevents future subscriptions from anchoring to creation date.

### Step 4: Add logging to `invoice.created` webhook
- Add prominent entry logging to confirm credit is being checked and applied on each subscription invoice. This lets you verify Dan's credit is applied on June 1 without guessing.

### Step 5: Show invoices in Comms tab
- Add an "Invoices" section to `CommunicationsTab.tsx` that queries the `transactions` table for rows with a `stripe_invoice_id` for this lead.
- Display: invoice date, item description, amount, status (paid/open/void), and a link to the Stripe-hosted invoice URL (stored in transaction notes or fetched from metadata).
- This covers both manual `send-invoice` invoices and subscription-generated invoices.

---

### Manual Actions Required (You)
- **Step 1** (WETR void): I will void this via Stripe API during implementation.
- **Step 2** (Ingle & Brown): I will cancel and recreate the subscription via Stripe API during implementation.
- No manual Stripe Dashboard actions needed from you.
