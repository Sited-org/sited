

# Remove `/free` Page & Clean Up SEO Blockers

## Changes

### 1. Delete `/free` page
- **Delete** `src/pages/free/index.tsx` (the entire directory)

### 2. Remove route & import from `src/App.tsx`
- Remove the `FreeLandingPage` lazy import (line 48)
- Remove the `/free` route (line 87)

### 3. Remove `/free` from sitemap (`public/sitemap.xml`)
- Delete the `/free` URL entry

### 4. Clean up `index.html` SEO issues
- Remove empty lines 84-93 (leftover whitespace)
- Add `<meta name="robots" content="index, follow">` as default
- Add `<link rel="canonical">` base tag (the `usePageSEO` hook will update it per-route)

### 5. Remove `/free` reference from `usePackageSavings` if present
The hook was imported by the `/free` page. If no other page uses it, keep it (other pages like `/offer` use it). Just confirming no orphaned `/free`-specific code remains.

## Files changed

| # | File | Change |
|---|------|--------|
| 1 | `src/pages/free/index.tsx` | **Delete** |
| 2 | `src/App.tsx` | Remove `FreeLandingPage` import + route |
| 3 | `public/sitemap.xml` | Remove `/free` entry |
| 4 | `index.html` | Add default robots meta, canonical link, remove empty lines |

