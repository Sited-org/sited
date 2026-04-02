

# Audit: Full Client Flow — Acquisition to Full Payment

## Findings

### Bug 1: Hardcoded "$549" on Offer.tsx (line 271)
The Blue hero card on `/offer` shows `Total: $549` as static text, while `makeTiers` correctly derives `totalPrice` from `usePackagePrices` (which returns $499 from the products table). The dynamic value is used in the upgrade cards but **not** in the hero Blue card's display.

**Impact**: Client sees $549 but actual charge will be $499.

**Fix**: Replace `$549` with `TIERS["basic-deposit"].totalPrice` on line 271.

### Bug 2: Hardcoded "$549" on LandingPage.tsx (lines 401, 426)
The `/go` page hero says "JUST $549" and the stat badge says "$549 All-In Package". These are hardcoded strings, not derived from `usePackagePrices` (which is already imported and used for the invoice calculation).

**Impact**: Same mismatch — displays $549 but charges $499.

**Fix**: Replace both instances with the dynamic `prices["basic-deposit"]` value.

### Bug 3: Hardcoded savings on Offer.tsx (line 274)
`SAVE $850` is static. Should be computed from `usualPrice - totalPrice` ($1,399 − $499 = $900).

**Fix**: Derive from `TIERS["basic-deposit"].savings`.

### Bug 4: `confirm-offer-payment` uses hardcoded DEPOSIT_AMOUNT = 49
Line 18 hardcodes `$49`. The `create-offer-payment-intent` and `send-deposit-link` functions correctly read deposit amount from `system_settings`. But `confirm-offer-payment` doesn't — it always uses $49 for the credit transaction.

**Impact**: If the admin changes the deposit amount in settings, `confirm-offer-payment` would record the wrong credit amount.

**Fix**: Read from `system_settings` table like the other functions do.

### Bug 5: `create-offer-checkout` missing deposit metadata
The checkout session created by `create-offer-checkout` (used on `/offer` when a tier redirect happens) does NOT set `type: "deposit"` in metadata, does NOT enable `invoice_creation`, and does NOT set `setup_future_usage`. This means:
- No invoice is generated
- Card is not saved for future charges  
- `autoCompleteDepositStep` won't fire (no `type: "deposit"` metadata)

**Impact**: Clients paying via the full checkout redirect path get no auto-P1S3 completion, no saved card, and no invoice.

**Fix**: Add `invoice_creation: { enabled: true }`, `payment_intent_data: { setup_future_usage: "off_session", metadata: { type: "deposit", lead_id } }`, and `metadata: { type: "deposit" }` to the checkout session — matching the `send-deposit-link` pattern.

### Bug 6: `create-offer-checkout` uses `stripe_price_id` from products table for full package price
This creates a Stripe Checkout for the **full package price** (e.g. $499) — not a $49 deposit. But the `/offer` page presents it as a deposit flow ($49). This is a major disconnect if both `create-offer-checkout` and `create-offer-payment-intent` are available as paths.

**Needs verification**: Which path does `/offer` actually use? Let me confirm.

### No issues found:
- **Products RLS**: Public can view active package products ✓
- **`usePackagePrices`**: Correctly queries products table with fallbacks ✓
- **`ProposalGenerator`**: Reads all pricing from products table dynamically ✓
- **Webhook deposit auto-complete**: Works for `invoice.paid`, `payment_intent.succeeded`, and `checkout.session.completed` ✓
- **`admin-charge-deposit`**: Reads deposit amount from settings ✓
- **`send-deposit-link`**: Reads deposit amount from settings, creates invoice ✓
- **Card saving**: All paths use `setup_future_usage: "off_session"` ✓

---

## Plan: Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/pages/Offer.tsx` | Replace hardcoded `$549` (line 271) with dynamic `TIERS["basic-deposit"].totalPrice`; replace `SAVE $850` (line 274) with `TIERS["basic-deposit"].savings` |
| 2 | `src/pages/LandingPage.tsx` | Replace hardcoded `$549` (lines 401, 426) with dynamic `prices["basic-deposit"]` |
| 3 | `supabase/functions/confirm-offer-payment/index.ts` | Replace `const DEPOSIT_AMOUNT = 49` with a `system_settings` lookup |
| 4 | `supabase/functions/create-offer-checkout/index.ts` | Add `invoice_creation`, `payment_intent_data` with `setup_future_usage` and `type: "deposit"` metadata, and `lead_id` lookup from email. This function also needs to charge the deposit price (not the full package price) — switch from using the package's `stripe_price_id` to using the canonical deposit `DEPOSIT_PRICE_ID` |

