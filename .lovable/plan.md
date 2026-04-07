

# Fix: Faster Loading for Website Screenshot Showcases

## Problem

The full-page screenshots stored in Supabase are large uncompressed PNGs (likely 2-5MB each). Every showcase card loads the full-resolution image even though it's displayed at ~400-600px wide. This causes slow initial loads and wastes bandwidth.

## Solution

Use Supabase Storage's built-in **image transformation API** to serve resized, compressed versions. This requires changing only the URL pattern — no re-uploading or new infrastructure.

Instead of:
```
/storage/v1/object/public/site-screenshots/example-full.png
```

Use:
```
/storage/v1/render/image/public/site-screenshots/example-full.png?width=800&quality=75
```

This serves a ~50-100KB image instead of a multi-megabyte one.

## Changes

| # | File | Change |
|---|------|--------|
| 1 | `src/lib/screenshot-url.ts` | Add optional `width` param (default 800); switch URL from `/object/` to `/render/image/` with `?width=...&quality=75` |
| 2 | `src/components/work/WebsiteShowcaseGrid.tsx` | Pass `width=900` for the larger portfolio grid cards |
| 3 | `src/components/offer/SocialProofSection.tsx` | Pass `width=600` for the smaller mini cards |
| 4 | `src/components/home/ClientWebsiteGrid.tsx` | Pass `width=700` for homepage grid |
| 5 | `src/pages/LandingPage.tsx` | Update fallback URLs and dynamic calls to use the optimized URL pattern |

## Technical Detail

The `getScreenshotUrl` function becomes:

```typescript
export function getScreenshotUrl(websiteUrl: string, width = 800): string {
  const sanitized = websiteUrl
    .replace(/https?:\/\//, '')
    .replace(/\//g, '')
    .replace(/\./g, '');
  return `https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/render/image/public/site-screenshots/${sanitized}-full.png?width=${width}&quality=75`;
}
```

This cuts image payload by ~80-90% with no visible quality loss at display sizes.

