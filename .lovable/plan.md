
Goal
- Fix why “Book Discovery Call” fails for prospects, and add verification (reCAPTCHA-like) in a secure way.

What I found (root cause)
1) The booking insert policy is already permissive in the database (`polpermissive = true`) and allows `anon, authenticated`.
2) The frontend booking submit currently does:
- `insert(...).select('id').single()`
- This sends `Prefer: return=representation` (confirmed in your network request), which requires row visibility for the returned row.
3) Public users do NOT have a public SELECT policy on `bookings`, so the insert+return flow fails with:
- `401 / 42501 new row violates row-level security policy`
4) So this is RLS-related, but specifically due to requesting returned data from a table that public users cannot read.

Plan to fix (implementation)
1) Immediate booking fix (no schema changes required)
- File: `src/components/booking/OnboardingBookingInline.tsx`
- Change submit flow to avoid `select().single()`:
  - Generate `bookingId` client-side (`crypto.randomUUID()`).
  - Insert with explicit `id: bookingId` and no returning/select.
  - Use `bookingId` for the follow-up `create-zoom-meeting` call.
- Improve error diagnostics:
  - Log actual insert error details to console.
  - Keep user-facing toast simple.

2) Add verification before booking (“reCAPTCHA or similar”)
- Recommended “similar” approach using your existing captcha stack:
  - Reuse `generate-captcha` (already exists).
  - Add new backend function `submit-booking` that:
    - validates captcha token+answer,
    - marks captcha as used,
    - rate-limits by IP (reuse `rate_limits`),
    - inserts booking server-side using service credentials,
    - returns `booking_id`.
- Frontend update in `OnboardingBookingInline.tsx`:
  - Show simple captcha prompt before final “Confirm Discovery Call”.
  - Submit to `submit-booking` instead of direct table insert.

3) Tighten security so captcha is actually enforced
- Add migration:
  - remove public direct insert policy (`Anyone can create a booking`) OR restrict direct inserts to admin-only paths.
  - keep reads admin-only as-is.
- Reason: if public direct insert remains open, bots can bypass captcha by calling REST directly.

4) Ensure both funnels work
- `OnboardingBookingInline` is used in `/free` and `/go` flow (`LandingPage.tsx`), so one component fix covers both entry points.

Technical details (concise)
```text
Current failing chain:
UI -> insert bookings + return id (requires SELECT visibility) -> RLS blocks row visibility -> booking fails

Target chain:
UI -> captcha challenge -> submit-booking function (verify captcha + insert) -> return booking_id -> create zoom meeting
```

Validation checklist after changes
1) `/free`: submit lead -> choose date/time -> complete booking successfully.
2) `/go` flow (post-payment path): booking also succeeds.
3) Wrong captcha: blocked with clear message.
4) Expired/used captcha token: blocked and refreshes challenge.
5) Mobile + desktop: captcha field and submit CTA remain clean and easy to use.

Files expected to change
- `src/components/booking/OnboardingBookingInline.tsx`
- `supabase/functions/submit-booking/index.ts` (new)
- `supabase/config.toml` (register function auth mode)
- `supabase/migrations/<new>.sql` (policy tightening for enforced verification)
