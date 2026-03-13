

## Problem

The `manage-booking` edge function code for rescheduling (PATCH) and cancelling (DELETE) Zoom meetings is correct. The issue is that your **Zoom Server-to-Server OAuth app** doesn't have the required scopes. The edge function logs confirm this:

```
Zoom update error: {"code":4711,"message":"Invalid access token, does not contain scopes:
[meeting:update:meeting:admin, meeting:update:meeting]."}
```

## Root Cause

Your Zoom app currently has scopes to **create** meetings but not to **update** or **delete** them.

## Fix

### 1. Add missing Zoom OAuth scopes (manual — Zoom Marketplace)

Go to [marketplace.zoom.us](https://marketplace.zoom.us) → your Server-to-Server app → **Scopes** and add:

- `meeting:update:meeting:admin` — required for PATCH (reschedule)
- `meeting:delete:meeting:admin` — required for DELETE (cancel)

Save and re-activate the app.

### 2. Update `getTypeLabel` in manage-booking

The function currently returns "Discovery Call" for check-in types. Add the `checkin` label to match the rest of the system.

### 3. Fix the `new_start_time` timezone format

The reschedule PATCH sends `start_time` to Zoom but the value may not include the timezone suffix. Ensure it's sent as a local datetime string with the `timezone: 'Australia/Sydney'` field (already present), matching the pattern used in `create-zoom-meeting`.

### Technical changes

| File | Change |
|------|--------|
| **Zoom Marketplace** (manual) | Add `meeting:update:meeting:admin` and `meeting:delete:meeting:admin` scopes |
| `supabase/functions/manage-booking/index.ts` | Fix `getTypeLabel` to handle `checkin` type; ensure reschedule start_time format is consistent |

No database changes needed. No new edge functions needed — the existing code already handles both actions correctly; it just fails silently when Zoom rejects the request due to missing scopes.

