

# Booking System Audit: Bugs Found

## Summary

Traced the full booking flow across all 5 entry points, including slot fetching, booking insertion, Zoom meeting creation, and email notifications (client confirmation + admin notification). Found 1 bug.

## Bug 1: `BookingDialog` Drops `adminTime` When Selecting a Time Slot

**Severity: Medium** (same class as the OnboardingBookingDialog bug just fixed)

`BookingDialog` line 469 calls `handleTimeSelect(slot.time)` — passing only the display time string. The `handleTimeSelect` function (line 159) accepts `(time: string, adminTime?: string)`, but since `slot.adminTime` is never passed as the second argument, `adminTime` defaults to `time` (the client display time).

This means when a client in Perth (AWST, UTC+8) books a discovery call, the booking is stored with the Perth display time instead of the admin's Brisbane (AEST, UTC+10) canonical time. The Zoom meeting is also scheduled at the wrong hour.

`OnboardingBookingDialog` and `OnboardingBookingInline` both correctly pass the full `slot` object. Only `BookingDialog` is broken.

### Fix

Change line 469 from:
```
onClick={() => handleTimeSelect(slot.time)}
```
to:
```
onClick={() => handleTimeSelect(slot.time, slot.adminTime)}
```

This is a one-line fix. No edge function or database changes needed.

## Verified Working

- All 3 public paths route through `submit-booking` edge function with captcha, rate limiting, and double-booking protection
- Both admin paths (`AdminBookCallDialog`, `CalendarBookingDialog`) insert directly with admin auth + double-booking check
- `create-zoom-meeting` correctly sends branded confirmation email to client AND admin notification email via Resend
- `manage-booking` correctly sends cancellation and reschedule emails to client
- `get-available-slots` correctly converts between client and admin timezones and returns `adminTime` on slots
- `email_logs` is populated for confirmation emails

## Plan

| # | File | Change |
|---|------|--------|
| 1 | `src/components/booking/BookingDialog.tsx` | Pass `slot.adminTime` to `handleTimeSelect` on line 469 |

