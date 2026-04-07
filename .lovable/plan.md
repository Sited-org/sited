

# Fix: Revert Screenshot URLs to Direct Storage Path

## Problem

The `getScreenshotUrl` helper uses Supabase's `/render/image/` transformation endpoint, which adds latency and can fail/timeout. The screenshots are already pre-captured PNGs stored in the `site-screenshots` bucket — no on-the-fly transformation is needed.

## Solution

Change the URL from `/render/image/` back to `/object/public/` in `getScreenshotUrl`. This serves the file directly from storage with no processing overhead.

| # | File | Change |
|---|------|--------|
| 1 | `src/lib/screenshot-url.ts` | Switch from `/render/image/...?width=...&quality=75` to `/object/public/...` (direct file serve) |

One-line change. No other files need updating since they all call `getScreenshotUrl`.

