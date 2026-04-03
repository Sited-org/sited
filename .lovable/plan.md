

# Booking System Audit: Bugs Found

## Booking Avenues Identified

There are **5 booking entry points**:

1. **BookingDialog** — Public discovery call booking from the website (20 min)
2. **OnboardingBookingDialog** — Post-payment plan call booking dialog (45 min)
3. **OnboardingBookingInline** — Inline post-payment plan call booking (45 min, uses `submit-booking` edge function)
4. **AdminBookCallDialog** — Admin books a call from a lead's profile (discovery/plan/checkin)
5. **CalendarBookingDialog** — Admin books from the calendar view (discovery/plan/checkin)

## Critical Bug: RLS Blocks All Public Bookings (Avenues 1 & 2)

**Severity: CRITICAL — breaks the entire public booking flow**

The `bookings` table has only three RLS policies, all gated by `is_admin(auth.uid())`:
- INSERT: `is_admin(auth.uid())`
- UPDATE: `is_admin(auth.uid())`
- SELECT: `is_admin(auth.uid())`

**BookingDialog** (avenue 1) and **OnboardingBookingDialog** (avenue 2) insert directly via the Supabase client using the anon key. Since the user is not an admin (they're a public visitor), the insert is **silently rejected by RLS**. The `.single()` call returns an error, and the user sees "Something went wrong."

**OnboardingBookingInline** (avenue 3) is the only public booking path that works correctly — it uses the `submit-booking` edge function which inserts via the service role key, bypassing RLS.

**Admin paths** (avenues 4 & 5) work because the admin is authenticated and passes `is_admin()`.

### Fix

Route `BookingDialog` and `OnboardingBookingDialog` through the `submit-booking` edge function instead of inserting directly via the client. This:
- Bypasses RLS (service role)
- Adds captcha validation (spam protection)
- Adds rate limiting
- Keeps the security model intact (no need to open RLS to anonymous users)

Both components need:
1. Add captcha fetch + display (same pattern as `OnboardingBookingInline`)
2. Replace `supabase.from("bookings").insert(...)` with `supabase.functions.invoke("submit-booking", { body: { captcha_token, captcha_answer, booking } })`
3. Use the returned `booking_id` for the subsequent Zoom meeting creation

## Bug 2: No Double-Booking Protection on Public Paths

**Severity: Medium**

`AdminBookCallDialog` and `CalendarBookingDialog` both check for existing bookings before inserting (double-booking guard). However, `BookingDialog`, `OnboardingBookingDialog`, and `OnboardingBookingInline` do **not** check — they rely on slot availability from `get-available-slots`, but there's a race condition if two users pick the same slot simultaneously.

### Fix

Add a double-booking check inside the `submit-booking` edge function. Before inserting, query for an existing non-cancelled booking at the same date+time. This protects all three public paths with a single server-side check.

## Bug 3: `BookingDialog` Has No Captcha

**Severity: Medium**

`BookingDialog` (the main website discovery call form) inserts directly with no captcha or rate limiting. Even after fixing Bug 1 by routing through `submit-booking`, the component currently has no captcha UI. It needs the same captcha flow as `OnboardingBookingInline`.

`OnboardingBookingDialog` also lacks captcha — same fix needed.

## Summary of Changes

| # | File | Change |
|---|------|--------|
| 1 | `src/components/booking/BookingDialog.tsx` | Add captcha UI; replace direct insert with `submit-booking` edge function call |
| 2 | `src/components/booking/OnboardingBookingDialog.tsx` | Add captcha UI; replace direct insert with `submit-booking` edge function call |
| 3 | `supabase/functions/submit-booking/index.ts` | Add double-booking check before insert |

No database migrations needed. No new edge functions needed.

