

## Problem

When you edit fields on the Lead Profile page (e.g. name, notes, deal amount on the Profile tab) and then switch to another tab or navigate away, the edits are lost because:

1. **No auto-save**: The page requires manually clicking "Save Changes". If you switch tabs or navigate away without clicking save, edits exist only in React state which is fine for tab-switching (state lives at the parent level), but navigating away from the page entirely destroys the component and all state.
2. **No navigation guard**: There is no `beforeunload` or route-blocking prompt warning you about unsaved changes.
3. **Client portal tab position**: The client portal uses `useState('overview')` for its active tab — no URL persistence, so refreshing loses the tab position.

## Plan

### 1. Auto-save with debounce on LeadProfile

Add a `useEffect` that watches all editable fields and debounces an auto-save to the database after 1.5 seconds of inactivity. This means:
- You type into any field, and after a brief pause it saves automatically to the DB
- No more lost data when switching tabs or navigating away
- The manual "Save Changes" button remains as an instant-save option
- A subtle "Auto-saved" indicator replaces the save button text momentarily after auto-save fires

**File**: `src/pages/LeadProfile.tsx`
- Add a `useEffect` with a 1500ms debounce timer watching `name`, `email`, `phone`, `businessName`, `websiteUrl`, `billingAddress`, `status`, `notes`, `dealAmount`
- Only trigger if `hasUnsavedChanges` is true, `canEdit` is true, and `lead` is loaded
- Reuse the existing `handleSave` logic (extracted to a shared function)
- Track an `autoSaved` state to show brief feedback

### 2. Navigation guard for unsaved changes

Add a `beforeunload` event listener that warns if there are unsaved changes when closing/refreshing the browser tab.

**File**: `src/pages/LeadProfile.tsx`
- Add `useEffect` that attaches `beforeunload` when `hasUnsavedChanges` is true

### 3. Client portal tab persistence via URL

Mirror the LeadProfile pattern: use `useSearchParams` instead of `useState` for the active tab.

**File**: `src/pages/ClientPortalDashboard.tsx`
- Replace `const [activeTab, setActiveTab] = useState('overview')` with URL search param logic
- Use `searchParams.get('tab') || 'overview'`

### Summary of changes

| File | Change |
|------|--------|
| `src/pages/LeadProfile.tsx` | Add debounced auto-save effect + `beforeunload` guard |
| `src/pages/ClientPortalDashboard.tsx` | Persist active tab in URL search params |

No database changes needed.

