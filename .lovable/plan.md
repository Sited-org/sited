

# Fix: Deposit Auto-Complete Failing Due to UUID Type Mismatch

## Root Cause

The `autoCompleteDepositStep` helper inserts `completed_by: 'system'` into `step_completions`, but that column is `uuid NOT NULL`. The string `'system'` is not a valid UUID, so the insert silently fails. The success log fires anyway because there's no error check after the insert.

**Result**: Transaction recorded correctly, card saved correctly, but P1S3 stays incomplete.

## The Fix

Two changes in `supabase/functions/stripe-webhook/index.ts`:

1. **Use a deterministic "system" UUID** instead of the string `'system'`. A common pattern is `00000000-0000-0000-0000-000000000000` (the nil UUID). Use this for both `step_completions.completed_by` and `build_steps.completed_by`.

2. **Add error checking** after the `step_completions` insert and `build_steps` update so failures are logged instead of silently swallowed.

### Lines changed

| Line | Current | New |
|------|---------|-----|
| 52-57 | `completed_by: 'system'` | `completed_by: '00000000-0000-0000-0000-000000000000'` + error check |
| 59-63 | `completed_by: 'system'` | `completed_by: null` (nullable column) + error check |

### File modified
- `supabase/functions/stripe-webhook/index.ts` — Fix UUID values and add error logging in `autoCompleteDepositStep`

