

# Plan: Hide Invoice Status Badge for Membership Schedule Rows

## Understanding the Current System

Your understanding is correct:

| Row Type | Purpose | Affects Balance? | Should Show Invoice Status? |
|----------|---------|------------------|----------------------------|
| **Membership Schedule** (`is_recurring = true`) | Billing definition - drives automated invoicing | No | No (blank) |
| **Real Invoice/Charge** (`is_recurring = false`, debit > 0) | Actual charge to be paid | Yes | Yes ("Not Sent", "Sent", "Paid", etc.) |
| **Payment** (credit > 0) | Money received | Yes | Yes ("Completed") |

The membership schedule row is simply a **record that the client has an active membership** and stores the billing frequency. It is NOT a charge itself - the automated billing system reads these and generates real invoices on the 1st of each month.

Currently, these rows incorrectly show "Not Sent" which implies they need to be manually invoiced.

---

## What Will Change

**Before**: Membership schedule rows display "Not Sent" badge
**After**: Membership schedule rows display no badge (blank status column)

---

## Technical Changes

### File: `src/components/admin/lead-profile/PaymentsTab.tsx`

Modify the `getInvoiceStatusBadge` function to return `null` (no badge) for `is_recurring = true` rows:

```typescript
const getInvoiceStatusBadge = (transaction: TransactionWithBalance) => {
  // Future preview transactions
  if (transaction.isFuture) {
    return <Badge variant="outline" className="...">Scheduled</Badge>;
  }

  // Voided transactions
  if (transaction.status === 'void' || transaction.invoice_status === 'void') {
    return <Badge variant="outline" className="...">Void</Badge>;
  }
  
  // NEW: Membership schedule rows (is_recurring = true) are billing definitions,
  // not actual charges to be invoiced - show no status badge
  if (transaction.is_recurring) {
    return null;
  }

  // For debit transactions (charges), show invoice status
  if (Number(transaction.debit) > 0) {
    switch (transaction.invoice_status) {
      case 'not_sent':
        return <Badge>Not Sent</Badge>;
      // ... other cases
    }
  }
  
  // ... rest of function
};
```

---

## Visual Result

| Item | Status Column (Before) | Status Column (After) |
|------|------------------------|----------------------|
| Website Maintenance (50% Off) - Monthly | "Not Sent" badge | *(blank)* |
| Feb 1 Invoice for $60 | "Sent" badge | "Sent" badge |
| Payment received $60 | "Completed" badge | "Completed" badge |

---

## Summary

This is a small change to one function that will:
1. Recognize membership schedule rows by `is_recurring = true`
2. Return no badge for these rows
3. Leave all other transaction types unchanged

