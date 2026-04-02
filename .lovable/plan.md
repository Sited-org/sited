

# Client Portal Overhaul: Build Flow Integration, Notifications & Asset Upload

## Summary

The client portal currently tracks "Development Progress" via a separate `workflow_data` JSON blob on the leads table (frontend/backend/integrations/AI stages), which is disconnected from the actual build flow phases used in the admin. This plan links the portal to the real build flow, adds admin/developer-initiated request notifications, and enables in-portal asset uploads.

---

## Changes

### 1. Link Development Progress to Real Build Flow Phases

**Current state**: `WebsiteTab.tsx` reads `workflow_data` from leads and renders hardcoded stage definitions (Frontend, Backend, Integrations, AI).

**New behavior**: Replace the workflow tracker with a read-only view of the actual `build_phases` and `build_steps` tables. Show each phase with its steps, completion status, and progress percentage.

**Backend (`get-client-data/index.ts`)**: Add queries for `build_flows`, `build_phases`, and `build_steps` for the lead. Return them in the response alongside existing data. Filter to only include `is_visible_to_client = true` step completions.

**Frontend (`WebsiteTab.tsx`)**: Replace `STAGE_DEFINITIONS` and `WorkflowData` with the real phase/step data. Render each phase as a collapsible section with step completion indicators.

### 2. Add "Admin Requests" Section to Dashboard + Requests Tab

**Current state**: Dashboard shows "Active Requests" (client-submitted). No distinction between client-initiated and admin/developer-initiated requests.

**New behavior**: Split requests into two categories using the existing `request_source` column:
- **My Requests**: `request_source = 'manual'` or submitted by client
- **Admin Requests**: `request_source = 'admin'` or requests created by admin/developer (via `CreateRequestDialog`)

**Database change**: Add a `requires_client_action` boolean column to `client_requests` (default false). When an admin creates a request that needs client response (e.g., asset upload), they flag it. Also add `action_type` text column (nullable) for special actions like `'asset_upload'`.

**Dashboard (`ClientOverviewTab.tsx`)**: Add an "Admin Requests" card alongside "Active Requests", showing requests where `request_source != 'manual'` and status is pending/in_progress. Show a notification badge count.

**Requests tab (`MyRequestsTab.tsx`)**: Add a section header "From Your Team" above admin-originated requests, distinct from "My Requests".

### 3. Notification System: Email Client on Admin/Developer Requests

**Current state**: `notify-client-request` only emails admins when a client submits a request. No reverse notification exists.

**New edge function (`notify-client-portal`)**: When an admin or developer creates a request targeting a client (via `CreateRequestDialog` with `created_by_admin: true`), send an email to the client with:
- Request title and description
- Direct link to client portal (`https://sited.co/client-portal`)
- Call-to-action to log in and respond

**Trigger**: Modify `CreateRequestDialog` to call this new function after successful request creation. The existing `notify-client-request` continues notifying admins for client-submitted requests.

### 4. In-Portal Asset Upload (Client-Facing)

**Current state**: Asset collection happens entirely within the admin `ClientAssetsPanel`. Clients have no way to upload assets through their portal.

**New behavior**: When an admin request has `action_type = 'asset_upload'`, the client portal shows an "Upload Assets" button that opens a dialog for uploading logos, images, and brand files.

**New component (`ClientAssetUploadDialog.tsx`)**: A simplified version of `ClientAssetsPanel` with:
- Logo upload slots (matching the LOGO_SLOTS from admin)
- General file upload for brand guidelines, media
- Files uploaded to `build-assets` storage bucket under the client's lead path
- On upload, update the `client_assets` record (same table the admin panel uses)
- Auto-complete the relevant `build_steps` (e.g., `logo_512`) when the client uploads

**Edge function (`upload-client-asset/index.ts`)**: New function to handle client-side uploads with session token auth. Validates the session, uploads to `build-assets` bucket, updates `client_assets` table, and optionally auto-completes the corresponding build step.

### 5. Payment History Linking

**Current state**: `get-client-data` already returns transactions, and `PaymentsTab` displays them. But the dashboard doesn't surface payment status relative to the build flow.

**Enhancement**: The deposit status is already shown via P1S3 in the new build flow progress view (change #1). No additional linking needed beyond ensuring the progress tracker correctly reflects paid/unpaid deposit status.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/client-portal/ClientAssetUploadDialog.tsx` | In-portal asset upload dialog for clients |
| `supabase/functions/notify-client-portal/index.ts` | Email clients when admin/dev creates a request |
| `supabase/functions/upload-client-asset/index.ts` | Handle client-side asset uploads with session auth |

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/get-client-data/index.ts` | Add build_flows, build_phases, build_steps queries |
| `src/components/client-portal/WebsiteTab.tsx` | Replace workflow_data tracker with real build flow phases |
| `src/components/client-portal/ClientOverviewTab.tsx` | Add "Admin Requests" section, notification counts |
| `src/components/client-portal/MyRequestsTab.tsx` | Split requests into "My Requests" and "From Your Team" sections |
| `src/components/admin/lead-profile/CreateRequestDialog.tsx` | Add `requires_client_action` and `action_type` fields; call `notify-client-portal` |
| `src/pages/ClientPortalDashboard.tsx` | Pass build flow data to WebsiteTab |

## Database Migration

```sql
ALTER TABLE public.client_requests
  ADD COLUMN IF NOT EXISTS requires_client_action boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS action_type text;
```

