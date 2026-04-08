

# Make Blog Posts Fully Indexable for SEO & AEO

## Problem
Individual blog posts (`/blog/:slug`) are invisible to Google because:
1. They're not listed in `sitemap.xml` (only `/blog` is)
2. No `Article` JSON-LD structured data — Google can't generate rich results or AEO answers
3. The sitemap is static and can't grow as new posts are created

## Solution

### 1. Dynamic sitemap edge function
Create a backend function at `/sitemap.xml` that queries the `blog_posts` table and generates a complete sitemap including all published blog post URLs alongside the existing static pages.

### 2. Article JSON-LD on each blog post
Add structured data to `BlogPost.tsx` so Google sees each post as a proper `Article` with author, date, image, and description — key for AEO and rich snippets.

### 3. Update `index.html` sitemap reference
Point the sitemap URL to the dynamic edge function endpoint.

---

## Technical Details

### Edge function: `generate-sitemap`
- Queries `blog_posts` where `status = 'published'`
- Combines with hardcoded static pages (same list as current `sitemap.xml`)
- Returns XML with proper `Content-Type: application/xml`
- Each blog post gets `<lastmod>` from its `updated_at` field

### BlogPost.tsx — Article JSON-LD
Inject a `<script type="application/ld+json">` into the head via `useEffect` with:
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "post.title",
  "description": "post.excerpt",
  "image": "post.cover_image_url",
  "author": { "@type": "Person", "name": "post.author_name" },
  "datePublished": "post.published_at",
  "dateModified": "post.updated_at",
  "publisher": { "@type": "Organization", "name": "Sited" }
}
```
Cleanup on unmount to avoid stale data.

### robots.txt
Update the `Sitemap:` directive to point to the edge function URL.

## Files Changed

| # | File | Change |
|---|------|--------|
| 1 | `supabase/functions/generate-sitemap/index.ts` | **New** — dynamic sitemap from DB + static pages |
| 2 | `src/pages/BlogPost.tsx` | Add Article JSON-LD structured data via useEffect |
| 3 | `public/robots.txt` | Update Sitemap URL to edge function |
| 4 | `public/sitemap.xml` | Keep as fallback but edge function is primary |

