

## Problem

Currently, when a SOW is sent, a single transaction is created for the full package price. There is no deposit concept, and the line items in the proposal are hardcoded constants rather than being derived from the admin Products catalog. You need:

1. A configurable **deposit amount** in admin settings (synced with Stripe)
2. Proposal billing to create **two transactions**: deposit + remaining balance
3. Line-item pricing derived from the **products table** rather than hardcoded constants

## Plan

### 1. Add deposit configuration to Products settings page

**File**: `src/components/admin/settings/ProductsSettingsTab.tsx`
- Add a "Deposit Settings" card above the products table
- Contains a single editable field: **Deposit Amount ($)** with a Save button
- Reads/writes to `system_settings` table with key `deposit_amount`
- On save, also syncs the deposit as a Stripe product/price via `sync-product-stripe` edge function

### 2. Store deposit amount in system_settings

**No migration needed** — the `system_settings` table already exists. We'll insert/update a row with `setting_key = 'deposit_amount'` and `setting_value = { amount: 49 }`.

Add an RLS policy so this setting is readable by authenticated admins (already covered by existing admin SELECT policy).

### 3. Update ProposalGenerator billing logic

**File**: `src/components/admin/lead-profile/build-flow/ProposalGenerator.tsx`

Currently (lines 442-458), a single transaction is created on send. Change to:

- Fetch the deposit amount from `system_settings` on dialog open
- On "Send Proposal", create **two transactions**:
  - **Transaction 1**: `item: "Deposit — {BusinessName}"`, `debit: depositAmount`, `status: 'completed'`, `invoice_status: 'not_sent'`
  - **Transaction 2**: `item: "{PackageName} Package — {BusinessName}"`, `debit: actualPrice - depositAmount`, `status: 'completed'`, `invoice_status: 'not_sent'`
- The SOW PDF itself still shows the **full package price** (e.g. $1000) — the deposit split is an internal billing concern

### 4. Derive line-item pricing from products table

**Database migration**: Add columns to `products` table for categorizing product types:
```sql
ALTER TABLE products ADD COLUMN product_type text NOT NULL DEFAULT 'package';
-- product_type values: 'package', 'page', 'feature', 'integration', 'portal_admin', 'portal_client', 'portal_staff'
```

**File**: `src/hooks/useProducts.ts` — Update `Product` interface to include `product_type`

**File**: `src/components/admin/settings/ProductsSettingsTab.tsx` — Add a "Type" dropdown when creating/editing products (Package, Page Add-on, Feature Add-on, Integration Add-on, Admin Portal, Client Portal, Staff Portal)

**File**: `src/components/admin/lead-profile/build-flow/ProposalGenerator.tsx` — Replace hardcoded `PAGE_PRICE`, `FEATURE_PRICE`, `INTEGRATION_PRICE`, `ADMIN_PORTAL_PRICE`, etc. with values fetched from products where `product_type` matches

### Summary of changes

| File | Change |
|------|--------|
| **Migration** | Add `product_type` column to `products` table |
| `src/hooks/useProducts.ts` | Add `product_type` to Product interface |
| `src/components/admin/settings/ProductsSettingsTab.tsx` | Add deposit config card + product type dropdown |
| `src/components/admin/lead-profile/build-flow/ProposalGenerator.tsx` | Fetch deposit from settings, create 2 transactions on send, use product-derived pricing |
| `supabase/functions/sync-product-stripe/index.ts` | No change needed — already handles any product |

