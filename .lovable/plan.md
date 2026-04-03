

# Fix: Remove Mockup Background Wrappers on Features Page

## Problem

Each mockup on `/features` is wrapped in `<div className="force-light rounded-xl overflow-hidden border border-border">`. This creates a visible white rectangular background/border around the mockup — especially noticeable on dark theme and smaller viewports where the mockup doesn't fill the wrapper. The mockup components already have their own `bg-card/80 border rounded-3xl shadow-2xl` styling, so the outer wrapper is redundant and creates a double-border effect.

## Fix

### 1. Features.tsx — Remove wrapper divs (lines 248, 260, 271, 283, 294)

Replace each wrapper like:
```tsx
<div className="force-light rounded-xl overflow-hidden border border-border"><CRMMockup /></div>
```
with just:
```tsx
<CRMMockup />
```

### 2. Add `force-light` to each mockup component's root element

In each of the 5 mockup components, add the `force-light` class to the outermost `motion.div` or inner card div so the light theme override still applies without an extra background container:

- `CalendarMockup.tsx` — add `force-light` to the root `motion.div` (line 33)
- `CRMMockup.tsx` — add `force-light` to the root `motion.div` (line 32)
- `ClientPortalMockup.tsx` — add `force-light` to the root `motion.div` (line 42)
- `ClientProfileMockup.tsx` — add `force-light` to its root element
- `InvoiceMockup.tsx` — add `force-light` to the root `motion.div` (line 27)

### 3. Also update the CRM title text

Change line 244 from `"A CRM Built Around You"` to `"Automated AI Lead Management"` (requested in prior conversation but not yet applied).

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Features.tsx` | Remove 5 wrapper divs, update CRM title |
| `src/components/services/CalendarMockup.tsx` | Add `force-light` to root element |
| `src/components/services/CRMMockup.tsx` | Add `force-light` to root element |
| `src/components/services/ClientPortalMockup.tsx` | Add `force-light` to root element |
| `src/components/services/ClientProfileMockup.tsx` | Add `force-light` to root element |
| `src/components/services/InvoiceMockup.tsx` | Add `force-light` to root element |

No database or edge function changes needed.

