

## Plan: Fix Billing Logic — Credit-Only, Invoice-Only, and Subscription Sync

### Problem Summary
The `process-recurring-invoices` function currently creates a Stripe invoice for **every** recurring charge, even when the client has enough credit to cover it entirely. This means:
- Clients with credit still get Stripe invoices (wrong — credit should be silently deducted)
- The credit is applied as a negative line item on Stripe, adding unnecessary complexity
- Clients without payment details should receive a payable Stripe invoice (this part works but needs hardening)

### Changes Required

#### 1. `process-recurring-invoices/index.ts` — Credit-first logic (major rewrite of billing loop)

**Current behavior**: Always creates a Stripe invoice, applies credit as a negative line item.

**New behavior**:
- **If credit >= total amount**: Skip Stripe entirely. Deduct credit internally by inserting a "Credit Applied" debit transaction and marking the billing cycle as `paid`. No Stripe invoice created.
- **If credit < total amount but > 0**: Create Stripe invoice for the **net amount only** (no negative line items). Record credit deduction separately.
- **If no credit and no payment method**: Create Stripe invoice with `collection_method: 'send_invoice'` and `days_until_due: 7`. The existing webhook (`invoice.paid`) already captures payment details and saves them to the lead profile.
- **If no credit but has payment method**: Create Stripe invoice with `collection_method: 'charge_automatically'` using the saved payment method.
- **Ensure Stripe customer exists**: For every lead being billed, create a Stripe customer if one doesn't exist yet (already in the code, just confirming it stays).

#### 2. `stripe-webhook/index.ts` — Minor adjustments to `invoice.created` handler

The `invoice.created` handler currently applies credit to subscription draft invoices. This needs the same logic: if credit fully covers, void/delete the draft invoice on Stripe and handle internally. For partial credit, only add the net items.

#### 3. `cancel-subscription/index.ts` — Already works correctly
The function already cancels the Stripe subscription and updates local records. No changes needed, but will verify the `customer.subscription.deleted` webhook handler also properly cleans up.

#### 4. No UI changes needed
The `ActiveSubscriptions` component and `PaymentsTab` already display the correct states. The changes are purely backend logic.

### Technical Details

**`process-recurring-invoices` billing loop rewrite:**
```
For each lead with due memberships:
  1. Ensure Stripe customer exists (create if not)
  2. Calculate totalAmount and availableCredit
  3. IF credit >= totalAmount:
     - Insert "Credit Applied" debit transaction (invoice_status: 'paid')
     - Insert billing cycle debit transaction (invoice_status: 'paid')  
     - Do NOT create any Stripe invoice
     - Log as "fully covered by credit"
  4. ELSE:
     - netAmount = totalAmount - creditToApply
     - Create Stripe invoice for netAmount ONLY
     - Add invoice items for net amount
     - IF lead has payment method → charge_automatically
     - ELSE → send_invoice with 7-day due date
     - Record credit deduction if any
     - Record billing cycle debit transaction
```

**Webhook `invoice.created` (subscription drafts):**
Same credit-first logic — if credit fully covers a subscription renewal draft invoice, void it on Stripe and handle internally.

### Files to Modify
1. `supabase/functions/process-recurring-invoices/index.ts` — Main billing logic rewrite
2. `supabase/functions/stripe-webhook/index.ts` — Update `invoice.created` handler for subscription drafts

