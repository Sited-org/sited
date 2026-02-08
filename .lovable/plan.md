

## SEO, Sitemap, Image Optimization & Work Page Performance

### 1. Semantic HTML Heading Structure (All Pages)

Currently most pages use proper `h1`/`h2` tags but some are inconsistent. Every public page will get a clear heading hierarchy:

**Home (`/`)**
- `h1`: "We build websites that convert." (already correct)
- `h2`: "Everything you need to succeed online" (Services section), "Results that speak." (Featured Work), "Your digital partner for growth." (About), "Let's build something extraordinary." (CTA)
- `h3`: Service card titles, process step titles, project names

**Services (`/services`)**
- `h1`: "One thing done right." (already correct)
- `h2`: Showcase section titles ("Let clients book themselves", "Know your customers", etc.) -- already correct
- No changes needed here

**Work (`/work`)**
- `h1`: "Websites that perform." (already correct)
- `h2`: "Your project could be next." (CTA) -- already correct
- `h3`: Individual testimonial company names -- already correct

**Contact (`/contact`)**
- `h1`: "Let's build something great together" (already correct)
- `h2`: "Send us a message", "Get in touch" -- already correct

**Footer**
- Change the footer CTA `h2` to `h3` since it repeats across pages and should not compete with page-level headings

### 2. Meta Tags & Per-Page SEO

Create a reusable `SEOHead` component using `document.title` and meta tag manipulation to set unique `<title>` and `<meta name="description">` for each page:

| Page | Title | Description |
|------|-------|-------------|
| `/` | Sited \| AI-Powered Web Design & Development | (keep current) |
| `/services` | Services \| Sited - Web Design, CRM & Booking | We build websites that book appointments, manage customers, and accept payments. All in one place. |
| `/work` | Our Work \| Sited - Client Results & Testimonials | Real projects with real results. See websites we've built for businesses like yours. |
| `/contact` | Contact \| Sited - Start Your Web Project | Get in touch to start your web project. Respond within 24 hours. |
| `/client-portal` | Members Login \| Sited | Secure client portal login for Sited members. |

### 3. Sitemap Generation

Create a `public/sitemap.xml` file listing the 5 crucial public pages with proper priority and changefreq values:

- `/` -- priority 1.0, weekly
- `/services` -- priority 0.8, monthly
- `/work` -- priority 0.8, weekly
- `/contact` -- priority 0.7, monthly
- `/client-portal` -- priority 0.3, monthly

Update `public/robots.txt` to include a `Sitemap:` directive pointing to `https://sited.lovable.app/sitemap.xml`.

### 4. Image Optimization for Faster Loading

Replace all external Unsplash/Pexels image URLs with WebP format parameters where supported, and add `width`/`height` attributes to prevent layout shift:

- Unsplash images: append `&fm=webp` to URLs (Unsplash supports WebP via their CDN)
- Fallback thumbnails in Work page and Index page: update all `?w=1200&h=800&fit=crop` to `?w=1200&h=800&fit=crop&fm=webp&q=75`
- Hero video poster: update to WebP format
- Add `width` and `height` HTML attributes to `<img>` tags for CLS (Cumulative Layout Shift) prevention
- Add `decoding="async"` to all non-critical images

### 5. Work Page Load Speed Improvements

- **Lazy Vimeo iframes**: Already lazy (only loads on play click) -- no change needed
- **Thumbnail optimization**: Use `vumbnail.com` WebP thumbnails (append `_large.jpg` for higher quality without oversizing)
- **Reduce initial render count**: Lower `INITIAL_COUNT` from 6 to 4 to reduce DOM nodes on first paint
- **Simplify scroll animations**: Replace `framer-motion` `whileInView` on each card with a lightweight CSS `@keyframes` fade-in using `IntersectionObserver`, avoiding JS-driven animation overhead
- **Remove unused motion imports**: Clean up any unused framer-motion features on the Work page
- **Add `will-change: transform` only on hover** to avoid GPU memory overhead at rest

### 6. Structured Data (JSON-LD)

Add structured data to `index.html` for better search engine understanding:

- **Organization schema**: Business name, logo, contact info, social links
- **WebSite schema**: Search action, URL

---

### Technical Details

**New file:**
- `src/hooks/usePageSEO.ts` -- Custom hook that sets `document.title` and updates meta description on mount

**Modified files:**
- `index.html` -- Add JSON-LD structured data, keep existing meta as defaults
- `public/robots.txt` -- Add Sitemap directive
- `public/sitemap.xml` -- New static sitemap file
- `src/pages/Index.tsx` -- Add `usePageSEO`, update image URLs to WebP
- `src/pages/Services.tsx` -- Add `usePageSEO`
- `src/pages/Work.tsx` -- Add `usePageSEO`, reduce initial count, optimize animations
- `src/pages/Contact.tsx` -- Add `usePageSEO`
- `src/pages/ClientPortalLogin.tsx` -- Add `usePageSEO`
- `src/components/work/TestimonialCard.tsx` -- Replace framer-motion scroll animation with CSS, add image dimensions
- `src/components/layout/Footer.tsx` -- Change `h2` to `h3`

**No functional or cosmetic changes** -- all existing features (Vimeo playback, glassmorphism cards, alternating layout, chat, onboarding) remain untouched.
