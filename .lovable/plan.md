

## Streamline Lead Creation: Only Lead Capture + Discovery Call Booking

### What Changes

Currently, leads are created from **4 places**. After this change, only **2** will remain:

1. **Lead Capture Dialog** (the popup on `/`) -- creates a **Warm Lead (WL)**
2. **Discovery Call Booking** (booking flow) -- creates a **Discovery Call Booked (DCB)** lead

The **Website Onboarding form** (`/onboarding`) will become a pure information-gathering tool that does NOT create new leads. The **ContactOffers questionnaire** will update existing leads but not create new ones.

### Files to Remove
- `src/hooks/useSecureLeadSubmission.ts` -- entire hook is only used by the onboarding form for lead creation; no longer needed
- `supabase/functions/submit-lead/index.ts` -- fallback lead submission edge function, now redundant

### Files to Modify

**`src/pages/WebsiteOnboarding.tsx`**
- Remove import and usage of `useSecureLeadSubmission`
- Remove all `savePartialLead`, `updatePartialLead`, `submitLead` calls
- The form still submits data, but it saves to the **existing lead** (looked up by email) via `save-partial-lead` with an update-only approach, or simply stores the onboarding data without creating a lead
- The onboarding form becomes a data-enrichment tool: it updates `form_data` on an already-existing lead

**`src/pages/ContactOffers.tsx`**
- The `handleTrickAnswer` function currently calls `save-partial-lead` -- this should update the existing lead (by email) rather than potentially creating a new one
- Add a flag or use `lead_id` from session to ensure it only updates, never inserts

**`src/components/LeadCaptureDialog.tsx`**
- Keep as-is: this is one of the two valid lead creation paths
- Ensure the lead status is explicitly set to `warm_lead`

**`supabase/functions/save-partial-lead/index.ts`**
- Add an `update_only` mode: when called from the onboarding form or questionnaire, it should only update an existing lead (by email), never create a new one
- Keep the "create new lead" path for the Lead Capture Dialog only
- Clean up the "partial" flag logic since partial leads no longer exist as a concept

**`src/components/admin/LeadStatusBadge.tsx`**
- Remove `isPartialLead()` function and `partialConfig`
- Remove partial-specific row background color
- Remove `getLeadRowBackground` partial handling
- Badge always reflects the actual lead status from the funnel tree

**`src/hooks/useFormSessions.ts`**
- Keep as-is (tracks form session analytics, independent of lead creation)

### Technical Details

```text
BEFORE:
  Lead Capture Dialog ──> save-partial-lead ──> CREATE lead (status: new/warm_lead)
  ContactOffers        ──> save-partial-lead ──> CREATE/UPDATE lead
  Onboarding Form      ──> useSecureLeadSubmission ──> save-partial-lead + submit-lead ──> CREATE/UPDATE lead
  Booking Dialog       ──> create-zoom-meeting ──> CREATE lead (status: discovery_call_booked)

AFTER:
  Lead Capture Dialog ──> save-partial-lead ──> CREATE lead (status: warm_lead)
  ContactOffers        ──> save-partial-lead ──> UPDATE existing lead only (by email)
  Onboarding Form      ──> save-partial-lead ──> UPDATE existing lead only (by email)
  Booking Dialog       ──> create-zoom-meeting ──> CREATE lead (status: discovery_call_booked)
```

### Database Cleanup
- Migration to update any existing leads with legacy statuses (`new`, `contacted`, `booked_call`, `sold`) to their correct funnel equivalents (`warm_lead`, `warm_lead`, `new_client`, `ot_sold_dev`)
- Remove the `partial` concept from `form_data` going forward (existing data is harmless)

### What Stays the Same
- The onboarding form UI and fields remain unchanged -- it still collects detailed project info
- The Lead Capture Dialog remains the front-door for new leads
- The booking system continues creating DCB leads
- All admin dashboard views, funnel tree, and status badges work with the existing funnel statuses
- Email notifications for new leads from both valid paths continue working
