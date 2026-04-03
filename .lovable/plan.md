

# Booking System Audit: Bug Found

## Current State

All 3 public booking components (`BookingDialog`, `OnboardingBookingDialog`, `OnboardingBookingInline`) correctly route through the `submit-booking` edge function with captcha, rate limiting, and double-booking protection. The edge function inserts via service role, bypassing RLS. Admin paths work via direct insert with admin auth.

## Bug: `OnboardingBookingDialog` Ignores `adminTime` — Wrong Time Stored

**Severity: Medium**

`OnboardingBookingDialog` has `selectedAdminTime` state (line 83) but **never sets it**. The `handleTimeSelect` (line 178) only captures `slot.time` (the client-timezone display time), not `slot.adminTime`. The `TimeSlot` interface (line 47) also lacks `adminTime`.

When the client is in a different timezone than the admin (e.g. Perth vs Brisbane), the booking is stored with the **client's display time** instead of the admin's canonical time, causing a mismatch between what the admin sees on their calendar and when the Zoom meeting is actually scheduled.

`BookingDialog` and `OnboardingBookingInline` both correctly capture and use `adminTime`. Only `OnboardingBookingDialog` is broken.

### Fix

1. Add `adminTime?: string` to the `TimeSlot` interface
2. Update `handleTimeSelect` to accept the full slot object and set `selectedAdminTime`
3. Use `selectedAdminTime || selectedTime` for `booking_time` in the submit body (line 222) — matching the pattern in `BookingDialog` (line 210)
4. Use `selectedAdminTime` for the Zoom `localStartTime` calculation (line 241)

## Plan

| # | File | Change |
|---|------|--------|
| 1 | `src/components/booking/OnboardingBookingDialog.tsx` | Add `adminTime` to `TimeSlot`, update `handleTimeSelect` to capture it, use `selectedAdminTime` in submit and Zoom creation |

No edge function or database changes needed.

