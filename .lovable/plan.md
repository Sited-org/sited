

## Changes Overview

Five targeted changes across the SOW PDF, email template, and build flow step logic.

---

### 1. Remove package badge from PDF "Your Price" section

**File**: `ProposalGenerator.tsx` (lines 392-403)

Remove the entire block that renders the package badge (`selectedProduct` block with `roundedRect` and `badgeText`) inside the dark "Your Price" section of the PDF. The price will remain; only the tag is removed.

---

### 2. Reorder SOW line items: Pages → Portals → Features → Integrations → Free Add-Ons

**File**: `ProposalGenerator.tsx` (lines 177-192)

Restructure the `allItems` array construction to follow this order:
1. Pages (already `Page — {name}`)
2. Portals (Admin, Client, Staff)
3. Features
4. Integrations
5. Free add-ons (SEO, Device Optimisation, Revisions) — last

Currently portals are listed first, then pages, features, integrations, then free. Change to: pages first, then portals, then features, integrations, then free.

---

### 3. Update proposal email copy

**File**: `supabase/functions/send-proposal-email/index.ts`

Replace the `generateEmailHtml` function body with the exact copy provided:
- "Hi {Client First Name}," (extract first name from `lead.name`)
- Updated body paragraphs matching the user's spec
- Attachment block styled as a single-click button: "Attachment — Scope Of Work — {Company Name}"
- Sign-off: "Kindly, The Sited Team"

The edge function already receives `clientName` and `businessName` — will split `clientName` to get first name only.

---

### 4. Remove "Contract Signed" step from Phase 1

**File**: `supabase/functions/generate-build-flow/index.ts` (line 67)

Remove step 3 (`contract_signed`) from Phase 1's step array and renumber subsequent steps (deposit_received becomes step 3, client_profile_created becomes step 4, etc.).

This only affects **new** build flows. Existing ones retain their steps.

---

### 5. Auto-complete "Deposit Received" based on paid transactions

**File**: `BuildFlowView.tsx`

For the `deposit_received` step:
- Add a new check: query `transactions` for deposit items with `status = 'completed'` or `'paid'` for this lead
- If found → auto-mark the step as complete (call `onMarkComplete` automatically on mount/refetch)
- If not found → when the step is expanded, show a "Send Payment Link" button instead of "Mark Complete"
  - The payment link button invokes the existing deposit payment flow (constructs a Stripe payment link for the deposit amount and copies/sends it to the client)

**File**: `BuildFlowView.tsx` — add deposit status check:
- New `useEffect` that runs on `phases` change
- Finds the `deposit_received` step across all phases
- If not completed, queries transactions for paid deposits
- If a paid deposit exists, calls `onMarkComplete` with auto-description "Deposit automatically confirmed from payment records"

For the "Send Payment Link" UI when deposit is unpaid:
- Add a special handler similar to `isProposalStep` — `isDepositStep`
- When expanded and not completed, show a button "Send Deposit Payment Link" that invokes the existing `create-offer-payment-intent` or constructs a Stripe checkout link for the deposit amount

### Technical Details

| File | Change |
|------|--------|
| `ProposalGenerator.tsx` | Remove package badge from PDF; reorder `allItems` to Pages → Portals → Features → Integrations → Free |
| `send-proposal-email/index.ts` | Rewrite email HTML with exact copy; extract first name |
| `generate-build-flow/index.ts` | Remove `contract_signed` step; renumber P1 steps |
| `BuildFlowView.tsx` | Auto-detect deposit payment and mark step complete; show "Send Payment Link" if unpaid |

