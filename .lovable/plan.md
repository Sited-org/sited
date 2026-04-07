

# SEO & Indexing Audit — Issues Found & Fixes

## Issues Identified

### 1. Sitemap is incomplete and outdated
The `sitemap.xml` only lists 5 URLs but the site has 10+ public routes: `/`, `/features`, `/custom-websites`, `/portfolio`, `/work`, `/contact`, `/offer`, `/go`, `/free`, `/blog`, `/policies`, `/contact/offers`. Missing pages won't be indexed efficiently.

Also, `/services` is listed in the sitemap but that route doesn't exist in `App.tsx` — it's a dead link that will return a soft 404.

### 2. Sitemap has no `<lastmod>` dates
Google prioritizes pages with `<lastmod>` timestamps. Without them, crawlers don't know when content changed and may re-crawl less frequently.

### 3. Missing canonical URL tags
No `<link rel="canonical">` tag in `index.html` or set dynamically. This is critical for SPA sites where the same content can appear under different URLs (e.g., `/work` and `/portfolio` serve the same component). Google may split ranking signals between duplicates.

### 4. Duplicate routes serving same content (`/work` and `/portfolio`)
Both routes render the `<Work />` component. Without a canonical tag, Google sees two pages with identical content — a classic duplicate content penalty risk.

### 5. `og:url` meta tag is missing
The Open Graph tags include `og:type`, `og:title`, `og:description`, `og:image` but no `og:url`. Social platforms and crawlers use this to determine the canonical URL for sharing.

### 6. `usePageSEO` hook doesn't set `og:url` or canonical
The hook only updates title, description, og:title/description, and twitter:title/description. It should also set `og:url` and a dynamic `<link rel="canonical">`.

### 7. Structured data uses `sited.lovable.app` not custom domain
If you have or plan to use a custom domain, the JSON-LD `url` fields should match. Currently hardcoded to `https://sited.lovable.app`.

### 8. `robots.txt` doesn't block admin/portal routes
While these are SPA routes (not server-rendered), adding `Disallow` directives for `/admin`, `/dev`, `/client-portal` signals to crawlers these aren't public content pages.

---

## Proposed Fixes

| # | File | Change |
|---|------|--------|
| 1 | `public/sitemap.xml` | Replace with complete sitemap: all public routes, remove dead `/services`, add `<lastmod>` dates |
| 2 | `public/robots.txt` | Add `Disallow` for `/admin`, `/dev`, `/client-portal` routes |
| 3 | `src/hooks/usePageSEO.ts` | Extend hook to set `og:url`, `<link rel="canonical">` dynamically using current pathname |
| 4 | `index.html` | Add base `og:url` and `<link rel="canonical">` meta tags so the hook can update them |
| 5 | `src/App.tsx` | Add a redirect from `/work` to `/portfolio` (or vice versa) to eliminate duplicate content — one canonical URL |

### Fix details

**Sitemap** — will include: `/`, `/features`, `/custom-websites`, `/portfolio`, `/contact`, `/contact/offers`, `/offer`, `/go`, `/free`, `/blog`, `/policies`. Client-portal and admin excluded.

**Canonical handling** — `usePageSEO` will create/update a `<link rel="canonical">` element and `og:url` meta tag on every route change, using `window.location.origin + pathname`.

**Duplicate route** — redirect `/work` → `/portfolio` using React Router's `Navigate` component so there's one canonical URL. The sitemap will only list `/portfolio`.

