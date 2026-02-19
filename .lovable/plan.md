

# Root Cause: thum.io Cannot Render Your React Sites

## The Problem (confirmed with evidence)

thum.io returns **completely blank white images** for hunterinsight.com.au, inglebrown.sited.co, and wisdomeducation.org. These are React single-page applications that require JavaScript execution to render content. thum.io's free capture engine does not wait for JavaScript to execute, so it captures a blank `<div id="root"></div>` page.

This is not a CSS, dimension, or scroll issue. The screenshots are literally empty white images being displayed in the MacBook frames.

## The Fix: Hybrid Screenshot Strategy

Since thum.io works fine for static/server-rendered sites but fails on your React SPAs, the fix uses a two-tier approach:

### Tier 1: Store static full-page screenshots for your 3 Sited-built websites
- Upload pre-captured full-page screenshots (PNG/WebP) of Hunter Insight, Ingle Brown, and Wisdom Education to the project's file storage
- These screenshots will be taken at 1440px width, capturing the entire homepage
- The component will reference these stored images directly instead of calling thum.io

### Tier 2: Keep thum.io for all other client sites
- The remaining 9 sites (Bloom Floristry, Urban Fitness, etc.) are either static sites or placeholder URLs
- thum.io works fine for these, so no change needed

### Implementation Details

**Step 1: Create an edge function to capture screenshots**
Build a `capture-screenshot` edge function that uses a proper headless browser API (via microlink.io's free API endpoint) to capture full-page screenshots of the 3 problematic sites. Store the results in file storage.

Alternatively (simpler and more reliable): add a `screenshotUrl` override field to the `clientSites` array, allowing you to specify a custom image URL for any site where thum.io fails.

**Step 2: Update the clientSites data structure**

```typescript
const clientSites = [
  { 
    name: "Hunter Insight", 
    url: "https://hunterinsight.com.au",
    // Override: use stored screenshot instead of thum.io
    screenshot: "/screenshots/hunterinsight-full.webp" 
  },
  { 
    name: "Ingle & Brown", 
    url: "https://inglebrown.sited.co",
    screenshot: "/screenshots/inglebrown-full.webp" 
  },
  { 
    name: "Wisdom Education", 
    url: "https://wisdomeducation.org",
    screenshot: "/screenshots/wisdomeducation-full.webp" 
  },
  // These use thum.io (no screenshot override)
  { name: "Bloom Floristry", url: "https://bloomfloristry.com" },
  // ... rest unchanged
];
```

**Step 3: Update MacBookCard to use the override**

```typescript
const screenshotUrl = site.screenshot 
  ? site.screenshot 
  : `https://image.thum.io/get/width/1440/fullpage/noanimate/${site.url}`;
```

**Step 4: Capture and store the screenshots**
Create a one-time edge function `capture-site-screenshots` that:
1. Calls `https://api.microlink.io/?url={site}&screenshot=true&fullPage=true&viewport.width=1440` for each of the 3 sites
2. Downloads the resulting screenshot image
3. Stores it in the project's file storage bucket
4. Returns the public URLs

The component then loads these stored images directly -- fast, reliable, and always correct.

### Why This Works
- Microlink.io's free API uses a real headless Chromium browser that fully executes JavaScript
- The captured screenshots will show the sites exactly as they appear on a desktop browser (correct 100vh, all buttons, all content)
- Stored screenshots load instantly (no external API call on every page view)
- The scroll animation works identically since it just animates a tall image

### Files to Create/Edit
- `supabase/functions/capture-site-screenshots/index.ts` -- one-time capture function
- `src/components/work/WebsiteShowcaseGrid.tsx` -- add screenshot override logic
- Storage bucket for screenshots

### Alternative (simpler, no edge function)
If you prefer, you can manually take full-page screenshots of the 3 sites using Chrome DevTools (Ctrl+Shift+P > "Capture full size screenshot"), save them as WebP files, and place them in the `public/screenshots/` folder. The component change is the same -- just reference the local files instead of thum.io.
