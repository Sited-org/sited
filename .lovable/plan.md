

# Discovery Form Fixes: Branding, Notes, Requirements & Staff Roles

## Summary

Four changes to the discovery form in `DiscoveryForm.tsx` plus minor updates to the View Answers dialog.

## Changes

### 1. Replace branding acquisition button with informational text (lines 555-573)

Remove the `handleSendBrandingAcquisition` function and the Send button. Replace with:

- **If "yes"**: Show info box with text: *"A branding acquisition form will need to be sent in phase 2 to the client portal."*
- **If "partial"**: Show info box with text: *"Enter what parts of the branding you can acquire, a branding acquisition form will need to be sent in Phase 2 to collect the remaining assets."* — keep the colour/style inputs below as-is.

Also remove the `Send` icon import if no longer used elsewhere.

### 2. Fix notes losing focus after each keystroke

**Root cause**: `StepNotesSection`, `CheckboxGroup`, `AddCustomField`, and `SectionLabel` are all defined as functions **inside** the component body. Every state change recreates these functions, causing React to treat them as new component types and unmount/remount — which destroys focus.

**Fix**: Move `StepNotesSection` outside the component as a standalone component that receives `value` and `onChange` props instead of closing over `data` and `updateStepNote`. Same for `CheckboxGroup`, `AddCustomField`, and `SectionLabel` — extract them above the main component.

This is the critical fix — it will also resolve any similar issues with other text inputs defined via these inner components.

### 3. Ensure "Additional Requirements" visibility in View Answers

The `customNeeds` fields and step notes already appear in the View Answers dialog. No changes needed for data — they're already in `LABEL_MAP` and the section key arrays. Verified working.

### 4. Move "User Roles" from Admin Portal to Staff Portal when staff is selected

When `staff_portal` is in `selectedPortals`:
- **Admin Portal step**: Hide the "User Roles" section entirely (the `ADMIN_ROLES` checkboxes + custom roles). Admin portal keeps its other features (dashboard widgets, auth, notifications).
- **Staff Portal step**: Replace current `STAFF_ROLE_TYPES` (`Developer`, `Designer`, etc.) with new role options: `Manager`, `Sales`, `Finance`, `Developer`, `Technician`, `Receptionist`, `Consultant`. Keep the existing "+ Add custom role" field for "Other" text entry.

When staff portal is NOT selected, admin portal shows User Roles as before.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/lead-profile/build-flow/DiscoveryForm.tsx` | All 4 changes: extract inner components, replace branding button, conditional roles logic, update `STAFF_ROLE_TYPES` |

## Technical Detail

**Notes fix pattern** — extract `StepNotesSection` like:
```tsx
// Outside component
function StepNotesSection({ stepId, value, onChange }: { stepId: string; value: string; onChange: (stepId: string, value: string) => void }) {
  return (
    <div className="mt-6 pt-4 border-t border-border">
      ...
      <Textarea value={value} onChange={e => onChange(stepId, e.target.value)} ... />
    </div>
  );
}
```

Then in render: `<StepNotesSection stepId="basics" value={data.stepNotes?.basics || ''} onChange={updateStepNote} />`

Same extraction pattern for `CheckboxGroup`, `AddCustomField`, and `SectionLabel`.

