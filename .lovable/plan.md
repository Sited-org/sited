

# Build Flow & Client Portal Integration: Bug Audit

## Bugs Found

### Bug 1: `build-assets` Bucket is Private — Public URLs Won't Work
**Severity: Critical**

The `build-assets` storage bucket is set to `public: false`. Both the admin `ClientAssetsPanel` (line 87) and the client `upload-client-asset` edge function (line 216) call `getPublicUrl()` and store the returned URL in `client_assets`. These URLs are inaccessible without authentication — images will return 403 errors when rendered in `<img>` tags in both the admin panel and the client portal.

**Fix**: Make the `build-assets` bucket public via migration. Brand assets (logos, favicons, OG images) are inherently public resources used on client websites. Alternatively, use signed URLs, but since these are meant for website deployment, public is correct.

### Bug 2: Client Asset Upload Doesn't Auto-Complete P2 Steps
**Severity: High**

When a client uploads a logo via `ClientAssetUploadDialog`, the `upload-client-asset` edge function saves the file and updates `client_assets`, but it does **not** mark the corresponding P2 build step (`logo_512`, `logo_32`, `og_image`) as complete. Similarly, when brand data (colours/fonts) is submitted via the `save_brand_data` action, steps `brand_colours` and `brand_fonts` are not auto-completed.

The admin `ClientAssetsPanel` has auto-complete logic (`checkAndAutoCompleteBrandColoursStep`) but the client portal flow bypasses this entirely.

**Fix**: In the `upload-client-asset` edge function, after a successful file upload or brand data save, look up the matching `build_steps` record by `step_key` and mark it complete (using the system UUID `00000000-...`). This mirrors the deposit auto-complete pattern.

### Bug 3: `notify-client-portal` Email Doesn't Recognize `asset_collection` Action Type
**Severity: Medium**

The `BuildFlowView` (line 287) creates requests with `action_type: 'asset_collection'`. The `notify-client-portal` email template (line 54) only checks for `action_type === 'asset_upload'` to customize the message. When `asset_collection` is sent, the client gets a generic "Your team has a new update" message instead of "Your team needs you to upload brand assets."

**Fix**: Update `notify-client-portal` to also check for `'asset_collection'` in the `actionLabel` conditional.

### Bug 4: `ClientRequest` Interface in `ClientPortalDashboard` Missing New Fields
**Severity: Medium**

The `ClientRequest` interface (line 61-71) in `ClientPortalDashboard.tsx` does not include `request_source`, `requires_client_action`, or `action_type`. These fields are returned by `get-client-data` and used by `ClientOverviewTab` and `MyRequestsTab`, but TypeScript won't enforce their presence since the data is cast to this interface.

While this works at runtime (the fields still exist on the object), it's a type-safety gap that could cause silent failures during refactoring.

**Fix**: Add the missing fields to the `ClientRequest` interface in `ClientPortalDashboard.tsx`.

### Bug 5: P2S6 "Client Confirmation" Has No Mechanism
**Severity: Medium**

Step `assets_confirmed` (P2S6) is defined in the build flow but there is no client-facing button or confirmation flow. The client can upload assets and submit brand data, but there's no way for them to signal "I confirm all assets are final." Currently only an admin can mark this step complete manually.

**Fix**: After the client submits brand data in `ClientAssetUploadDialog`, add a confirmation step or auto-create a client request with `action_type: 'confirm_assets'` that the client can approve from their requests tab.

### Bug 6: Duplicate Asset Collection Requests
**Severity: Low**

The "Send Asset Collection Form to Client" button in `BuildFlowView` (line 263-309) has no guard against duplicate sends. An admin can click it multiple times, creating multiple `client_requests` records with `action_type: 'asset_collection'` and sending duplicate emails.

**Fix**: Before inserting, check if an active (pending/in_progress) `asset_collection` request already exists for this lead.

---

## Plan

### Step 1: Make `build-assets` bucket public
Database migration to update the bucket's `public` flag.

### Step 2: Auto-complete P2 steps from client uploads
Modify `upload-client-asset/index.ts` to mark the corresponding build step complete after a successful file upload (`logo_512`, `logo_32`, `og_image`) or brand data save (`brand_fonts`, `brand_colours`).

### Step 3: Fix `notify-client-portal` action type check
Update the `actionLabel` conditional to include `'asset_collection'`.

### Step 4: Fix TypeScript interface in `ClientPortalDashboard`
Add `request_source`, `requires_client_action`, and `action_type` to the `ClientRequest` interface.

### Step 5: Add duplicate guard for asset collection button
Check for existing active asset collection request before creating a new one.

### Step 6: Add client confirmation mechanism for P2S6
After brand data submission, show a "Confirm All Assets" button in the dialog that creates/updates a confirmation request and auto-completes P2S6.

---

## Files to modify

| File | Change |
|------|--------|
| `supabase/functions/upload-client-asset/index.ts` | Auto-complete P2 build steps on upload/save |
| `supabase/functions/notify-client-portal/index.ts` | Add `asset_collection` to action label check |
| `src/pages/ClientPortalDashboard.tsx` | Add missing fields to ClientRequest interface |
| `src/components/admin/lead-profile/build-flow/BuildFlowView.tsx` | Add duplicate guard for asset collection button |
| `src/components/client-portal/ClientAssetUploadDialog.tsx` | Add "Confirm All Assets" final step |

## Database migration
```sql
UPDATE storage.buckets SET public = true WHERE id = 'build-assets';
```

