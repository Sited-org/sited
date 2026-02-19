

# Fix: Replace Iframes with Full-Page Screenshots

## The Problem
CSS `100vh` inside an iframe equals the iframe element's height. Setting the iframe to 12,000px causes hero sections to stretch to 12,000px. This is an inherent browser limitation -- not something fixable by changing dimensions or by modifying the client websites.

## The Solution
Replace the live iframes with **full-page screenshot images** from a screenshot API. A screenshot captures the page as it renders in a real browser (with correct `100vh = ~900px`), and the resulting image can be freely scrolled via CSS animation.

## Implementation

### Step 1: Switch to Screenshot-Based Rendering
Update `MacBookCard` in `WebsiteShowcaseGrid.tsx`:
- Remove the iframe element entirely
- Use the `thum.io` API (already referenced in the fallback code) to fetch a full-page screenshot at 1440px width
- URL format: `https://image.thum.io/get/width/1440/fullpage/noanimate/{site.url}`
- Render the screenshot as an `<img>` tag inside the scrolling wrapper

### Step 2: Scroll the Screenshot Image
- The image will be full-page height, naturally containing the entire homepage
- The existing CSS `scrollIframe` keyframe animation will translate the image upward, revealing the full page
- `--scroll-distance` will be calculated from the image's natural height minus the viewport window height
- Pause-on-hover behavior stays identical

### Step 3: Loading States
- Show a skeleton/pulse placeholder while the screenshot loads
- Use the `onLoad` event on the `<img>` to detect when it's ready
- Stagger the scroll start by 1s per card (unchanged)

### Step 4: Cleanup
- Remove iframe-related state (`iframeRef`, `iframeFailed`, iframe error detection logic)
- Remove the `sandbox` attribute handling
- Keep the `thum.io` URL pattern already in the codebase

## What This Fixes
- Hero sections render at their correct height (as seen on a real desktop browser)
- Buttons, text, and spacing all match the live website exactly
- The full homepage is captured and scrollable
- No dependency on iframe embedding permissions (X-Frame-Options no longer matters)

## Trade-off
- Screenshots are static snapshots, not live content -- but for a portfolio showcase this is actually preferable (consistent, fast, no loading jank)
- Screenshots may be cached/delayed by a few hours by the thum.io service

## Technical Details

```text
Before (iframe):
  iframe height: 12000px --> 100vh = 12000px --> hero stretches

After (screenshot):
  Real browser captures page --> 100vh = 900px --> hero is correct
  Image scrolled via CSS translateY animation
```

Key code change in `MacBookCard`:
- Replace `<iframe>` with `<img src={screenshotUrl} />` inside the scrolling wrapper
- Calculate scroll distance from the image's rendered height vs. the 16:10 viewport
- Everything else (MacBook chrome, hover overlay, stagger, responsive counts) stays the same
