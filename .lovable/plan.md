

# Fix: Admin & Client Request Communication

## Problems Found

1. **Admin view doesn't show request source**: `AdminRequests.tsx` and its `ClientRequest` interface lack `request_source`, `requires_client_action`, and `action_type` fields. Admin cannot distinguish between client-sent requests and admin-sent requests — they all look the same.

2. **Client cannot upload files on team requests without `requires_client_action`**: The `ClientFileUploadButton` only renders when `requires_client_action` is true. But many admin requests simply need a file response without being flagged as "requires client action." Clients should always be able to respond with files to any active team request.

3. **No "respond" mechanism on team requests in client portal**: When admin sends a request, the client sees it but has no way to reply with text or mark it as actioned (unless it's an asset_upload type). There's no generic response mechanism.

4. **Admin view has no source badge**: The `RequestCard` in `AdminRequests.tsx` doesn't show whether a request came from the client or was admin-initiated. This makes it hard to track communication direction.

---

## Plan

### Step 1: Add source fields to AdminRequests interface and display
- Add `request_source`, `requires_client_action`, `action_type` to the `ClientRequest` interface in `AdminRequests.tsx`
- Add a badge on each request card showing "Client Request" vs "Team Request" based on `request_source`
- Include `request_source` in the select query (already returns `*` so data is there, just needs typing + UI)

### Step 2: Add source filter to AdminRequests
- Add a "Source" filter dropdown alongside status/client filters: All / Client / Team

### Step 3: Enable client file upload on all active team requests
- In `MyRequestsTab.tsx`, show `ClientFileUploadButton` on **all** active team requests (not just those with `requires_client_action`), so clients can always respond with a file
- Keep the specialized "Upload Brand Assets" button for `asset_collection`/`asset_upload` action types

### Step 4: Add client text response to team requests
- In `MyRequestsTab.tsx` `renderRequestCard`, add a small "Reply" button on active team requests that expands an inline textarea + submit button
- On submit, call `submit-client-request` edge function with a new action `reply_to_request` that updates `admin_notes` or creates a linked response (simplest: append to a `client_response` field)
- This requires a new column `client_response` on `client_requests` table

### Step 5: Show client response in admin detail sheet
- In `AdminRequests.tsx` detail sheet, display `client_response` if present, similar to how `admin_notes` is shown but labeled "Client Response"

---

## Database Migration

```sql
ALTER TABLE public.client_requests
  ADD COLUMN IF NOT EXISTS client_response text;
```

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/AdminRequests.tsx` | Add source fields to interface, source badge on cards, source filter, show `client_response` in detail sheet |
| `src/components/client-portal/MyRequestsTab.tsx` | Show file upload on all active team requests, add inline reply mechanism for team requests |
| `supabase/functions/submit-client-request/index.ts` | Handle `reply_to_request` action to update `client_response` column |

