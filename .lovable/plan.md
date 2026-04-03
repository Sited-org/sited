

# Fix: Client Request Restrictions & Cleanup

## Summary

Four changes to enforce proper client request behavior: clients can only create new requests (not modify existing ones), remove ETA from client view, and stop email notifications on status changes.

## Changes

### 1. Remove file upload on existing client requests (Bug 1 & 4)

In `MyRequestsTab.tsx`, the `showActions` flag on `renderRequestCard` controls whether file upload and reply buttons appear. Currently:
- Team requests pass `showActions = true` (line 478) — correct, clients need to respond to team requests
- Active client requests pass `showActions = false` (line 557) — already correct

**No change needed for client requests** — they already don't show upload buttons on their own active requests. However, the `ClientFileUploadButton` on team requests is correct (clients should be able to upload files as a response to admin/team requests).

The real issue is the **Reply button** on team requests. Clients should still be able to reply to team requests (that's responding, not modifying). But they should NOT be able to modify their own submitted requests. Currently they can't — no edit mechanism exists on submitted client requests. This is already correct.

**Verdict**: No code change needed for Bug 1/4 — the system already prevents clients from modifying existing requests. They can only create new ones and respond to team requests.

### 2. Remove email notifications on status changes (Bug 2)

The `updateRequestMutation` in `AdminRequests.tsx` (lines 266-299) does **not** send any email — it only updates the database and shows a toast. No email notification is triggered on status change.

**Verdict**: No code change needed — status changes already don't email clients. The previous plan mentioned adding this but it was **never implemented**.

### 3. Remove ETA from client view (Bug 3)

Two places to clean up:

**a) Client portal `MyRequestsTab.tsx`**: The `estimated_completion` field is in the interface (line 41) but is **never rendered** in `renderRequestCard`. No change needed here.

**b) Admin portal `AdminRequests.tsx`**: The ETA date picker (lines 869-888) says "This will be visible to the client" — but the client portal never shows it. The ETA field on the admin side is an internal tool. Per the user's request, remove it entirely.

**c) Admin `RequestsTab.tsx`** (lead profile): The `RequestCard` component (line 94-100) shows ETA when `showETA` is true. This is admin-only view so it could stay, but user wants ETA removed altogether.

**d) Database**: The `estimated_completion` column on `client_requests` can remain (no migration needed) — just remove it from all UI.

### Plan

| # | File | Change |
|---|------|--------|
| 1 | `src/pages/AdminRequests.tsx` | Remove the ETA date picker section (lines 869-888) and `estimatedCompletion` from the save mutation; remove `estimated_completion` from `updateRequestMutation` |
| 2 | `src/pages/AdminRequests.tsx` | Remove `showETA` prop from in-progress `RequestCard` renders (line 642) |
| 3 | `src/components/admin/lead-profile/RequestsTab.tsx` | Remove `showETA` usage from in-progress section and the ETA display in `RequestCard` |
| 4 | `src/components/client-portal/MyRequestsTab.tsx` | Remove `estimated_completion` from the `ClientRequest` interface (cleanup) |

### Technical details

- `AdminRequests.tsx` line 267: Remove `estimated_completion` from the mutation parameters
- `AdminRequests.tsx` line 276: Remove `estimated_completion` from the update object
- `AdminRequests.tsx` lines 869-888: Delete the ETA input section
- `AdminRequests.tsx` line 642: Remove `showETA` prop
- `RequestsTab.tsx` lines 94-100: Remove ETA rendering from `RequestCard`
- `MyRequestsTab.tsx` line 41: Remove `estimated_completion` from interface

No database migration needed. No edge function changes needed.

