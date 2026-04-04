

# Fix: Dynamic Deposit Amount & Pricing Consistency

## Problem

1. **Hardcoded `$49` deposit** appears in ~20 places across 3 pages (`Offer.tsx`, `LandingPage.tsx`, `OfferPaymentForm.tsx`) and the SEO meta tags. The backend already reads from `system_settings.deposit_amount` but the frontend ignores it.

2. **Hardcoded "Was" prices** on `/offer` ($1,399 / $1,699 / $3,359) and `/go` line item strikethroughs ($1,599, $450, $600, $400, $399) are arbitrary — they don't come from the products table or any admin-configurable source.

3. **`deposit_amount` can't be read by unauthenticated users** — the `system_settings` RLS only allows public SELECT for `homepage_content` and `offer_page_content`, not `deposit_amount`.

4. **Gold features list** redundantly includes "Calendar integration" and "Email integration" when it already says "Everything in Blue".

## Solution

### 1. Add RLS policy for public deposit_amount access

```sql
CREATE POLICY "Public can view deposit amount"
ON public.system_settings FOR SELECT TO public
USING (setting_key = 'deposit_amount');
```

### 2. Extend `usePackagePrices` hook to also fetch deposit amount

Add a `depositAmount` field (default 49) to the hook's return value. Fetch `system_settings.deposit_amount` alongside the products query. All consuming pages get dynamic deposit for free.

### 3. Make all `$49` references dynamic

**Files to update:**

| File | Hardcoded instances |
|------|-------------------|
| `src/pages/Offer.tsx` | `price: "$49"` on all 3 tiers, `$49` in ~8 UI strings, SEO meta, savings calc |
| `src/pages/LandingPage.tsx` | Process step desc, invoice "Due Today" line, guarantee text, CTA button, remaining calc |
| `src/components/offer/OfferPaymentForm.tsx` | Button text "Pay $49" |

All will read `depositAmount` from the hook or receive it as a prop.

### 4. Fix Gold package duplicate features

Remove "Calendar integration" and "Email integration" from Gold's features array since "Everything in Blue" already covers them.

### 5. Keep "Was" prices as-is (no product-table source exists)

The "usual prices" ($1,399, $1,699, $3,359) are marketing values — the products table only has `package` type products (the discounted prices). There are no individual service products (page, feature, integration, portal) in the database to derive "was" prices from. The SOW generator has fallback defaults for those (`page: 159`, `feature: 300`, etc.) but these are internal costing rates, not public-facing "was" values.

**Recommendation**: Leave "was" prices hardcoded as marketing values. They're intentionally inflated for sales psychology and don't need to match the SOW's internal rates. If you want them admin-configurable later, that would require a new settings key.

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/usePackagePrices.ts` | Add `depositAmount` to return; fetch from `system_settings` |
| `src/pages/Offer.tsx` | Replace all `$49` with dynamic `deposit`; fix Gold features |
| `src/pages/LandingPage.tsx` | Replace all `$49` with dynamic `deposit` |
| `src/components/offer/OfferPaymentForm.tsx` | Accept `depositAmount` prop; use in button text |

## Database Migration

```sql
CREATE POLICY "Public can view deposit amount"
ON public.system_settings FOR SELECT TO public
USING (setting_key = 'deposit_amount');
```

