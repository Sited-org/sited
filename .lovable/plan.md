

# Test Plan: Membership Invoicing System

## Overview

This plan creates two test leads with specific configurations to verify the recurring invoicing system works correctly for:
1. **Scenario A**: Clients with active memberships but NO saved payment method receive invoices via email
2. **Scenario B**: Clients with available account credit have that credit applied before an invoice is generated

---

## Test Scenarios

### Test Lead 1: Invoice Without Payment Details
**Purpose**: Verify invoices are sent to clients regardless of saved payment method status

| Field | Value |
|-------|-------|
| Name | Test Client - No Payment |
| Email | test-invoice-nopayment@sited.com.au |
| Business | Test Business Alpha |
| Status | sold |
| Stripe Customer ID | NULL (no payment method) |
| Membership | Website Maintenance (50% Off) - $60/month |

**Expected Result**: 
- Invoice created and emailed via Stripe
- `collection_method: 'send_invoice'` used (not auto-charge)
- Client receives payment link in email

---

### Test Lead 2: Credit Applied Before Invoice
**Purpose**: Verify account credit is deducted from invoice total

| Field | Value |
|-------|-------|
| Name | Test Client - With Credit |
| Email | test-invoice-credit@sited.com.au |
| Business | Test Business Beta |
| Status | sold |
| Stripe Customer ID | NULL |
| Membership | Website Maintenance (50% Off) - $60/month |
| Account Credit | $25.00 |

**Expected Result**:
- Invoice shows: Subtotal $60, Credit Applied -$25, Net Total $35
- Negative line item "Account credit applied" appears on Stripe invoice
- Credit consumption logged as transaction

---

## Implementation Steps

### Step 1: Create Test Leads
Insert two new lead records:
- `test-invoice-nopayment@sited.com.au` (no special setup)
- `test-invoice-credit@sited.com.au` (will receive credit)

### Step 2: Add Recurring Membership Transactions
For each test lead, create a recurring transaction:
- Item: "Website Maintenance (50% Off)"
- Debit: $60
- `is_recurring: true`
- `recurring_interval: 'daily'` (forces immediate billing for testing)
- `recurring_end_date: null` (active membership)

### Step 3: Add Credit Balance (Test Lead 2 only)
Insert a credit transaction for the second test lead:
- Item: "Test Credit Balance"
- Credit: $25
- Debit: $0
- `is_recurring: false`
- `invoice_status: 'paid'` (ensures credit is available)

### Step 4: Trigger the Invoicing Function
Call the `process-recurring-invoices` edge function with each test lead's ID to generate invoices immediately.

### Step 5: Verify Results
Check:
1. Stripe invoices created via API
2. Edge function logs show correct credit calculation
3. Transaction records updated with invoice IDs
4. Email delivery confirmed in Stripe dashboard

---

## Technical Details

### Database Queries Required

```text
-- Test Lead 1: No Payment Method
INSERT INTO leads (name, email, business_name, project_type, status)
VALUES ('Test Client - No Payment', 'test-invoice-nopayment@sited.com.au', 
        'Test Business Alpha', 'website', 'sold');

-- Test Lead 2: With Credit
INSERT INTO leads (name, email, business_name, project_type, status)
VALUES ('Test Client - With Credit', 'test-invoice-credit@sited.com.au', 
        'Test Business Beta', 'website', 'sold');

-- Recurring membership transaction (for each lead)
INSERT INTO transactions (lead_id, item, debit, is_recurring, 
                         recurring_interval, transaction_date)
VALUES ('<lead_id>', 'Website Maintenance (50% Off)', 60, true, 
        'daily', NOW());

-- Credit balance for Test Lead 2
INSERT INTO transactions (lead_id, item, credit, debit, is_recurring, 
                         invoice_status, transaction_date)
VALUES ('<lead_id>', 'Test Credit Balance', 25, 0, false, 
        'paid', NOW());
```

### Edge Function Verification

The `process-recurring-invoices` function will:
1. Find leads with `is_recurring = true` and `recurring_end_date IS NULL`
2. Calculate available credit using the `getAvailableCredit()` helper
3. Create Stripe invoice with `collection_method: 'send_invoice'`
4. Apply credit as negative line item if available
5. Finalize and send invoice via email

---

## Cleanup After Testing

After verification, the test leads and their transactions should be deleted:
- Delete transactions where `lead_id` matches test leads
- Delete leads with test email addresses

---

## Success Criteria

| Test | Pass Condition |
|------|----------------|
| Invoice Sent (No Payment) | Stripe invoice created, email sent, no auto-charge attempted |
| Credit Applied | Invoice shows credit deduction, net amount is $35 instead of $60 |
| Transaction Logging | New transaction records created with `stripe_invoice_id` populated |
| Email Delivery | Invoice email received at test email addresses |

