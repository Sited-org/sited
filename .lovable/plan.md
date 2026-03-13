

## Animation Timing & Ingle Brown Screenshot Fix

### 1. Animation Start Time (both components)

**Files:** `src/components/work/WebsiteShowcaseGrid.tsx` and `src/components/offer/SocialProofSection.tsx`

Change the stagger delay formula in both `MacBookCard` and `MiniMacBookCard`:

- **Current:** `index * 1000 + 1500` (WebsiteShowcaseGrid) / `index * 1200 + 1500` (SocialProofSection)
- **New:** `index * 500 + 750` -- 0.75s base delay, 0.5s offset between each card

### 2. Ingle Brown Screenshot Issue

The Ingle Brown site (`inglebrown.sited.co`) is a React SPA. The microlink.io capture uses `fullPage=true` with a 5-second wait, but React SPAs with sticky/fixed headers can cause the header to render at the bottom of a full-page capture due to how the browser composites fixed-position elements during a full-page screenshot stitch.

**Fix:** Re-capture the Ingle Brown screenshot with `scroll=true` and a longer wait time to allow the SPA to fully hydrate, and add `waitUntil=networkidle` to ensure all assets load before capture. The edge function `capture-site-screenshots` will be updated:

- Add `&scroll=true` to the microlink URL to handle sticky headers properly
- Increase `waitForTimeout` from 5000 to 8000ms for better React hydration
- After updating the function, re-run it to generate a corrected screenshot

### Technical Details

**WebsiteShowcaseGrid.tsx (line 72):**
```
// Before
const timer = setTimeout(() => setScrollActive(true), index * 1000 + 1500);
// After
const timer = setTimeout(() => setScrollActive(true), index * 500 + 750);
```

**SocialProofSection.tsx (line 63):**
```
// Before
const timer = setTimeout(() => setScrollActive(true), index * 1200 + 1500);
// After
const timer = setTimeout(() => setScrollActive(true), index * 500 + 750);
```

**capture-site-screenshots/index.ts (line 33):**
Update the microlink URL to include scroll and longer timeout parameters to fix sticky header rendering in full-page captures.

