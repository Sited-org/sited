

## Problem

Two issues:

1. **Slow proposal generation**: The preview step dynamically imports `pdfjs-dist` (~2MB), loads its web worker from a CDN, then renders each page at 2x scale to canvas and converts to PNG data URLs. This is extremely slow — especially on first run when the library hasn't been cached.

2. **Stripe product sync**: Products saved in admin settings call `sync-product-stripe` which correctly creates/updates Stripe products and prices. No issue here — this already works. The deposit amount is stored in `system_settings` but is NOT synced to Stripe as its own product (it's just an internal billing split). If you want the deposit to also be a Stripe line item, that's a separate concern.

## Plan

### 1. Remove `pdfjs-dist` and use iframe-based preview instead

The heaviest bottleneck is importing and rendering via `pdfjs-dist`. Replace it with a simple `<iframe>` pointing at the blob URL — browsers have built-in PDF renderers that are instant and support scrolling/paging natively.

**File**: `src/components/admin/lead-profile/build-flow/ProposalGenerator.tsx`

- Remove the `pdfjs-dist` import and all canvas rendering logic (lines 541-559)
- Remove `previewPages`, `currentPage`, `totalPages` state
- In `handleShowPreview`: just generate the blob, create a blob URL, set `showPreview = true`
- In the preview UI: replace the `<img>` + page arrows with a single `<iframe src={previewUrl}>` that fills the dialog. The browser's native PDF viewer handles paging, zoom, and scrolling
- This eliminates the ~3-5 second rendering delay entirely

**File**: `package.json`
- Remove `pdfjs-dist` dependency (no longer needed)

### 2. Optimize PDF generation itself

**File**: `src/components/admin/lead-profile/build-flow/ProposalGenerator.tsx`

- Reduce gradient divider steps from 20 to 8 (visual difference is negligible, saves draw calls)
- Use `compress: true` already set — good
- Lazy-load `jspdf` only once and cache the import (it's already dynamic, but we can memoize it)

### 3. Ensure Stripe sync covers all product types

The existing `sync-product-stripe` edge function and `useProducts` hook already handle creating/updating Stripe products and prices for any product type. When an admin changes a price in the Products settings, it syncs to Stripe automatically. No changes needed here — this is already working correctly.

### Summary

| File | Change |
|------|--------|
| `ProposalGenerator.tsx` | Replace pdfjs-dist canvas rendering with native iframe PDF viewer; reduce gradient steps |
| `package.json` | Remove `pdfjs-dist` dependency |

The primary speedup comes from eliminating `pdfjs-dist` entirely. The PDF generation via `jspdf` itself is fast (~200ms); the bottleneck was the subsequent parsing and canvas rendering.

