
## Public Sitemap Builder Tool

### What you get

A new **Tools** dropdown in the main navigation containing a **Sitemap Builder** — a free, public version of the existing admin sitemap canvas. Anyone can build a sitemap visually. To download the PDF, they provide their name and email (creating a lead). After download, a pop-up offers to get it built professionally, linking to `/contact/offers`.

---

### Navigation changes

- Add "Tools" to the navbar as a dropdown (between Blog and Contact)
- Dropdown contains one item: "Sitemap Builder" → `/tools/sitemap-builder`
- Mobile menu: "Tools" expands inline with the same link

### New page: `/tools/sitemap-builder`

A new `PublicSitemapBuilder` page that reuses the core sitemap canvas logic from `AdminSitemapBuilder` but **removes all admin features**:

**Removed:**
- Back arrow navigating to `/admin/sitemaps`
- "Link client" dropdown (lead selector)
- "Import" button (import from discovery)
- "Webs" panel toggle + FloatingFunctionsPanel
- "Save" button (no database persistence for public users)

**Kept:**
- Sitemap name input
- Section sidebar (add/remove/rename sections)
- Full canvas with pages, children, tabs, notes, connectors
- Undo/Redo
- Node type switching (page, popup, tab, note)
- Drag reordering

**Modified:**
- **PDF download button** — clicking opens a lead capture dialog (first name, last name, email). On submit, it calls `save-partial-lead` to create/update the lead, then triggers the PDF download.
- **Post-download upsell** — after the PDF downloads, a dialog appears: "Get it done professionally — We have a special offer for you" with a CTA button that navigates to `/contact/offers`.
- Page wrapped in the site `Layout` component (Navbar + Footer)
- No auth required

### Database / RLS

No new tables needed. The public builder operates entirely in local state — sitemaps are never saved to `project_sitemaps`. The only database interaction is the existing `save-partial-lead` edge function (already public, rate-limited, and secured).

Existing `project_sitemaps` RLS remains unchanged — public users cannot read or write to it.

### Files created/modified

| File | Action |
|------|--------|
| `src/pages/PublicSitemapBuilder.tsx` | **New** — public sitemap builder (forked from AdminSitemapBuilder, admin features stripped) |
| `src/components/layout/Navbar.tsx` | **Edit** — add Tools dropdown |
| `src/App.tsx` | **Edit** — add `/tools/sitemap-builder` route |

### Technical details

- The public builder will be a standalone component (~800 lines) forked from the admin version. Shared types and helper functions (node styles, color palettes, TabNodes component) will be duplicated to keep the public page fully independent of admin code.
- The `generateSitemapPDF` function from `src/lib/sitemap-pdf.ts` is already a standalone utility — it will be used directly.
- Lead capture form validates: first name (required), last name (required), email (required, format validated). The combined name is sent as `name` to `save-partial-lead`.
- The upsell dialog uses the site's dark theme with gold accent styling for the CTA.
