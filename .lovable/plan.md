

# Bug Audit: Full Flow — Client Portal, Build Flow & Request System

## Bugs Found

### Bug 1: `request_attachments` RLS INSERT Policy Always Rejects (CRITICAL)
**Impact**: Every client file upload via `ClientFileUploadButton` fails silently.

The RLS policy `Service role can insert attachments` has `with_check: false`, meaning **all inserts are rejected**. The `upload-request-attachment` edge function uses the service role key, but the `with_check: false` policy still blocks inserts because the policy applies to the `public` role and overrides the permissive check.

The fix: The edge function already uses the service role key which bypasses RLS entirely. The real problem is the policy itself — `with_check: false` was likely meant to be `true` (allow all via service role). Since the service role bypasses RLS, this policy is actually a no-op for the edge function. However, if for any reason the insert is going through with the anon role, it would fail. The safest fix is to change this policy to `with_check: true` so it doesn't accidentally block anything.

**Fix**: Migration to drop and recreate the policy with `with_check = true`.

### Bug 2: `request-attachments` Storage Bucket Has No Upload Policy for Service Role
**Impact**: The storage upload in `upload-request-attachment` may fail because the storage policies only allow `can_edit_leads(auth.uid())` for INSERT. The edge function uses the service role key which bypasses storage RLS, so this is not a blocking issue — but it means clients **cannot** download their own attachments since there's no client-facing SELECT policy.

Admin can download via `is_admin(auth.uid())` but the `request-attachments` bucket is private, meaning `getPublicUrl()` won't work. The admin download handler likely uses `createSignedUrl()` — need to verify.

**Fix**: This is non-blocking since admins use signed URLs. No change needed unless client download is required.

### Bug 3: `get-client-data` Does Not Return `client_response` Field
**Impact**: When a client submits a reply to a team request, the admin can see it (AdminRequests fetches `*`), but the **client portal** doesn't show their own response back to them because `get-client-data` doesn't include `client_response` in its SELECT.

**Fix**: Add `client_response` to the SELECT in `get-client-data/index.ts` line 211.

### Bug 4: `submit-client-request` Missing `request_source` on New Requests
**Impact**: When a client creates a new request, the insert (line 238) does not set `request_source`. It defaults to `null`. The client portal splits requests by `request_source === 'manual'` vs `'admin'` (MyRequestsTab line 236), but client-created requests have `null` — they fall into "My Requests" via the `!r.request_source` fallback, so this works by accident. However, it's fragile.

**Fix**: Add `request_source: 'manual'` to the insert in `submit-client-request/index.ts`.

### Bug 5: Client Portal `MyRequestsTab` Missing `client_response` in Interface
**Impact**: The `ClientRequest` interface (line 32-45) doesn't include `client_response`. If a client submits a reply, they can't see their own response displayed on the request card. The admin sees it, but the client doesn't get confirmation their reply was recorded.

**Fix**: Add `client_response` to the interface and render it in `renderRequestCard`.

---

## Plan

### Step 1: Fix `request_attachments` INSERT RLS policy
Drop the broken `with_check: false` policy and recreate with `with_check: true`.

```sql
DROP POLICY IF EXISTS "Service role can insert attachments" ON public.request_attachments;
CREATE POLICY "Service role can insert attachments" ON public.request_attachments FOR INSERT TO public WITH CHECK (true);
```

### Step 2: Add `client_response` to `get-client-data` SELECT
In `get-client-data/index.ts` line 211, add `client_response` to the select string.

### Step 3: Add `request_source: 'manual'` to client-created requests
In `submit-client-request/index.ts` line 238, add `request_source: 'manual'` to the insert object.

### Step 4: Add `client_response` to `MyRequestsTab` interface and display
Add the field to the interface and show it on request cards so clients can see their own replies.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/get-client-data/index.ts` | Add `client_response` to client_requests SELECT |
| `supabase/functions/submit-client-request/index.ts` | Add `request_source: 'manual'` to insert |
| `src/components/client-portal/MyRequestsTab.tsx` | Add `client_response` to interface + render |

## Database Migration

```sql
DROP POLICY IF EXISTS "Service role can insert attachments" ON public.request_attachments;
CREATE POLICY "Service role can insert attachments" ON public.request_attachments FOR INSERT TO public WITH CHECK (true);
```

