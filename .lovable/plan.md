

## Problem

The Discovery Form in the Build Flow tab stores all data in React `useState` only. When you navigate away (switch tabs, go to another lead, refresh), the component unmounts and all entered data is destroyed. There is no draft persistence.

Since this form runs **before** a build flow exists, there's no `build_flow_id` to save to `discovery_answers` mid-form. The data can only be written to that table on final submit.

## Solution: localStorage Draft Persistence

Use `localStorage` keyed by the lead's ID to auto-save form data and step position on every change. On mount, restore from localStorage. On successful submit, clear the draft.

### Changes — single file: `DiscoveryForm.tsx`

1. **Add `leadId` prop** — passed from `BuildFlowProjectTab` (which already has `lead.id`)
2. **On mount**: Check `localStorage` for key `discovery_draft_{leadId}`. If found, restore `data` state and `stepIndex`.
3. **On every state change**: Debounce (500ms) a write of `{ data, stepIndex }` to that localStorage key.
4. **On successful submit**: Remove the localStorage key.
5. **Add `beforeunload` guard** while form has entries, as a safety net.

### Changes — `BuildFlowProjectTab.tsx`

Pass `leadId={lead.id}` to the `DiscoveryForm` component (1-line change).

### Why localStorage over a database table

- No build flow or discovery record exists yet at this stage — there's nothing to write to
- localStorage is instant, zero-latency, and survives tab switches, page navigations, and refreshes
- It's cleared on submit when the real database records are created
- No migration needed

### Summary

| File | Change |
|------|--------|
| `DiscoveryForm.tsx` | Add `leadId` prop, `useEffect` to load/save draft from localStorage, clear on submit |
| `BuildFlowProjectTab.tsx` | Pass `leadId={lead.id}` to `DiscoveryForm` |

No database changes required.

