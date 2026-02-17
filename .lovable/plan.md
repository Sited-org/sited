
# Developer Portal -- Separate Route Implementation

## Overview
Build a fully independent Developer Portal at `/dev` with its own layout, components, and routing. Developers will be hard-redirected away from all `/admin/*` paths. The admin layout, sidebar, and navigation will never initialise for developer sessions.

---

## Architecture

All developer-facing code lives under a new, isolated directory and route structure:

```text
src/
  components/
    dev/
      DevLayout.tsx          -- Standalone layout (own sidebar, header, sign-out)
      DevDashboard.tsx        -- Assigned project cards with progress
      DevProjectView.tsx      -- Read-only client profile + editable workflow
      DevWorkflowTracker.tsx  -- Extended tracker with notes + review flags
  pages/
    DevLogin.tsx              -- Shares /admin/login, redirects to /dev on success
```

Routes added to `App.tsx`:
```text
/dev            -- DevLayout wrapper
/dev            -- index: DevDashboard
/dev/project/:id -- DevProjectView
```

---

## Step 1 -- Database: RLS and Write Restrictions

**New SQL migration:**

1. Create `is_developer()` helper function (checks `user_roles.role = 'developer'`).

2. Add scoped SELECT policy on `leads`:
   - "Developers can view assigned leads" -- `is_developer(auth.uid()) AND assigned_to = auth.uid()`

3. Add scoped UPDATE policy on `leads` for developers:
   - "Developers can update workflow on assigned leads" -- same condition

4. Add a BEFORE UPDATE trigger `enforce_developer_lead_updates` on `leads` that rejects any column change other than `workflow_data` when the session user is a developer. If a developer attempts to change name, email, status, deal_amount, etc., the trigger raises an exception.

5. Add scoped SELECT policies for related tables so developers only see data for their assigned leads:
   - `customer_notes` -- developer can SELECT where `lead_id IN (SELECT id FROM leads WHERE assigned_to = auth.uid())`
   - `project_milestones` -- same pattern
   - `client_requests` -- same pattern
   - `project_updates` -- same pattern

All existing `is_admin()` policies remain unchanged (developers are already excluded from `is_admin()`).

---

## Step 2 -- Login Routing

**Modify `src/pages/AdminLogin.tsx`:**
- After successful OTP verification, check the user's role.
- If role is `developer`, redirect to `/dev` instead of `/admin`.
- The `handleOTPVerified` function will query `user_roles` for the logged-in user and branch accordingly.

**Modify `src/components/admin/AdminLayout.tsx`:**
- In the `useEffect` auth guard, add an additional check: if the user IS authenticated AND their role is `developer`, hard-redirect to `/dev`. This ensures a developer who manually types `/admin/anything` is always bounced out.

---

## Step 3 -- Developer Layout (`src/components/dev/DevLayout.tsx`)

A standalone layout component (NOT using AdminLayout):
- Its own minimal sidebar with: Dashboard link, Sign Out button
- Branded header: "Sited.dev"
- Mobile-responsive hamburger menu
- User display showing developer name and "Developer" role label
- Renders `<Outlet />` for nested routes
- Auth guard: if not authenticated or role is not `developer`, redirect to `/admin/login`

---

## Step 4 -- Developer Dashboard (`src/components/dev/DevDashboard.tsx`)

- Fetches leads using `useLeads()` (RLS will automatically scope to assigned leads only)
- Displays project cards showing:
  - Client name and business name
  - Project type
  - Overall build progress percentage (calculated from `workflow_data`)
  - Visual progress bar
- Cards link to `/dev/project/:id`
- Zero financial data, zero pipeline metrics, zero customer notes summary
- Simple stats row: number of assigned projects, average completion percentage

---

## Step 5 -- Developer Project View (`src/components/dev/DevProjectView.tsx`)

When a developer opens an assigned client project:

**Read-only sections:**
- Business name, contact details (name, email, phone), website URL
- Form data / project brief (displayed via `FormResponsesDisplay` with no edit controls)
- Uploaded assets (via `UploadedFilesDialog`, view-only)
- AI Website Brief / generated prompts (display only, no generator)
- Admin/sales notes (read-only text display)
- Client requests list (read-only)

**Editable section:**
- Workflow Tracker (the only writable component)

**Explicitly excluded:**
- No Payments tab
- No Card tab
- No Settings tab
- No status change dropdown
- No Save Changes button for profile data
- No deal amount field
- No billing address
- Back button navigates to `/dev` (not `/admin/leads`)

---

## Step 6 -- Enhanced Workflow Tracker (`src/components/dev/DevWorkflowTracker.tsx`)

Based on the existing `WorkflowTracker` component but enhanced:

**New stages added to STAGE_DEFINITIONS:**
- `crm_setup`: "CRM Setup" with steps: Planning, Configuration, Testing, Live
- `email_automation`: "Email Automation" with steps: Template Design, Flow Setup, Testing, Active

**New data fields in workflow_data JSONB:**
- `stage_notes`: `Record<string, string>` -- per-stage build notes (textarea under each stage)
- `review_requested`: `Record<string, boolean>` -- per-stage review flag

**UI additions:**
- Small textarea under each active stage for build notes
- "Request Review" toggle button per stage (sets `review_requested[stageKey] = true`)
- Badge indicator when review is requested (visible to both developer and admin)

The admin-facing `WorkflowTracker` in `src/components/admin/lead-profile/` will also be updated to display the review flags and notes (read-only for admins, or editable if they have `can_edit_leads`).

---

## Step 7 -- Route Registration (`src/App.tsx`)

Add new lazy-loaded routes:

```text
const DevLayout = lazy(() => import("./components/dev/DevLayout"));
const DevDashboard = lazy(() => import("./components/dev/DevDashboard"));
const DevProjectView = lazy(() => import("./components/dev/DevProjectView"));

<Route path="/dev" element={<DevLayout />}>
  <Route index element={<DevDashboard />} />
  <Route path="project/:id" element={<DevProjectView />} />
</Route>
```

---

## Step 8 -- Admin Guard Against Developer Access

In `AdminLayout.tsx`, the existing auth guard will be extended:

```
if (!isAuthenticated || !isAdmin) -> redirect to /admin/login
if (isDeveloper) -> redirect to /dev
```

This ensures the admin sidebar, navigation, and layout never initialise for a developer session. The developer role is already excluded from `is_admin()` in the database function, so `isAdmin` returns false for developers. However, to provide a clean redirect rather than showing the login page, we explicitly check `isDeveloper` first and redirect to `/dev`.

---

## Security Summary

| Resource | Developer Access |
|---|---|
| leads (SELECT) | Only where `assigned_to = auth.uid()` via RLS |
| leads (UPDATE) | Only `workflow_data` column via DB trigger, only assigned leads |
| leads (INSERT/DELETE) | Blocked (no policy grants this) |
| transactions, products, memberships | Blocked (`is_admin` excludes developers) |
| customer_notes, project_milestones, client_requests | Read-only for assigned leads via new RLS policies |
| user_roles, admin_profiles, system_settings | Blocked |
| /admin/* routes | Hard-redirect to /dev at router level |
| Admin sidebar/layout | Never initialises for developer sessions |

---

## Files to Create
1. `src/components/dev/DevLayout.tsx`
2. `src/components/dev/DevDashboard.tsx`
3. `src/components/dev/DevProjectView.tsx`
4. `src/components/dev/DevWorkflowTracker.tsx`

## Files to Modify
1. `src/App.tsx` -- add /dev routes
2. `src/pages/AdminLogin.tsx` -- redirect developers to /dev after OTP
3. `src/components/admin/AdminLayout.tsx` -- hard-redirect developers away
4. `src/components/admin/lead-profile/WorkflowTracker.tsx` -- add new stages, notes, review flags
5. `src/hooks/useAuth.ts` -- no changes needed (`isDeveloper` already exported)

## New Migration
1. `is_developer()` function, scoped RLS policies, update trigger
