

# Plan: Dynamic Product Pricing + Deposit Email Audit

## Problem 1: Hardcoded Tier Prices

Project costs are hardcoded in multiple places instead of reading from the `products` table. The current products table has updated prices: Essential Blue = $499, Gold = $649, Platinum = $1,149. But several files still reference $549, $649, $1,199.

### Affected files and changes

**Backend (Edge Functions):**

1. **`supabase/functions/confirm-offer-payment/index.ts`** — Replace the hardcoded `TIER_CONFIG` (lines 10-15: $549/$649/$1199) with a DB lookup from the `products` table where `product_type = 'package'`. Map tier names to product names (basic-deposit → Essential Blue, gold → Gold Package, platinum → Platinum Package). Use the `price` column for `totalPrice`.

2. **`supabase/functions/create-offer-checkout/index.ts`** — Replace hardcoded `PRICE_MAP` (lines 10-27) with a DB lookup from `products` table to get `stripe_price_id` dynamically. This ensures if a product price is updated in admin settings, the Stripe checkout uses the correct price ID.

**Frontend (Display only — prices shown to customers):**

3. **`src/pages/Offer.tsx`** — Replace hardcoded $549/$649/$1199 tier prices with values fetched from the `products` table (via the existing `useProducts` hook or a new public query). The deposit amount ($49) is already dynamic from `system_settings`.

4. **`src/pages/LandingPage.tsx`** — Replace hardcoded `totalPrice: 549` and display strings with dynamic values from the products table.

### Technical approach
- Edge functions will query `products` table at runtime using the service role client
- Frontend pages will fetch active packages on mount
- Tier-to-product mapping: `basic-deposit` → product named "Essential Blue", `gold` → "Gold Package", `platinum` → "Platinum Package"

---

## Problem 2: Deposit Email — Rogue Send to Libby Ireland

### Investigation findings

The `send-deposit-link` edge function is **only** called from one place: the "Send Payment Link" button in `BuildFlowView.tsx` (line 111). There are **no automated triggers** — no webhook calls it, no cron job, no other edge function invokes it.

The email log shows it was sent on March 31 at 00:41 UTC. This means an admin clicked the button in Libby Ireland's build flow. It was not a system-initiated email.

### Confirmation: No code changes needed for deposit email isolation

The three deposit paths are already correctly isolated:
1. **Build flow button** → `send-deposit-link` (admin-initiated only)
2. **Offer/Go page** → `create-offer-payment-intent` (client self-service via Stripe Elements)
3. **Admin Pay Now** → `admin-charge-deposit` (admin enters card in build flow)

No automated flow sends deposit emails without admin action. The Libby email was triggered by a human clicking the button.

---

## Files to modify

| File | Change |
|------|--------|
| `supabase/functions/confirm-offer-payment/index.ts` | Replace hardcoded TIER_CONFIG with products table lookup |
| `supabase/functions/create-offer-checkout/index.ts` | Replace hardcoded PRICE_MAP with products table lookup |
| `src/pages/Offer.tsx` | Fetch prices from products table instead of hardcoding |
| `src/pages/LandingPage.tsx` | Fetch prices from products table instead of hardcoding |

