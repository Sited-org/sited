

# Fix: Admin "Pay Now" Deposit Dialog Not Loading

## Root Cause

The `AdminPayNowDialog` is the **only** file using `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY` to initialize Stripe. That env var does not exist in the `.env` file, so `loadStripe('')` produces a null Stripe instance. The `Elements` provider silently fails and the `PaymentElement` never renders — the dialog just shows a spinner forever.

Every other payment component in the codebase uses the hardcoded live publishable key: `pk_live_51JrYQ7KEOhx2BLuX...`.

There's also a secondary bug: `initPayment()` is called during render (not inside `useEffect`), which can cause duplicate PaymentIntent creation on re-renders.

## Fix

### File: `src/components/admin/lead-profile/build-flow/AdminPayNowDialog.tsx`

1. Replace `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''` with the same hardcoded live key used everywhere else
2. Move `initPayment()` into a proper `useEffect` triggered by `open` state to prevent race conditions and duplicate calls

No edge function changes needed — `admin-charge-deposit` works correctly and returns a valid `clientSecret`.

| # | File | Change |
|---|------|--------|
| 1 | `src/components/admin/lead-profile/build-flow/AdminPayNowDialog.tsx` | Use correct Stripe publishable key; move init logic into useEffect |

