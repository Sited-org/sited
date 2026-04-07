

# Fix: Full-Page Website Screenshots & Auto-Capture on Save

## Problem

The current screenshot capture uses thum.io with `crop/3000` which only captures the **top 3000 pixels** of each website — essentially the hero section stretched. This is why the screenshots don't look like the actual full websites.

Additionally, screenshots are only captured when the admin manually clicks "Capture Screenshots". The user wants auto-capture when a testimonial is saved.

## Solution

### 1. Fix the Edge Function to Capture Full Pages

Change the thum.io URL from:
```
/get/width/1440/crop/3000/noanimate/
```
to:
```
/get/width/1440/fullpage/noanimate/
```

This tells thum.io to render and capture the **entire page** from top to bottom, not just 3000px.

Also delete the old incorrect screenshots from storage before uploading new ones (upsert already handles replacement, but we'll ensure cache-busting by appending a timestamp query param to the stored URL reference).

### 2. Auto-Trigger Screenshot Capture on Testimonial Save

In `AdminTestimonials.tsx`, after successfully creating or updating a testimonial that has a `website_url`, automatically invoke the `capture-site-screenshots` edge function with the specific slug so only that one site is re-captured — fast and targeted.

### 3. Delete Old Screenshots

The edge function will first delete the existing file before uploading the new full-page version, ensuring no stale cropped images remain.

## Files Changed

| # | File | Change |
|---|------|--------|
| 1 | `supabase/functions/capture-site-screenshots/index.ts` | Change `crop/3000` → `fullpage` in thum.io URL; increase timeout to 60s for larger images; delete old file before upload |
| 2 | `src/pages/AdminTestimonials.tsx` | After save, auto-invoke edge function for the saved testimonial's slug; remove manual "Capture Screenshots" button |

