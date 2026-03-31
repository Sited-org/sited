

# Fix Plan: Payments Tab Crash + Financial Page Voiding

## Problem 1: Payments Tab Disappears on Leads with Active Subscriptions

**Root cause:** The `ActiveSubscriptions` component renders `format(new Date(subscription.current_period_end * 1000), 'PP')` (lines 182, 186). If any Stripe subscription returns a `null` or `0` value for `current_period_end`, `date-fns` `format()` throws an `Invalid time value` error. Since there is no error boundary, this crashes the entire `PaymentsTab` component tree — causing it to unmount and show a blank screen.

This only affects leads with active subscriptions because the component returns `null` for leads without them (line 152), meaning the unsafe `format()` call is never reached.

**Fix — `ActiveSubscriptions.tsx`:**
- Wrap date formatting in safe checks: if `current_period_end` is falsy, show "N/A" instead of calling `format()`
- Wrap the entire component render in a try-catch error boundary pattern — if the fetch or render fails, show an inline error message instead of crashing the parent
- Remove the `throw` on line 52 (`throw new Error(data?.error)`) — on a non-success response, just set subscriptions to empty array instead of throwing (the catch block handles it, but the throw is unnecessary noise)

## Problem 2: Voiding from `/admin/financial` Not Working

**Root cause:** The "Void Invoices" button on the Outstanding Accounts tab only appears when `account.outstandingInvoices > 0` AND `isAdmin` is true (line 73: `const isAdmin = userRole?.role === 'owner' || userRole?.role === 'admin'`). The void action itself uses `voidAllOutstanding` which does `INSERT` + `UPDATE` on the `transactions` table — both gated by the `can_edit_leads` RLS policy.

The likely issue: after voiding, the dialog closes and `reason` is cleared, but `fetchTransactions` is called inside `voidAllOutstanding` — this should work. However, the `handleVoidAll` function (line 105-112) calls `voidAllOutstanding` which internally calls `voidTransaction` in a loop. Each `voidTransaction` call does a `fetchTransactions()` at the end, causing N refetches for N transactions. This could create race conditions where the transactions state is stale during the loop.

**Fix — `useAllTransactions.ts`:**
- In `voidTransaction`: remove the `fetchTransactions()` call at the end — let the caller decide when to refetch
- In `voidAllOutstanding`: call `fetchTransactions()` once after all voids complete instead of N times
- In `zeroAccount`: ensure `fetchTransactions()` is called once at the end (already done)
- Add a standalone `refetch` call after each public void/zero operation in `AdminFinancial.tsx`

## Problem 3: `window.location.reload()` in PaymentsTab

Multiple actions in `PaymentsTab` use `window.location.reload()` (lines 154, 258, 393, 519, 562) which causes the entire admin layout to re-initialize (auth check, OTP check, role fetch). This is fragile and can cause the tab to disappear if the auth state settles differently.

**Fix — `PaymentsTab.tsx`:**
- Replace all `window.location.reload()` calls with the `refetch` function from `useTransactions` hook (already exposed as `refetch`)
- This keeps the current route/tab mounted and just refreshes the transaction data

## Files to modify

1. **`src/components/admin/lead-profile/ActiveSubscriptions.tsx`** — Safe date formatting, error-resilient rendering
2. **`src/components/admin/lead-profile/PaymentsTab.tsx`** — Replace `window.location.reload()` with hook refetch
3. **`src/hooks/useAllTransactions.ts`** — Fix void refetch race condition
4. **`src/hooks/useTransactions.ts`** — Expose refetch, ensure void doesn't cause stale state

