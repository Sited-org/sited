

## Problem Identified

There are **two bugs** causing the date mismatch:

### Bug 1: Admin CalendarView uses UTC dates instead of local dates
In `CalendarView.tsx`, the function `getBookingsForDate` (line 22) and all date comparisons use `date.toISOString().split('T')[0]`. This converts to **UTC**, not local time. For an admin in AEST (UTC+10/11):
- `new Date(2026, 2, 18)` (March 18 midnight local) → `.toISOString()` → `"2026-03-17T13:00:00Z"` → splits to `"2026-03-17"`
- But `booking_date` stored in the database is `"2026-03-18"`
- So the booking appears on **March 19** in the admin calendar (because March 19 midnight AEST = March 18 UTC)

### Bug 2: Booking stores client timezone time, but availability checks admin timezone time
The `get-available-slots` function checks booked times against `adminTimeStr`, but `submit-booking` stores the **client's displayed time** (e.g., "11:30 AM" Sydney instead of "10:30 AM" Brisbane). This causes availability checking to break — already-booked slots still appear available.

---

## Plan

### 1. Fix CalendarView.tsx — Use local date strings
Replace all `date.toISOString().split('T')[0]` with a helper that formats using local year/month/day:
```
function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
```
Apply in `getBookingsForDate`, `MonthView`, `WeekView`, and the `todayStr` calculations.

### 2. Fix OnboardingBookingInline.tsx — Store admin timezone time
- Update the `TimeSlot` interface to include optional `adminTime` field
- When the user selects a time slot, track both the display time and the `adminTime` from the API response
- Submit `booking_time` as the **admin time** (falling back to client time if same timezone)
- Compute Zoom `start_time` ISO using the admin timezone and admin time

### 3. Fix submit-booking/index.ts — No changes needed
The edge function already stores whatever `booking_time` is sent. Once the frontend sends admin-timezone time, it will be consistent.

### Files to change
- `src/components/admin/calendar/CalendarView.tsx` — local date string helper
- `src/components/booking/OnboardingBookingInline.tsx` — track and submit adminTime

