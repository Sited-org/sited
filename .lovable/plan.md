

## Problem

The iframe `#page=N` fragment hint is unreliable — most embedded PDF viewers ignore it or only honor it on initial load. Changing the `key` forces the iframe to remount, but the browser's viewer just reloads the same blob and lands on page 1 every time. Result: every page arrow click shows the same first page.

## Solution: Render each page as a canvas image during PDF generation

Instead of fighting with iframe page anchors, we render each PDF page to a data-URL image at generation time using `pdfjs-dist` in a minimal, efficient way — **one render pass, 1x scale** (not the old 2x approach). This gives us an array of page images that can be displayed instantly with arrow navigation.

### Why not just let the iframe scroll?
The embedded PDF viewer inside a dialog doesn't reliably show native scrollbar/page controls. Custom arrow navigation with pre-rendered page images is the only approach that guarantees correct per-page display across all browsers.

### Implementation

**File**: `package.json`
- Re-add `pdfjs-dist` (needed for reliable page-by-page rendering)

**File**: `src/components/admin/lead-profile/build-flow/ProposalGenerator.tsx`

1. **Add a `renderPagesToImages` helper** after `generatePdfBlob`:
   - Takes the PDF blob, loads it with `pdfjs-dist` (worker disabled — runs on main thread, fast for 2-3 page docs)
   - Renders each page at 1x scale to a `<canvas>`, converts to PNG data URL
   - Returns `string[]` of page images

2. **Update state**: Replace `previewUrl` with `previewPages: string[]` (array of data URLs)

3. **Update `handleShowPreview`**:
   - Call `generatePdfBlob()` → get blob + pageCount
   - Call `renderPagesToImages(blob)` → get page image array
   - Store the blob separately (for sending) and the images for display
   - Set `previewPages`, `previewPage = 1`, `previewTotalPages`

4. **Update preview UI**:
   - Replace `<iframe>` with `<img src={previewPages[previewPage - 1]}>` inside a container styled to A4 aspect ratio
   - Arrow buttons update `previewPage` — the image swaps instantly (no reload, no iframe)

5. **Performance notes**:
   - Worker disabled (`GlobalWorkerOptions.workerSrc = ''`) — avoids CDN fetch
   - 1x scale rendering (~150ms per page for A4)
   - Only runs when "Preview" is clicked, not on dialog open
   - Total overhead: ~300ms for a 2-page SOW (vs 3-5s with the old 2x canvas approach)

### Summary

| File | Change |
|------|--------|
| `package.json` | Re-add `pdfjs-dist` |
| `ProposalGenerator.tsx` | Add `renderPagesToImages` helper, replace iframe with `<img>` per-page display, keep blob for send |

